/**
 * Simulation Evaluator Prompt Tests
 *
 * Tests for the evaluation prompt builder and response schema validation.
 * These validate prompt construction and Zod schema logic.
 *
 * Run: pnpm test packages/ai/src/prompts/__tests__/simulation-evaluator.test.ts
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { buildEvaluationPrompt } from "../simulation-evaluator";

// ─── Evaluation Result Schema (mirrors evaluate-simulation pipeline) ─
const EvaluationResultSchema = z.object({
	alignment: z.number().min(0).max(100),
	riskLevel: z.number().min(0).max(100),
	criterio: z.number().min(0).max(100),
	errorPatterns: z.array(z.string()).max(5),
	feedback: z.string().min(1),
});

// ─── Sample Test Data ─────────────────────────────────────────────────
const mockEvalData = {
	templateTitle: "Crisis de Compras en Cementos del Norte",
	narrative:
		"Cementos del Norte es una empresa manufacturera en Monterrey con 450 empleados. Laura Mendoza, Gerente de Compras, enfrenta una situación crítica: el proveedor principal de materias primas no puede entregar la semana siguiente.",
	targetRole: "Gerente de Compras",
	decisions: [
		{
			order: 1,
			prompt: "El proveedor habitual no puede entregar. ¿Qué haces?",
			options: [
				{ label: "Opción A", description: "Buscar proveedor alternativo en lista aprobada" },
				{ label: "Opción B", description: "Comprar de emergencia sin proceso de cotización" },
				{ label: "Opción C", description: "Detener producción y esperar al proveedor habitual" },
			],
			chosenOption: 0,
			riskLevelByOption: [
				{ level: "LOW", score: 2 },
				{ level: "HIGH", score: 8 },
				{ level: "CRITICAL", score: 12 },
			],
			proceduralReference: "El procedimiento de compras establece que en casos de emergencia se debe consultar el catálogo de proveedores aprobados y obtener mínimo 2 cotizaciones.",
			consequence: "Laura consulta el catálogo y encuentra un proveedor alternativo calificado. La entrega se realiza con 1 día de retraso.",
		},
	],
	controlPointsSummary: null,
};

// ─── buildEvaluationPrompt Tests ─────────────────────────────────────
describe("buildEvaluationPrompt", () => {
	it("returns both system and user prompts", () => {
		const { system, user } = buildEvaluationPrompt(mockEvalData);
		expect(system).toBeTruthy();
		expect(user).toBeTruthy();
	});

	it("system prompt mentions evaluation dimensions", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		expect(system).toContain("ALIGNMENT");
		expect(system).toContain("RISK_LEVEL");
		expect(system).toContain("CRITERIO");
	});

	it("system prompt includes few-shot examples", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		expect(system).toContain("EJEMPLO");
	});

	it("system prompt defines output schema", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		expect(system).toContain("alignment");
		expect(system).toContain("riskLevel");
		expect(system).toContain("criterio");
		expect(system).toContain("errorPatterns");
		expect(system).toContain("feedback");
	});

	it("system prompt is in Spanish (MX)", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		expect(system).toContain("español mexicano");
	});

	it("user prompt includes simulation title", () => {
		const { user } = buildEvaluationPrompt(mockEvalData);
		expect(user).toContain("Crisis de Compras en Cementos del Norte");
	});

	it("user prompt includes target role", () => {
		const { user } = buildEvaluationPrompt(mockEvalData);
		expect(user).toContain("Gerente de Compras");
	});

	it("user prompt includes narrative", () => {
		const { user } = buildEvaluationPrompt(mockEvalData);
		expect(user).toContain("Cementos del Norte");
		expect(user).toContain("Laura Mendoza");
	});

	it("user prompt includes all decisions", () => {
		const { user } = buildEvaluationPrompt(mockEvalData);
		expect(user).toContain("DECISIÓN 1");
		expect(user).toContain("proveedor habitual");
	});

	it("user prompt shows chosen option", () => {
		const { user } = buildEvaluationPrompt(mockEvalData);
		expect(user).toContain("Opción A");
		expect(user).toContain("Elegida");
	});

	it("user prompt shows procedural reference", () => {
		const { user } = buildEvaluationPrompt(mockEvalData);
		expect(user).toContain("procedimiento de compras");
	});

	it("user prompt shows consequence", () => {
		const { user } = buildEvaluationPrompt(mockEvalData);
		expect(user).toContain("proveedor alternativo calificado");
	});

	it("includes control points section when provided", () => {
		const dataWithControls = {
			...mockEvalData,
			controlPointsSummary: "Punto de control 1: Validar proveedor en lista aprobada\nPunto de control 2: Obtener mínimo 2 cotizaciones",
		};
		const { user } = buildEvaluationPrompt(dataWithControls);
		expect(user).toContain("PUNTOS DE CONTROL");
		expect(user).toContain("Validar proveedor");
	});

	it("does NOT include control points section when null", () => {
		const { user } = buildEvaluationPrompt(mockEvalData);
		expect(user).not.toContain("PUNTOS DE CONTROL");
	});

	it("shows risk level for chosen option", () => {
		const { user } = buildEvaluationPrompt(mockEvalData);
		expect(user).toContain("LOW");
	});
});

// ─── System Prompt Anti-Pattern Rules ────────────────────────────────
describe("buildEvaluationPrompt — system prompt rules", () => {
	it("has rule about not penalizing alignment when no procedural reference", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		// Rule 4 in the system prompt
		expect(system).toContain("NO penalices alignment");
	});

	it("has rule about control points as primary reference", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		expect(system).toContain("PRINCIPAL");
	});

	it("distinguishes criterio from obedience", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		expect(system).toContain("JUICIO");
	});

	it("has anti-hallucination rule", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		expect(system).toContain("NO inventes información");
	});

	it("defines errorPatterns as 0-5 items", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		expect(system).toContain("0-5");
	});

	it("has feedback length constraint", () => {
		const { system } = buildEvaluationPrompt(mockEvalData);
		expect(system).toContain("300 palabras");
	});
});

// ─── Response Schema Tests ────────────────────────────────────────────
describe("EvaluationResultSchema", () => {
	it("parses valid perfect score response", () => {
		const perfectResponse = {
			alignment: 95,
			riskLevel: 10,
			criterio: 90,
			errorPatterns: [],
			feedback: "Excelente desempeño. El participante mostró criterio ejemplar en todas las decisiones.",
		};
		const result = EvaluationResultSchema.parse(perfectResponse);
		expect(result.alignment).toBe(95);
		expect(result.criterio).toBe(90);
		expect(result.errorPatterns).toHaveLength(0);
	});

	it("parses valid failing score response", () => {
		const failingResponse = {
			alignment: 20,
			riskLevel: 85,
			criterio: 25,
			errorPatterns: [
				"Ignoró el procedimiento de cotizaciones",
				"Tomó decisiones sin consultar políticas internas",
				"Priorizó velocidad sobre control",
			],
			feedback: "El participante mostró un patrón de ignorar los controles establecidos.",
		};
		const result = EvaluationResultSchema.parse(failingResponse);
		expect(result.riskLevel).toBe(85);
		expect(result.errorPatterns).toHaveLength(3);
	});

	it("rejects alignment > 100", () => {
		const invalidResponse = {
			alignment: 150, // Invalid
			riskLevel: 50,
			criterio: 60,
			errorPatterns: [],
			feedback: "Test",
		};
		expect(() => EvaluationResultSchema.parse(invalidResponse)).toThrow();
	});

	it("rejects negative scores", () => {
		const invalidResponse = {
			alignment: -5, // Invalid
			riskLevel: 50,
			criterio: 60,
			errorPatterns: [],
			feedback: "Test",
		};
		expect(() => EvaluationResultSchema.parse(invalidResponse)).toThrow();
	});

	it("rejects more than 5 error patterns", () => {
		const invalidResponse = {
			alignment: 30,
			riskLevel: 70,
			criterio: 25,
			errorPatterns: ["P1", "P2", "P3", "P4", "P5", "P6"], // Max 5
			feedback: "Test",
		};
		expect(() => EvaluationResultSchema.parse(invalidResponse)).toThrow();
	});

	it("rejects empty feedback string", () => {
		const invalidResponse = {
			alignment: 75,
			riskLevel: 25,
			criterio: 80,
			errorPatterns: [],
			feedback: "", // Invalid — min(1)
		};
		expect(() => EvaluationResultSchema.parse(invalidResponse)).toThrow();
	});

	it("validates overall score calculation formula", () => {
		// Formula: 0.3 * alignment + 0.3 * (100 - riskLevel) + 0.4 * criterio
		const scores = { alignment: 80, riskLevel: 20, criterio: 70 };
		const overall = 0.3 * scores.alignment + 0.3 * (100 - scores.riskLevel) + 0.4 * scores.criterio;
		// Expected: 0.3*80 + 0.3*80 + 0.4*70 = 24 + 24 + 28 = 76
		expect(overall).toBe(76);
	});
});

// ─── Edge Cases ──────────────────────────────────────────────────────
describe("Edge cases", () => {
	it("handles null proceduralReference gracefully", () => {
		const dataWithNullRef = {
			...mockEvalData,
			decisions: [
				{
					...mockEvalData.decisions[0],
					proceduralReference: null,
				},
			],
		};
		expect(() => buildEvaluationPrompt(dataWithNullRef)).not.toThrow();
		const { user } = buildEvaluationPrompt(dataWithNullRef);
		expect(user).toContain("No disponible");
	});

	it("handles multiple decisions (5 as in full simulation)", () => {
		const multiDecisionData = {
			...mockEvalData,
			decisions: Array(5)
				.fill(null)
				.map((_, i) => ({
					order: i + 1,
					prompt: `Decisión ${i + 1}: ¿Qué harías?`,
					options: [
						{ label: "Opción A", description: "Acción conservadora" },
						{ label: "Opción B", description: "Acción moderada" },
						{ label: "Opción C", description: "Acción agresiva" },
					],
					chosenOption: 0,
					riskLevelByOption: [
						{ level: "LOW", score: 2 },
						{ level: "MEDIUM", score: 6 },
						{ level: "HIGH", score: 10 },
					],
					proceduralReference: `Referencia para decisión ${i + 1}`,
					consequence: `Consecuencia de decisión ${i + 1}`,
				})),
		};
		const { user } = buildEvaluationPrompt(multiDecisionData);
		expect(user).toContain("DECISIÓN 1");
		expect(user).toContain("DECISIÓN 5");
	});
});
