import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	checkSessionCredits,
	checkAndConsumeCredit,
	recordSessionCredit,
	resetSessionCredits,
} from "./session-credits";

// Mock Redis — always returns null (no cache)
vi.mock("./redis", () => ({
	getRedis: () => null,
}));

function createMockDb(org: {
	sessionCreditsUsed: number;
	sessionCreditsLimit: number | null;
	aiAnthropicKey: string | null;
} | null) {
	return {
		organization: {
			findUnique: vi.fn().mockResolvedValue(org),
			update: vi.fn().mockResolvedValue(org),
			updateMany: vi.fn().mockImplementation(async (args: { where: { sessionCreditsUsed?: { lt: number } }; data: { sessionCreditsUsed: { increment: number } } }) => {
				if (!org) return { count: 0 };
				const limit = args.where.sessionCreditsUsed?.lt;
				if (limit !== undefined && org.sessionCreditsUsed >= limit) {
					return { count: 0 }; // at limit, update fails
				}
				return { count: 1 }; // success
			}),
		},
	};
}

describe("checkSessionCredits", () => {
	it("allows when within limit", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 5,
			sessionCreditsLimit: 10,
			aiAnthropicKey: null,
		});

		const result = await checkSessionCredits("org-1", db);
		expect(result.allowed).toBe(true);
		expect(result.used).toBe(5);
		expect(result.limit).toBe(10);
		expect(result.remaining).toBe(5);
	});

	it("blocks when at limit", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 10,
			sessionCreditsLimit: 10,
			aiAnthropicKey: null,
		});

		const result = await checkSessionCredits("org-1", db);
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it("allows BYOK orgs regardless of credits", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 100,
			sessionCreditsLimit: 10,
			aiAnthropicKey: "encrypted-key-here",
		});

		const result = await checkSessionCredits("org-1", db);
		expect(result.allowed).toBe(true);
	});

	it("allows unlimited plans (null limit)", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 999,
			sessionCreditsLimit: null,
			aiAnthropicKey: null,
		});

		const result = await checkSessionCredits("org-1", db);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBeNull();
	});

	it("fail-open when org not found", async () => {
		const db = createMockDb(null);

		const result = await checkSessionCredits("nonexistent", db);
		expect(result.allowed).toBe(true);
	});
});

describe("checkAndConsumeCredit", () => {
	it("consumes credit when within limit", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 5,
			sessionCreditsLimit: 10,
			aiAnthropicKey: null,
		});

		const result = await checkAndConsumeCredit("org-1", 1.0, db);
		expect(result.allowed).toBe(true);
		expect(result.consumed).toBe(true);
		expect(result.used).toBe(6); // 5 + 1
		expect(db.organization.updateMany).toHaveBeenCalledWith({
			where: {
				id: "org-1",
				sessionCreditsUsed: { lt: 10 },
			},
			data: {
				sessionCreditsUsed: { increment: 1.0 },
			},
		});
	});

	it("blocks and does not consume when at limit", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 10,
			sessionCreditsLimit: 10,
			aiAnthropicKey: null,
		});

		const result = await checkAndConsumeCredit("org-1", 1.0, db);
		expect(result.allowed).toBe(false);
		expect(result.consumed).toBe(false);
	});

	it("consumes 0.5 credit for AI interview", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 9,
			sessionCreditsLimit: 10,
			aiAnthropicKey: null,
		});

		const result = await checkAndConsumeCredit("org-1", 0.5, db);
		expect(result.allowed).toBe(true);
		expect(result.consumed).toBe(true);
		expect(result.used).toBe(9.5);
	});

	it("bypasses for BYOK orgs without consuming", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 100,
			sessionCreditsLimit: 10,
			aiAnthropicKey: "encrypted",
		});

		const result = await checkAndConsumeCredit("org-1", 1.0, db);
		expect(result.allowed).toBe(true);
		expect(result.consumed).toBe(false);
		expect(db.organization.updateMany).not.toHaveBeenCalled();
	});

	it("bypasses for unlimited plans without consuming", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 50,
			sessionCreditsLimit: null,
			aiAnthropicKey: null,
		});

		const result = await checkAndConsumeCredit("org-1", 1.0, db);
		expect(result.allowed).toBe(true);
		expect(result.consumed).toBe(false);
	});
});

describe("recordSessionCredit", () => {
	it("increments credits atomically", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 5,
			sessionCreditsLimit: 10,
			aiAnthropicKey: null,
		});

		await recordSessionCredit("org-1", 1.0, db);
		expect(db.organization.update).toHaveBeenCalledWith({
			where: { id: "org-1" },
			data: { sessionCreditsUsed: { increment: 1.0 } },
		});
	});
});

describe("resetSessionCredits", () => {
	it("resets credits to 0", async () => {
		const db = createMockDb({
			sessionCreditsUsed: 8,
			sessionCreditsLimit: 10,
			aiAnthropicKey: null,
		});

		await resetSessionCredits("org-1", db);
		expect(db.organization.update).toHaveBeenCalledWith({
			where: { id: "org-1" },
			data: { sessionCreditsUsed: 0 },
		});
	});
});
