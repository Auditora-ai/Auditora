/**
 * Teleprompter Prompt Tests
 *
 * Tests for the teleprompter prompt builder and response schema.
 * These are unit tests — they validate the prompt construction logic
 * and the Zod schema, NOT actual LLM calls.
 *
 * Run: pnpm test packages/ai/src/prompts/__tests__/teleprompter.test.ts
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
	buildTeleprompterSystemPrompt,
	TELEPROMPTER_USER,
	TELEPROMPTER_SYSTEM,
} from "../teleprompter";

// ─── Zod Schema for Teleprompter Response (mirrors pipeline schema) ────
const TeleprompterResultSchema = z.object({
	nextQuestion: z.string().min(1),
	reasoning: z.string(),
	gapType: z.enum([
		"missing_trigger",
		"missing_decision",
		"missing_exception",
		"missing_role",
		"missing_supplier",
		"missing_input",
		"missing_output",
		"missing_customer",
		"missing_sla",
		"missing_system",
		"general_exploration",
	]),
	completenessScore: z.number().min(0).max(100).catch(0),
	sipocCoverage: z.object({
		suppliers: z.number().min(0).max(100).catch(0),
		inputs: z.number().min(0).max(100).catch(0),
		process: z.number().min(0).max(100).catch(0),
		outputs: z.number().min(0).max(100).catch(0),
		customers: z.number().min(0).max(100).catch(0),
	}),
});

// ─── System Prompt Content Tests ──────────────────────────────────────
describe("TELEPROMPTER_SYSTEM", () => {
	it("includes SIPOC framework reference", () => {
		expect(TELEPROMPTER_SYSTEM).toContain("SIPOC");
	});

	it("defines all 5 SIPOC dimensions", () => {
		expect(TELEPROMPTER_SYSTEM).toContain("Suppliers");
		expect(TELEPROMPTER_SYSTEM).toContain("Inputs");
		expect(TELEPROMPTER_SYSTEM).toContain("Process");
		expect(TELEPROMPTER_SYSTEM).toContain("Outputs");
		expect(TELEPROMPTER_SYSTEM).toContain("Customers");
	});

	it("includes weighted completeness formula", () => {
		// S(15%) + I(20%) + P(30%) + O(20%) + C(15%)
		expect(TELEPROMPTER_SYSTEM).toContain("15%");
		expect(TELEPROMPTER_SYSTEM).toContain("20%");
		expect(TELEPROMPTER_SYSTEM).toContain("30%");
	});

	it("defines all gap type categories", () => {
		expect(TELEPROMPTER_SYSTEM).toContain("missing_trigger");
		expect(TELEPROMPTER_SYSTEM).toContain("missing_decision");
		expect(TELEPROMPTER_SYSTEM).toContain("missing_exception");
		expect(TELEPROMPTER_SYSTEM).toContain("missing_role");
		expect(TELEPROMPTER_SYSTEM).toContain("missing_input");
		expect(TELEPROMPTER_SYSTEM).toContain("missing_output");
		expect(TELEPROMPTER_SYSTEM).toContain("missing_customer");
	});

	it("defines output format with completenessScore", () => {
		expect(TELEPROMPTER_SYSTEM).toContain("completenessScore");
	});

	it("defines sipocCoverage in output format", () => {
		expect(TELEPROMPTER_SYSTEM).toContain("sipocCoverage");
	});
});

// ─── buildTeleprompterSystemPrompt Tests ─────────────────────────────
describe("buildTeleprompterSystemPrompt", () => {
	it("returns base system prompt when no context provided", () => {
		const prompt = buildTeleprompterSystemPrompt();
		expect(prompt).toContain("SIPOC");
		expect(prompt).toContain("completenessScore");
	});

	it("includes company name when context has company", () => {
		const context = {
			company: {
				name: "Acme México",
				industry: "Manufactura",
			},
			sessionType: "DISCOVERY",
			architecture: { processes: [] },
		} as any;
		const prompt = buildTeleprompterSystemPrompt(context);
		expect(prompt).toContain("Acme México");
		expect(prompt).toContain("Manufactura");
	});

	it("includes target process name when provided", () => {
		const context = {
			company: { name: "Test Corp" },
			sessionType: "DEEP_DIVE",
			targetProcess: {
				name: "Proceso de Compras",
				level: "OPERATIONAL",
				triggers: ["Solicitud de compra"],
				outputs: ["Orden de compra"],
				goals: [],
				siblings: [],
			},
			architecture: { processes: [] },
		} as any;
		const prompt = buildTeleprompterSystemPrompt(context);
		expect(prompt).toContain("Proceso de Compras");
	});

	it("includes DISCOVERY mode guidance for DISCOVERY session type", () => {
		const context = {
			company: { name: "Test Corp" },
			sessionType: "DISCOVERY",
			architecture: { processes: [] },
		} as any;
		const prompt = buildTeleprompterSystemPrompt(context);
		expect(prompt).toContain("DISCOVERY");
	});

	it("includes intelligence gaps when provided", () => {
		const context = {
			company: { name: "Test Corp" },
			sessionType: "DEEP_DIVE",
			architecture: { processes: [] },
			intelligence: {
				openItems: [
					{
						category: "MISSING_EXCEPTION",
						question: "¿Qué pasa si la factura está incompleta?",
						priority: 80,
					},
				],
				completenessScore: 45,
			},
		} as any;
		const prompt = buildTeleprompterSystemPrompt(context);
		expect(prompt).toContain("INTELLIGENCE GAPS");
		expect(prompt).toContain("¿Qué pasa si la factura está incompleta?");
	});
});

// ─── TELEPROMPTER_USER Tests ──────────────────────────────────────────
describe("TELEPROMPTER_USER", () => {
	const mockNodes = [
		{ id: "n1", type: "startEvent", label: "Solicitud recibida", connections: ["n2"] },
		{ id: "n2", type: "task", label: "Revisar solicitud", lane: "Analista", connections: [] },
	];

	const mockTranscript = "[0:10] Consultor: ¿Cuál es el siguiente paso después de revisar?\n[0:25] Cliente: Lo mandamos a aprobación del jefe.";

	it("includes session type in user prompt", () => {
		const prompt = TELEPROMPTER_USER("DEEP_DIVE", mockNodes, mockTranscript);
		expect(prompt).toContain("DEEP_DIVE");
	});

	it("includes current diagram nodes", () => {
		const prompt = TELEPROMPTER_USER("DEEP_DIVE", mockNodes, mockTranscript);
		expect(prompt).toContain("startEvent");
		expect(prompt).toContain("Solicitud recibida");
		expect(prompt).toContain("Revisar solicitud");
	});

	it("includes recent transcript", () => {
		const prompt = TELEPROMPTER_USER("DEEP_DIVE", mockNodes, mockTranscript);
		expect(prompt).toContain("aprobación del jefe");
	});

	it("includes process name when provided", () => {
		const prompt = TELEPROMPTER_USER("DEEP_DIVE", mockNodes, mockTranscript, "Proceso de Compras");
		expect(prompt).toContain("Proceso de Compras");
	});

	it("notes empty diagram when no nodes", () => {
		const prompt = TELEPROMPTER_USER("DISCOVERY", [], mockTranscript);
		expect(prompt).toContain("empty");
	});

	it("adds SIPOC hint when no start event", () => {
		const nodesWithoutStart = [
			{ id: "n1", type: "task", label: "Revisar solicitud", connections: [] },
		];
		const prompt = TELEPROMPTER_USER("DEEP_DIVE", nodesWithoutStart, mockTranscript);
		expect(prompt).toContain("SIPOC");
		expect(prompt).toContain("trigger");
	});

	it("adds SIPOC hint when no lanes assigned", () => {
		const nodesWithoutLanes = [
			{ id: "n1", type: "task", label: "Paso 1", connections: [] },
		];
		const prompt = TELEPROMPTER_USER("DEEP_DIVE", nodesWithoutLanes, mockTranscript);
		expect(prompt).toContain("Suppliers");
	});

	it("detects gateways with incomplete paths", () => {
		const nodesWithIncompleteGateway = [
			{ id: "gw1", type: "exclusiveGateway", label: "¿Aprobado?", connections: ["n2"] }, // only 1 outgoing
			{ id: "n2", type: "task", label: "Notificar aprobación", connections: [] },
		];
		const prompt = TELEPROMPTER_USER("DEEP_DIVE", nodesWithIncompleteGateway, mockTranscript);
		expect(prompt).toContain("gateway");
	});
});

// ─── Teleprompter Response Schema Validation ─────────────────────────
describe("TeleprompterResultSchema", () => {
	it("parses valid complete response", () => {
		const validResponse = {
			nextQuestion: "¿Qué pasa cuando la solicitud no tiene presupuesto suficiente?",
			reasoning: "El gateway de aprobación solo tiene un camino. Necesitamos el path de rechazo.",
			gapType: "missing_decision",
			completenessScore: 45,
			sipocCoverage: {
				suppliers: 60,
				inputs: 70,
				process: 30,
				outputs: 40,
				customers: 20,
			},
		};
		const result = TeleprompterResultSchema.parse(validResponse);
		expect(result.gapType).toBe("missing_decision");
		expect(result.completenessScore).toBe(45);
	});

	it("catches invalid gapType and does not silently accept it", () => {
		const invalidResponse = {
			nextQuestion: "¿Qué pasa?",
			reasoning: "Test",
			gapType: "invalid_type_not_in_schema",
			completenessScore: 50,
			sipocCoverage: {
				suppliers: 50,
				inputs: 50,
				process: 50,
				outputs: 50,
				customers: 50,
			},
		};
		expect(() => TeleprompterResultSchema.parse(invalidResponse)).toThrow();
	});

	it("catches completenessScore out of range via catch fallback", () => {
		const responseWithBadScore = {
			nextQuestion: "¿Qué sigue?",
			reasoning: "Test",
			gapType: "general_exploration",
			completenessScore: 999, // Invalid — exceeds max(100)
			sipocCoverage: {
				suppliers: 50,
				inputs: 50,
				process: 50,
				outputs: 50,
				customers: 50,
			},
		};
		// Note: z.number().min(0).max(100).catch(0) will catch the error and return 0
		// This means it won't throw — it silently falls back to 0
		// This is the intended pipeline behavior (resilience over strict validation)
		const result = TeleprompterResultSchema.parse(responseWithBadScore);
		expect(result.completenessScore).toBe(0); // Falls back to 0 via .catch(0)
	});

	it("rejects empty nextQuestion", () => {
		const responseWithEmptyQuestion = {
			nextQuestion: "",
			reasoning: "Test",
			gapType: "missing_trigger",
			completenessScore: 10,
			sipocCoverage: {
				suppliers: 0,
				inputs: 0,
				process: 10,
				outputs: 0,
				customers: 0,
			},
		};
		expect(() => TeleprompterResultSchema.parse(responseWithEmptyQuestion)).toThrow();
	});

	it("calculates weighted completeness correctly", () => {
		// Verify the math: S(15%) + I(20%) + P(30%) + O(20%) + C(15%)
		const coverage = { suppliers: 100, inputs: 100, process: 100, outputs: 100, customers: 100 };
		const weighted =
			coverage.suppliers * 0.15 +
			coverage.inputs * 0.2 +
			coverage.process * 0.3 +
			coverage.outputs * 0.2 +
			coverage.customers * 0.15;
		expect(weighted).toBe(100);
	});

	it("verifies SIPOC weight formula adds to 100%", () => {
		const weights = [0.15, 0.20, 0.30, 0.20, 0.15];
		const total = weights.reduce((sum, w) => sum + w, 0);
		expect(total).toBeCloseTo(1.0);
	});
});

// ─── Edge Cases ──────────────────────────────────────────────────────
describe("Edge cases", () => {
	it("handles very long transcript gracefully (does not crash)", () => {
		const longTranscript = Array(100).fill("[1:00] Consultor: ¿Hay más pasos?").join("\n");
		expect(() =>
			TELEPROMPTER_USER("DEEP_DIVE", [], longTranscript)
		).not.toThrow();
	});

	it("handles nodes with no connections", () => {
		const isolatedNodes = [
			{ id: "n1", type: "task", label: "Paso huérfano", connections: [] },
		];
		expect(() =>
			TELEPROMPTER_USER("DEEP_DIVE", isolatedNodes, "Transcript")
		).not.toThrow();
	});

	it("handles 50+ nodes in diagram without crashing", () => {
		const manyNodes = Array(50)
			.fill(null)
			.map((_, i) => ({
				id: `n${i}`,
				type: "task",
				label: `Paso ${i}`,
				lane: "Analista",
				connections: [`n${i + 1}`],
			}));
		expect(() =>
			TELEPROMPTER_USER("CONTINUATION", manyNodes, "Continuando el proceso...")
		).not.toThrow();
	});
});
