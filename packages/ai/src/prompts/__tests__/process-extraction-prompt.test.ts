/**
 * Process Extraction PROMPT Tests (Cycle 2)
 *
 * Tests specific to the prompt content and construction logic,
 * separate from the pipeline Zod schema tests.
 *
 * Run: pnpm test packages/ai/src/prompts/__tests__/process-extraction-prompt.test.ts
 */
import { describe, it, expect } from "vitest";
import {
	PROCESS_EXTRACTION_SYSTEM,
	PROCESS_EXTRACTION_USER,
	buildExtractionSystemPrompt,
} from "../process-extraction";

// ─── System Prompt Content Quality Tests ─────────────────────────────
describe("PROCESS_EXTRACTION_SYSTEM — content quality", () => {
	it("references BPMN 2.0", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("BPMN 2.0");
	});

	it("defines all required task types", () => {
		const requiredTypes = [
			"startEvent",
			"endEvent",
			"task",
			"userTask",
			"serviceTask",
			"manualTask",
			"businessRuleTask",
			"exclusiveGateway",
			"parallelGateway",
			"inclusiveGateway",
			"subProcess",
		];
		for (const type of requiredTypes) {
			expect(PROCESS_EXTRACTION_SYSTEM).toContain(type);
		}
	});

	it("has naming rules for tasks (verb + noun)", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("verb");
		// The naming rules section should exist
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("NAMING RULES");
	});

	it("has naming rules for gateways (phrased as questions)", () => {
		// Gateways should be phrased as questions
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("¿");
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("Gateway");
	});

	it("has naming rules for start events (not just 'Inicio')", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("NEVER \"Inicio\"");
	});

	it("has naming rules for end events (not just 'Fin')", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("NEVER \"Fin\"");
	});

	it("includes output schema with newNodes field", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("newNodes");
	});

	it("includes updatedNodes in output schema", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("updatedNodes");
	});

	it("includes outOfScope in output schema", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("outOfScope");
	});

	it("includes confidence field definition", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("confidence");
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("0.0-1.0");
	});

	it("includes flowCondition rules for gateways", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("flowCondition");
	});

	it("has anti-hallucination rule (only extract mentioned steps)", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("NOT already in the diagram");
	});

	it("handles consultant instructions specifically", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("CONSULTOR");
	});

	it("handles teleprompter answers", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("TELEPROMPTER ANSWERS");
	});

	it("includes SYSTEM/APPLICATION DETECTION rules", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("SYSTEM/APPLICATION DETECTION");
	});

	it("includes lane consistency rules", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("LANE RULES");
	});

	it("defines STRUCTURAL RULES for gateways", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("STRUCTURAL RULES");
	});
});

// ─── Node Quality Anti-Patterns ───────────────────────────────────────
describe("PROCESS_EXTRACTION_SYSTEM — anti-patterns", () => {
	it("explicitly forbids 'Sí'/'No' as node labels", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("NODE QUALITY RULES");
		// Should warn against labels like "Sí", "No"
		// Actual text: "are NOT valid node labels — these are gateway condition labels"
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("NOT valid node labels");
	});

	it("explicitly forbids generic 'task' when specific type can be inferred", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("NEVER use generic");
	});

	it("warns against using tasks for decisions", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("NEVER use a task for a decision");
	});

	it("warns against duplicate nodes", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("Do NOT duplicate");
	});
});

// ─── PROCESS_EXTRACTION_USER Tests ───────────────────────────────────
describe("PROCESS_EXTRACTION_USER", () => {
	const mockNodes = [
		{ id: "n1", type: "startEvent", label: "Solicitud recibida", lane: "Cliente" },
		{ id: "n2", type: "userTask", label: "Revisar solicitud", lane: "Analista" },
	];

	const mockTranscript =
		"El analista revisa la solicitud en SAP y si el monto supera 50 mil pesos se necesita aprobación del gerente.";

	it("includes current diagram nodes", () => {
		const prompt = PROCESS_EXTRACTION_USER(mockNodes, mockTranscript);
		expect(prompt).toContain("n1");
		expect(prompt).toContain("Solicitud recibida");
		expect(prompt).toContain("n2");
		expect(prompt).toContain("Revisar solicitud");
	});

	it("includes the transcript text", () => {
		const prompt = PROCESS_EXTRACTION_USER(mockNodes, mockTranscript);
		expect(prompt).toContain("SAP");
		expect(prompt).toContain("50 mil pesos");
	});

	it("shows 'empty' when no nodes exist", () => {
		const prompt = PROCESS_EXTRACTION_USER([], mockTranscript);
		expect(prompt).toContain("empty");
	});

	it("shows node type in brackets", () => {
		const prompt = PROCESS_EXTRACTION_USER(mockNodes, mockTranscript);
		expect(prompt).toContain("[startEvent]");
		expect(prompt).toContain("[userTask]");
	});

	it("shows lane assignment", () => {
		const prompt = PROCESS_EXTRACTION_USER(mockNodes, mockTranscript);
		expect(prompt).toContain("Cliente");
		expect(prompt).toContain("Analista");
	});

	it("includes focus hint when target process provided", () => {
		const context = {
			company: {},
			sessionType: "DEEP_DIVE",
			architecture: { processes: [] },
			targetProcess: {
				name: "Compras",
				level: "OPERATIONAL",
				triggers: [],
				outputs: [],
				goals: [],
				siblings: [],
			},
		} as any;
		const prompt = PROCESS_EXTRACTION_USER(mockNodes, mockTranscript, context);
		expect(prompt).toContain("Compras");
		expect(prompt).toContain("Focus");
	});
});

// ─── buildExtractionSystemPrompt Context Injection ────────────────────
describe("buildExtractionSystemPrompt", () => {
	it("returns base prompt when no context", () => {
		const prompt = buildExtractionSystemPrompt();
		expect(prompt).toContain("BPMN 2.0 process extraction");
	});

	it("includes company name in context block", () => {
		const context = {
			company: {
				name: "Cementos Monterrey",
				industry: "Manufactura",
			},
			sessionType: "DEEP_DIVE",
			architecture: { processes: [] },
		} as any;
		const prompt = buildExtractionSystemPrompt(context);
		expect(prompt).toContain("Cementos Monterrey");
		expect(prompt).toContain("Manufactura");
	});

	it("includes process focus when targetProcess provided", () => {
		const context = {
			company: { name: "Test" },
			sessionType: "DEEP_DIVE",
			targetProcess: {
				name: "Proceso de Facturación",
				level: "OPERATIONAL",
				triggers: ["Entrega de mercancía"],
				outputs: ["Factura validada"],
				goals: [],
				siblings: ["Proceso de Cobro"],
			},
			architecture: { processes: [] },
		} as any;
		const prompt = buildExtractionSystemPrompt(context);
		expect(prompt).toContain("Proceso de Facturación");
		expect(prompt).toContain("PROCESS FOCUS");
	});

	it("includes SCOPE RULES with sibling process names", () => {
		const context = {
			company: { name: "Test" },
			sessionType: "DEEP_DIVE",
			targetProcess: {
				name: "Facturación",
				level: "OPERATIONAL",
				triggers: [],
				outputs: [],
				goals: [],
				siblings: ["Cobro", "Tesorería"],
			},
			architecture: { processes: [] },
		} as any;
		const prompt = buildExtractionSystemPrompt(context);
		expect(prompt).toContain("SCOPE RULES");
		expect(prompt).toContain("Cobro");
		expect(prompt).toContain("Tesorería");
	});

	it("includes PREVIOUS SESSION CONTEXT for CONTINUATION type", () => {
		const context = {
			company: { name: "Test" },
			sessionType: "CONTINUATION",
			targetProcess: {
				name: "Ventas",
				level: "OPERATIONAL",
				triggers: [],
				outputs: [],
				goals: [],
				siblings: [],
				previousTranscriptSummary: "La sesión anterior cubrió los pasos de cotización.",
			},
			architecture: { processes: [] },
		} as any;
		const prompt = buildExtractionSystemPrompt(context);
		expect(prompt).toContain("PREVIOUS SESSION CONTEXT");
		expect(prompt).toContain("cotización");
	});

	it("includes PROCESS ARCHITECTURE when processes exist", () => {
		const context = {
			company: { name: "Test" },
			sessionType: "DEEP_DIVE",
			architecture: {
				processes: [
					{ name: "Compras", level: "OPERATIONAL", status: "active" },
					{ name: "Ventas", level: "OPERATIONAL", status: "active" },
				],
			},
		} as any;
		const prompt = buildExtractionSystemPrompt(context);
		expect(prompt).toContain("PROCESS ARCHITECTURE");
		expect(prompt).toContain("Compras");
		expect(prompt).toContain("Ventas");
	});
});

// ─── Prompt Engineering Quality Gates ─────────────────────────────────
describe("Prompt quality gates", () => {
	it("system prompt is substantial (> 5KB — not a stub)", () => {
		expect(PROCESS_EXTRACTION_SYSTEM.length).toBeGreaterThan(5000);
	});

	it("system prompt includes explicit JSON output instruction", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("valid JSON");
	});

	it("system prompt explicitly forbids markdown in output", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("no markdown");
	});

	it("system prompt handles empty transcript case", () => {
		// The prompt should handle the case where there's nothing to extract
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("return {");
	});

	it("includes property extraction rules (SLA, systems, cost)", () => {
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("PROPERTY EXTRACTION RULES");
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("slaValue");
		expect(PROCESS_EXTRACTION_SYSTEM).toContain("systems");
	});
});
