import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Re-declare schemas locally to test validation logic ──────────────
// (The source file doesn't export them, so we test the same Zod logic)
const VALID_NODE_TYPES = [
	"startEvent",
	"endEvent",
	"task",
	"exclusiveGateway",
	"parallelGateway",
] as const;

const NewNodeSchema = z.object({
	id: z.string().min(1),
	type: z.enum(VALID_NODE_TYPES).catch("task"),
	label: z.string().min(1),
	lane: z.string().optional(),
	connectFrom: z.string().nullable().optional(),
	connectTo: z.string().nullable().optional(),
});

const OutOfScopeSchema = z.object({
	topic: z.string().min(1),
	likelyProcess: z.string().min(1),
});

const ExtractionResultSchema = z.object({
	newNodes: z.array(NewNodeSchema).catch([]),
	updatedNodes: z
		.array(
			z.object({
				id: z.string().min(1),
				label: z.string().optional(),
			}),
		)
		.catch([]),
	outOfScope: z.array(OutOfScopeSchema).catch([]),
});

// ─── Re-implement formatTranscriptWindow for testing ──────────────────
interface TranscriptEntry {
	speaker: string;
	text: string;
	timestamp: number;
}

function formatTranscriptWindow(
	entries: TranscriptEntry[],
	windowMinutes = 5,
): string {
	if (entries.length === 0) return "(no transcript yet)";

	const latestTimestamp = entries[entries.length - 1].timestamp;
	const windowStart = latestTimestamp - windowMinutes * 60;

	const windowEntries = entries.filter((e) => e.timestamp >= windowStart);

	return windowEntries
		.map((e) => {
			const mins = Math.floor(e.timestamp / 60);
			const secs = Math.floor(e.timestamp % 60);
			return `[${mins}:${secs.toString().padStart(2, "0")}] ${e.speaker}: ${e.text}`;
		})
		.join("\n");
}

// ─── Zod Schema Tests ─────────────────────────────────────────────────
describe("ExtractionResultSchema", () => {
	it("parses valid LLM output correctly", () => {
		const validInput = {
			newNodes: [
				{
					id: "node_1",
					type: "task",
					label: "Review document",
					lane: "Legal",
					connectFrom: "node_0",
				},
			],
			updatedNodes: [{ id: "node_0", label: "Updated label" }],
			outOfScope: [
				{ topic: "IT infrastructure", likelyProcess: "IT Management" },
			],
		};

		const result = ExtractionResultSchema.parse(validInput);
		expect(result.newNodes).toHaveLength(1);
		expect(result.newNodes[0].type).toBe("task");
		expect(result.updatedNodes).toHaveLength(1);
		expect(result.outOfScope).toHaveLength(1);
	});

	it("catches invalid node type and defaults to 'task'", () => {
		const input = {
			newNodes: [
				{
					id: "n1",
					type: "invalidType",
					label: "Some task",
				},
			],
			updatedNodes: [],
			outOfScope: [],
		};

		const result = ExtractionResultSchema.parse(input);
		expect(result.newNodes[0].type).toBe("task");
	});

	it("catches missing newNodes and defaults to empty array", () => {
		const input = {
			updatedNodes: [],
			outOfScope: [],
		};

		const result = ExtractionResultSchema.parse(input);
		expect(result.newNodes).toEqual([]);
	});

	it("catches malformed newNodes array and defaults to empty", () => {
		const input = {
			newNodes: "not an array",
			updatedNodes: [],
			outOfScope: [],
		};

		const result = ExtractionResultSchema.parse(input);
		expect(result.newNodes).toEqual([]);
	});

	it("falls back to empty array when nodes have empty id (catch behavior)", () => {
		const input = {
			newNodes: [{ id: "", type: "task", label: "No ID" }],
			updatedNodes: [],
			outOfScope: [],
		};

		// .catch([]) on newNodes array causes fallback to [] on validation failure
		const result = ExtractionResultSchema.parse(input);
		expect(result.newNodes).toEqual([]);
	});

	it("falls back to empty array when nodes have empty label (catch behavior)", () => {
		const input = {
			newNodes: [{ id: "n1", type: "task", label: "" }],
			updatedNodes: [],
			outOfScope: [],
		};

		const result = ExtractionResultSchema.parse(input);
		expect(result.newNodes).toEqual([]);
	});

	it("accepts all valid node types", () => {
		for (const type of VALID_NODE_TYPES) {
			const input = {
				newNodes: [{ id: "n1", type, label: "Test" }],
				updatedNodes: [],
				outOfScope: [],
			};
			const result = ExtractionResultSchema.parse(input);
			expect(result.newNodes[0].type).toBe(type);
		}
	});

	it("handles optional fields (lane, connectFrom, connectTo)", () => {
		const input = {
			newNodes: [
				{
					id: "n1",
					type: "task",
					label: "Minimal",
				},
			],
			updatedNodes: [],
			outOfScope: [],
		};

		const result = ExtractionResultSchema.parse(input);
		expect(result.newNodes[0].lane).toBeUndefined();
		expect(result.newNodes[0].connectFrom).toBeUndefined();
	});

	it("handles null connectFrom/connectTo", () => {
		const input = {
			newNodes: [
				{
					id: "n1",
					type: "task",
					label: "Test",
					connectFrom: null,
					connectTo: null,
				},
			],
			updatedNodes: [],
			outOfScope: [],
		};

		const result = ExtractionResultSchema.parse(input);
		expect(result.newNodes[0].connectFrom).toBeNull();
		expect(result.newNodes[0].connectTo).toBeNull();
	});
});

// ─── JSON Parsing (simulating LLM output) ─────────────────────────────
describe("LLM output parsing", () => {
	it("handles markdown-wrapped JSON", () => {
		const llmOutput = '```json\n{"newNodes":[],"updatedNodes":[],"outOfScope":[]}\n```';
		const cleaned = llmOutput
			.replace(/^```json\s*/i, "")
			.replace(/```\s*$/i, "")
			.trim();
		const raw = JSON.parse(cleaned);
		const result = ExtractionResultSchema.parse(raw);
		expect(result.newNodes).toEqual([]);
	});

	it("handles plain JSON (no code fences)", () => {
		const llmOutput = '{"newNodes":[],"updatedNodes":[],"outOfScope":[]}';
		const cleaned = llmOutput
			.replace(/^```json\s*/i, "")
			.replace(/```\s*$/i, "")
			.trim();
		const raw = JSON.parse(cleaned);
		const result = ExtractionResultSchema.parse(raw);
		expect(result.newNodes).toEqual([]);
	});

	it("throws on completely invalid JSON", () => {
		const llmOutput = "This is not JSON at all, sorry!";
		expect(() => JSON.parse(llmOutput)).toThrow();
	});

	it("handles JSON with extra whitespace and newlines", () => {
		const llmOutput = `
		{
			"newNodes": [],
			"updatedNodes": [],
			"outOfScope": []
		}
		`;
		const raw = JSON.parse(llmOutput.trim());
		const result = ExtractionResultSchema.parse(raw);
		expect(result.newNodes).toEqual([]);
	});
});

// ─── formatTranscriptWindow ───────────────────────────────────────────
describe("formatTranscriptWindow", () => {
	it("returns '(no transcript yet)' for empty array", () => {
		expect(formatTranscriptWindow([])).toBe("(no transcript yet)");
	});

	it("formats single entry with timestamp", () => {
		const entries: TranscriptEntry[] = [
			{ speaker: "Oscar", text: "Hello", timestamp: 65 },
		];
		const result = formatTranscriptWindow(entries);
		expect(result).toBe("[1:05] Oscar: Hello");
	});

	it("formats multiple entries", () => {
		const entries: TranscriptEntry[] = [
			{ speaker: "Oscar", text: "First", timestamp: 60 },
			{ speaker: "Client", text: "Second", timestamp: 120 },
		];
		const result = formatTranscriptWindow(entries);
		expect(result).toContain("[1:00] Oscar: First");
		expect(result).toContain("[2:00] Client: Second");
	});

	it("filters entries outside the 5-minute window", () => {
		const entries: TranscriptEntry[] = [
			{ speaker: "Oscar", text: "Old entry", timestamp: 0 },
			{ speaker: "Oscar", text: "Recent entry", timestamp: 600 },
		];
		const result = formatTranscriptWindow(entries, 5);
		// Old entry (t=0) is outside 5-min window from latest (t=600)
		// Window start = 600 - 300 = 300, so t=0 is excluded
		expect(result).not.toContain("Old entry");
		expect(result).toContain("Recent entry");
	});

	it("includes entries at the window boundary", () => {
		const entries: TranscriptEntry[] = [
			{ speaker: "Oscar", text: "Boundary", timestamp: 300 },
			{ speaker: "Oscar", text: "Latest", timestamp: 600 },
		];
		const result = formatTranscriptWindow(entries, 5);
		// Window start = 600 - 300 = 300, t=300 is >= 300
		expect(result).toContain("Boundary");
		expect(result).toContain("Latest");
	});

	it("handles custom window size", () => {
		const entries: TranscriptEntry[] = [
			{ speaker: "Oscar", text: "Old", timestamp: 0 },
			{ speaker: "Oscar", text: "Recent", timestamp: 120 },
		];
		// 1-minute window: only entries >= 120 - 60 = 60
		const result = formatTranscriptWindow(entries, 1);
		expect(result).not.toContain("Old");
		expect(result).toContain("Recent");
	});
});
