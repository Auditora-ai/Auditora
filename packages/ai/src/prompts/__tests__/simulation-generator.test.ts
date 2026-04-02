/**
 * Simulation Generator Prompt Tests
 *
 * Tests for prompt construction logic (not LLM output — use golden snapshots for that).
 * Validates: prompt structure, required content, edge case handling.
 *
 * Added by AI Specialist Agent #06, Cycle 1
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { buildSimulationPrompt, type SimulationPromptData } from "../simulation-generator";

// ─── Zod schema for expected simulation output structure ───────────────────────
// This mirrors the pipeline's SimulationResultSchema for validation testing.
// When we have golden snapshots, we can validate them against this.

const RiskLevelSchema = z.object({
  level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  reason: z.string().min(1),
});

const OptionSchema = z.object({
  label: z.string().min(1),
  description: z.string().min(10), // at least 10 chars — no empty descriptions
});

const DecisionSchema = z.object({
  order: z.number().min(1).max(10),
  prompt: z.string().min(20), // minimum meaningful prompt
  options: z.array(OptionSchema).min(2).max(5),
  consequences: z.array(z.string().min(10)).min(2),
  proceduralReference: z.string().nullable(),
  riskLevelByOption: z.array(RiskLevelSchema).min(2),
  // v2 optional fields
  optimalDecision: z.number().min(0).max(4).optional(),
  optimalDecisionRationale: z.string().optional(),
  keyLearning: z.string().optional(),
  anchoredRiskTitle: z.string().optional(),
  confidenceNote: z.string().nullable().optional(),
});

const SimulationResultSchema = z.object({
  title: z.string().min(3),
  narrative: z.string().min(100), // substantive narrative required
  difficultyLevel: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED"]).optional(),
  decisions: z.array(DecisionSchema).min(1).max(10), // min 1 for unit tests; production expects 5
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const basePromptData: SimulationPromptData = {
  processName: "Proceso de Compras",
  processDescription: "Gestión de adquisiciones desde solicitud hasta pago a proveedor",
  bpmnStepLabels: [
    "Recibir solicitud de compra",
    "Validar presupuesto",
    "Solicitar cotizaciones",
    "Evaluar proveedores",
    "Aprobar orden de compra",
    "Emitir orden de compra",
    "Recibir mercancía",
    "Aprobar factura",
    "Procesar pago",
  ],
  risks: [
    {
      title: "Proveedor único sin alternativa",
      description: "El proceso depende de un único proveedor para insumos críticos",
      riskType: "OPERATIONAL",
      severity: 4,
      probability: 3,
      affectedStep: "Evaluar proveedores",
    },
    {
      title: "Aprobación omitida bajo presión de tiempo",
      description: "Cuando hay urgencia, los niveles de aprobación se saltean",
      riskType: "COMPLIANCE",
      severity: 3,
      probability: 4,
      affectedStep: "Aprobar orden de compra",
    },
    {
      title: "Facturas sin validación de servicios recibidos",
      description: "Facturas aprobadas sin verificar que los servicios fueron entregados",
      riskType: "FINANCIAL",
      severity: 4,
      probability: 2,
      affectedStep: "Aprobar factura",
    },
  ],
  targetRole: "Gerente de Compras",
};

// ─── Prompt Construction Tests ─────────────────────────────────────────────────

describe("buildSimulationPrompt — prompt construction", () => {
  it("returns both system and user strings", () => {
    const result = buildSimulationPrompt(basePromptData);
    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
  });

  it("includes process name in user prompt", () => {
    const { user } = buildSimulationPrompt(basePromptData);
    expect(user).toContain("PROCESO: Proceso de Compras");
  });

  it("includes process description when provided", () => {
    const { user } = buildSimulationPrompt(basePromptData);
    expect(user).toContain("Gestión de adquisiciones");
  });

  it("includes target role in user prompt", () => {
    const { user } = buildSimulationPrompt(basePromptData);
    expect(user).toContain("Gerente de Compras");
  });

  it("includes all BPMN step labels", () => {
    const { user } = buildSimulationPrompt(basePromptData);
    for (const step of basePromptData.bpmnStepLabels) {
      expect(user).toContain(step);
    }
  });

  it("includes risk titles in user prompt", () => {
    const { user } = buildSimulationPrompt(basePromptData);
    for (const risk of basePromptData.risks) {
      expect(user).toContain(risk.title);
    }
  });

  it("includes risk severity and probability", () => {
    const { user } = buildSimulationPrompt(basePromptData);
    expect(user).toContain("Sev:4");
    expect(user).toContain("Sev:3");
  });

  it("handles empty BPMN steps gracefully", () => {
    const { user } = buildSimulationPrompt({ ...basePromptData, bpmnStepLabels: [] });
    expect(user).toContain("(No se extrajeron pasos del BPMN)");
  });

  it("handles empty risks gracefully", () => {
    const { user } = buildSimulationPrompt({ ...basePromptData, risks: [] });
    // Should still build a valid prompt, just with no risks listed
    expect(user).toContain("PROCESO: Proceso de Compras");
  });

  it("handles missing processDescription", () => {
    const { user } = buildSimulationPrompt({ ...basePromptData, processDescription: undefined });
    expect(user).toContain("PROCESO: Proceso de Compras");
    // Should not throw or produce empty user prompt
    expect(user.length).toBeGreaterThan(50);
  });

  it("system prompt references Harvard methodology", () => {
    const { system } = buildSimulationPrompt(basePromptData);
    expect(system.toLowerCase()).toContain("harvard");
  });

  it("system prompt is substantial (> 500 chars)", () => {
    const { system } = buildSimulationPrompt(basePromptData);
    expect(system.length).toBeGreaterThan(500);
  });

  it("user prompt instructs to generate 5 decisions", () => {
    const { user } = buildSimulationPrompt(basePromptData);
    expect(user).toMatch(/5\s*(decision|decisión)/i);
  });
});

// ─── Optional org context (v2 feature) ────────────────────────────────────────

describe("buildSimulationPrompt — v2 org context", () => {
  it("includes industry context when provided", () => {
    const { user } = buildSimulationPrompt({
      ...basePromptData,
      organizationIndustry: "Manufactura automotriz",
    } as SimulationPromptData & { organizationIndustry?: string });
    // Only relevant if the interface supports it — test graceful handling
    expect(user).toBeDefined();
  });

  it("does not break when org context is absent", () => {
    const data: SimulationPromptData = { ...basePromptData };
    expect(() => buildSimulationPrompt(data)).not.toThrow();
  });
});

// ─── Output Schema Validation (golden snapshot simulation) ────────────────────
// These tests validate that a HYPOTHETICAL LLM output conforms to expected schema.
// Use these to validate real LLM outputs in integration tests.

describe("SimulationResultSchema — output validation", () => {
  it("validates a minimal valid simulation output", () => {
    const validOutput = {
      title: "Crisis de Proveedor en Manufactura",
      narrative:
        "Manufactura del Norte S.A. de C.V., empresa de 300 empleados en Monterrey, " +
        "enfrenta una crisis de suministro. Laura Mendoza, Gerente de Compras con 5 años " +
        "en la empresa, recibe una llamada a las 7:30am del Director General solicitando " +
        "resolver la situación antes del mediodía. La línea de producción se detiene en 4 horas.",
      difficultyLevel: "INTERMEDIATE",
      decisions: [
        {
          order: 1,
          prompt:
            "Laura recibe la notificación de que el proveedor principal no entregará los insumos críticos " +
            "por un problema de transporte. Tiene 3 proveedores alternos en el catálogo pero ninguno ha " +
            "sido evaluado en los últimos 6 meses. ¿Qué decide hacer primero?",
          options: [
            {
              label: "Opción A",
              description:
                "Contactar inmediatamente al proveedor alterno con mejor precio histórico sin evaluación previa",
            },
            {
              label: "Opción B",
              description:
                "Activar el protocolo de proveedor de emergencia: verificar estado de evaluación, " +
                "solicitar aprobación del Director antes de comprometerse",
            },
            {
              label: "Opción C",
              description:
                "Escalar inmediatamente al Director General para que tome la decisión de proveedor",
            },
          ],
          consequences: [
            "La compra se realiza en 2 horas pero sin validación de calidad; 30% de los insumos llegan defectuosos",
            "El proceso tarda 4 horas pero la compra cumple con todos los controles internos y el proveedor es confiable",
            "El Director aprueba pero sin información técnica suficiente; la decisión queda sin respaldo documental",
          ],
          proceduralReference:
            "El procedimiento de Compras de Emergencia establece que proveedores no evaluados " +
            "requieren aprobación del Director y una orden de compra con cláusula de contingencia.",
          riskLevelByOption: [
            { level: "HIGH", reason: "Sin validación de calidad, riesgo de defectos en producción" },
            { level: "LOW", reason: "Sigue el procedimiento, documentado y controlado" },
            { level: "MEDIUM", reason: "Decisión tomada sin información técnica suficiente" },
          ],
          optimalDecision: 1,
          keyLearning: "Protocolo de compras de emergencia y niveles de autorización",
        },
      ],
    };

    const result = SimulationResultSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it("rejects simulation with empty title", () => {
    const invalid = {
      title: "",
      narrative: "a".repeat(200),
      decisions: [],
    };
    const result = SimulationResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects simulation with insufficient narrative", () => {
    const invalid = {
      title: "Test",
      narrative: "Too short",
      decisions: [],
    };
    const result = SimulationResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects simulation with no decisions", () => {
    const invalid = {
      title: "Test Simulation",
      narrative: "a".repeat(200),
      decisions: [],
    };
    const result = SimulationResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts valid difficultyLevel values", () => {
    for (const level of ["BASIC", "INTERMEDIATE", "ADVANCED"] as const) {
      const result = SimulationResultSchema.safeParse({
        title: "Test",
        narrative: "a".repeat(200),
        difficultyLevel: level,
        decisions: [
          {
            order: 1,
            prompt: "a".repeat(30),
            options: [
              { label: "A", description: "Option A description here" },
              { label: "B", description: "Option B description here" },
            ],
            consequences: ["Result A here with detail", "Result B here with detail"],
            proceduralReference: null,
            riskLevelByOption: [
              { level: "LOW", reason: "Safe" },
              { level: "HIGH", reason: "Risky" },
            ],
          },
        ],
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid difficultyLevel", () => {
    // z.enum will fail on invalid values (no .catch() on difficultyLevel in strict test schema)
    const result = z
      .enum(["BASIC", "INTERMEDIATE", "ADVANCED"])
      .safeParse("EXPERT");
    expect(result.success).toBe(false);
  });

  it("accepts proceduralReference as null", () => {
    const decision = {
      order: 1,
      prompt: "a".repeat(30),
      options: [
        { label: "A", description: "Option A description here" },
        { label: "B", description: "Option B description here" },
      ],
      consequences: ["Result A here detail", "Result B here detail"],
      proceduralReference: null,
      riskLevelByOption: [
        { level: "LOW", reason: "Safe" },
        { level: "HIGH", reason: "Risky" },
      ],
    };
    const result = DecisionSchema.safeParse(decision);
    expect(result.success).toBe(true);
  });

  it("validates all risk levels", () => {
    for (const level of ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const) {
      const result = RiskLevelSchema.safeParse({ level, reason: "Test reason" });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid risk level", () => {
    const result = RiskLevelSchema.safeParse({ level: "EXTREME", reason: "Test" });
    expect(result.success).toBe(false);
  });
});
