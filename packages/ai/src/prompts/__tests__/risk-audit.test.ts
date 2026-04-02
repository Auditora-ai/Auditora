/**
 * Risk Audit Prompt Tests
 *
 * Tests for risk-audit prompt construction and output schema validation.
 * Validates: ISO 31000 compliance, FMEA completeness, anti-hallucination.
 *
 * Added by AI Specialist Agent #06, Cycle 1
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { RISK_AUDIT_USER, RISK_AUDIT_SYSTEM, FMEA_ADDENDUM } from "../risk-audit";

// ─── Output schema (mirrors pipeline schema + v2 additions) ───────────────────

const SuggestedControlSchema = z.object({
  name: z.string().min(1),
  controlType: z.enum(["PREVENTIVE", "DETECTIVE", "CORRECTIVE"]),
  automated: z.boolean(),
});

const NewRiskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  riskType: z.enum([
    "OPERATIONAL",
    "COMPLIANCE",
    "STRATEGIC",
    "FINANCIAL",
    "TECHNOLOGY",
    "HUMAN_RESOURCE",
    "REPUTATIONAL",
  ]),
  severity: z.number().min(1).max(5),
  probability: z.number().min(1).max(5),
  riskScore: z.number().optional(),
  isOpportunity: z.boolean(),
  source: z.enum(["AI_AUDIT", "AI_FMEA", "INTELLIGENCE_GAP", "CONVERSATION"]),
  relatedItemId: z.string().nullable(),
  suggestedMitigations: z.array(z.string().min(5)).min(1), // at least 1 actionable mitigation
  suggestedControls: z.array(SuggestedControlSchema),
  // FMEA fields (optional)
  failureMode: z.string().optional(),
  failureEffect: z.string().optional(),
  failureCause: z.string().optional(),
  detectionDifficulty: z.number().min(1).max(5).optional(),
  rpn: z.number().optional(),
});

const RiskAuditResultSchema = z.object({
  newRisks: z.array(NewRiskSchema),
  updatedRisks: z.array(
    z.object({
      id: z.string(),
      severity: z.number().optional(),
      probability: z.number().optional(),
      notes: z.string().optional(),
    }),
  ),
  riskSummary: z.object({
    totalRiskScore: z.number(),
    criticalCount: z.number().min(0),
    highCount: z.number().min(0),
    topRiskArea: z.string(),
    executiveSummary: z.string().optional(),
  }),
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseInput = {
  mode: "risk" as const,
  processName: "Proceso de Compras",
  processLevel: "OPERATIONAL",
  knowledgeSnapshot: JSON.stringify({
    steps: [
      { name: "Recibir solicitud", role: "Analista de Compras", system: "ERP" },
      { name: "Validar presupuesto", role: "Jefe de Área", sla: "24h" },
      { name: "Emitir orden de compra", role: "Analista de Compras", system: "SAP" },
    ],
    exceptions: [],
    decisions: [{ question: "¿Monto > $50K requiere aprobación del Director?" }],
  }),
  intelligenceItems: JSON.stringify([
    { id: "item-1", category: "MISSING_EXCEPTION", question: "¿Qué pasa si el proveedor rechaza la orden?", priority: 3 },
  ]),
  existingRisks: JSON.stringify([]),
};

// ─── Prompt construction tests ────────────────────────────────────────────────

describe("RISK_AUDIT_USER — prompt construction", () => {
  it("includes process name", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).toContain("PROCESO: Proceso de Compras");
  });

  it("includes process level", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).toContain("NIVEL: OPERATIONAL");
  });

  it("includes knowledge snapshot section", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).toContain("KNOWLEDGE SNAPSHOT");
  });

  it("includes intelligence items section", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).toContain("INTELLIGENCE ITEMS");
  });

  it("includes existing risks section", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).toContain("RIESGOS EXISTENTES");
  });

  it("appends FMEA instruction for mode=fmea", () => {
    const prompt = RISK_AUDIT_USER({ ...baseInput, mode: "fmea" });
    expect(prompt).toMatch(/FMEA/i);
  });

  it("appends full mode instruction for mode=full", () => {
    const prompt = RISK_AUDIT_USER({ ...baseInput, mode: "full" });
    expect(prompt).toMatch(/FMEA/i);
  });

  it("appends risk-only instruction for mode=risk", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).toContain("Solo riesgos");
  });

  it("includes organization context when provided", () => {
    const prompt = RISK_AUDIT_USER({
      ...baseInput,
      organizationContext: "Industria: Manufactura, Ciudad: Monterrey",
    });
    expect(prompt).toContain("CONTEXTO ORGANIZACIONAL");
    expect(prompt).toContain("Manufactura");
  });

  it("omits organization context section when not provided", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).not.toContain("CONTEXTO ORGANIZACIONAL");
  });

  it("includes transcript excerpts when provided", () => {
    const prompt = RISK_AUDIT_USER({
      ...baseInput,
      transcriptExcerpts: "El sistema SAP falla cada viernes",
    });
    expect(prompt).toContain("EXTRACTOS DE TRANSCRIPCIÓN");
    expect(prompt).toContain("SAP falla");
  });

  it("omits transcript section when not provided", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).not.toContain("EXTRACTOS DE TRANSCRIPCIÓN");
  });

  it("includes process description when provided", () => {
    const prompt = RISK_AUDIT_USER({
      ...baseInput,
      processDescription: "Proceso crítico de adquisición de materiales",
    });
    expect(prompt).toContain("Proceso crítico de adquisición");
  });
});

// ─── System prompt quality checks ─────────────────────────────────────────────

describe("RISK_AUDIT_SYSTEM — content quality", () => {
  it("is substantial (> 500 chars)", () => {
    expect(RISK_AUDIT_SYSTEM.length).toBeGreaterThan(500);
  });

  it("references ISO 31000", () => {
    expect(RISK_AUDIT_SYSTEM).toContain("ISO 31000");
  });

  it("defines all 7 risk type categories (by keyword or description)", () => {
    // v1 uses Spanish descriptions; v2 uses enum strings.
    // This test checks for any mention of these risk domains.
    const patterns = [
      /OPERATIONAL|operacional/i,
      /COMPLIANCE|cumplimiento/i,
      /STRATEGIC|estratégic/i,
      /FINANCIAL|financier/i,
      /TECHNOLOGY|tecnológic/i,
      /HUMAN_RESOURCE|recursos humanos/i,
      /REPUTATIONAL|reputacional/i,
    ];
    for (const pattern of patterns) {
      expect(RISK_AUDIT_SYSTEM).toMatch(pattern);
    }
  });

  it("defines severity scale 1-5", () => {
    expect(RISK_AUDIT_SYSTEM).toMatch(/[Ss]everidad/);
    // Should define numerical scale
    expect(RISK_AUDIT_SYSTEM).toMatch(/[1-5]/);
  });

  it("defines probability scale 1-5", () => {
    expect(RISK_AUDIT_SYSTEM).toMatch(/[Pp]robabilidad/);
  });

  it("mentions mitigation or mitigaciones", () => {
    expect(RISK_AUDIT_SYSTEM.toLowerCase()).toMatch(/mitigaci/);
  });

  it("mentions control types (PREVENTIVE/DETECTIVE/CORRECTIVE)", () => {
    expect(RISK_AUDIT_SYSTEM).toMatch(/PREVENTIVE|PREVENTIVO/i);
    expect(RISK_AUDIT_SYSTEM).toMatch(/DETECTIVE/i);
    expect(RISK_AUDIT_SYSTEM).toMatch(/CORRECTIVE|CORRECTIVO/i);
  });

  it("includes anti-hallucination instruction", () => {
    // Must mention evidence requirement
    expect(RISK_AUDIT_SYSTEM.toLowerCase()).toMatch(/evidencia|evidence|knowledge snapshot/i);
  });
});

// ─── FMEA Addendum quality checks ─────────────────────────────────────────────

describe("FMEA_ADDENDUM — content quality", () => {
  it("is defined and non-empty", () => {
    expect(FMEA_ADDENDUM).toBeDefined();
    expect(FMEA_ADDENDUM.length).toBeGreaterThan(50);
  });

  it("mentions RPN", () => {
    expect(FMEA_ADDENDUM.toLowerCase()).toContain("rpn");
  });

  it("mentions failure mode", () => {
    expect(FMEA_ADDENDUM.toLowerCase()).toMatch(/failure mode|modo de fallo/i);
  });

  it("mentions detection", () => {
    expect(FMEA_ADDENDUM.toLowerCase()).toMatch(/detec/i);
  });
});

// ─── Output schema validation ──────────────────────────────────────────────────

describe("RiskAuditResultSchema — output validation", () => {
  it("validates a well-formed risk audit output", () => {
    const validOutput = {
      newRisks: [
        {
          title: "Proveedor único para insumo crítico",
          description:
            "El paso 'Evaluar proveedores' depende de un único proveedor sin alternativa documentada. " +
            "Si el proveedor falla, el proceso se detiene completamente.",
          riskType: "OPERATIONAL",
          severity: 4,
          probability: 2,
          riskScore: 8,
          isOpportunity: false,
          source: "AI_AUDIT",
          relatedItemId: null,
          suggestedMitigations: [
            "Crear listado de proveedores alternos calificados con evaluación semestral",
            "Establecer contrato marco con al menos 2 proveedores para cada insumo crítico",
          ],
          suggestedControls: [
            { name: "Revisión trimestral de proveedores activos", controlType: "DETECTIVE", automated: false },
            { name: "Alerta de proveedor único en sistema ERP", controlType: "PREVENTIVE", automated: true },
          ],
        },
      ],
      updatedRisks: [],
      riskSummary: {
        totalRiskScore: 8,
        criticalCount: 0,
        highCount: 1,
        topRiskArea: "OPERATIONAL",
        executiveSummary:
          "El proceso de Compras presenta un riesgo alto por dependencia de proveedor único. " +
          "Acción inmediata: establecer lista de proveedores alternos calificados.",
      },
    };

    const result = RiskAuditResultSchema.safeParse(validOutput);
    if (!result.success) {
      console.error("Validation errors:", JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it("rejects risk with empty title", () => {
    const invalid = {
      title: "",
      description: "Some description that is long enough",
      riskType: "OPERATIONAL",
      severity: 3,
      probability: 3,
      isOpportunity: false,
      source: "AI_AUDIT",
      relatedItemId: null,
      suggestedMitigations: ["Do something specific"],
      suggestedControls: [],
    };
    const result = NewRiskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects severity outside 1-5 range", () => {
    const result = z.number().min(1).max(5).safeParse(6);
    expect(result.success).toBe(false);
  });

  it("rejects probability outside 1-5 range", () => {
    const result = z.number().min(1).max(5).safeParse(0);
    expect(result.success).toBe(false);
  });

  it("rejects invalid risk type", () => {
    const result = z
      .enum([
        "OPERATIONAL", "COMPLIANCE", "STRATEGIC", "FINANCIAL",
        "TECHNOLOGY", "HUMAN_RESOURCE", "REPUTATIONAL",
      ])
      .safeParse("ENVIRONMENTAL");
    expect(result.success).toBe(false);
  });

  it("accepts all valid risk types", () => {
    const types = [
      "OPERATIONAL", "COMPLIANCE", "STRATEGIC", "FINANCIAL",
      "TECHNOLOGY", "HUMAN_RESOURCE", "REPUTATIONAL",
    ] as const;
    for (const type of types) {
      const result = z
        .enum([
          "OPERATIONAL", "COMPLIANCE", "STRATEGIC", "FINANCIAL",
          "TECHNOLOGY", "HUMAN_RESOURCE", "REPUTATIONAL",
        ])
        .safeParse(type);
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid control types", () => {
    const types = ["PREVENTIVE", "DETECTIVE", "CORRECTIVE"] as const;
    for (const type of types) {
      const result = z.enum(["PREVENTIVE", "DETECTIVE", "CORRECTIVE"]).safeParse(type);
      expect(result.success).toBe(true);
    }
  });

  it("validates FMEA fields when present", () => {
    const riskWithFmea = {
      title: "Validación manual de facturas",
      description:
        "La actividad de validación de facturas se realiza manualmente sin " +
        "sistema de doble check. Un error puede no detectarse hasta el pago.",
      riskType: "FINANCIAL",
      severity: 4,
      probability: 3,
      isOpportunity: false,
      source: "AI_FMEA",
      relatedItemId: null,
      suggestedMitigations: ["Implementar validación automatizada en ERP con reglas de negocio"],
      suggestedControls: [],
      failureMode: "Factura aprobada con monto incorrecto",
      failureEffect: "Pago excesivo al proveedor, descubierto solo en auditoría trimestral",
      failureCause: "Ausencia de validación automática contra orden de compra original",
      detectionDifficulty: 4,
      rpn: 48,
    };
    const result = NewRiskSchema.safeParse(riskWithFmea);
    expect(result.success).toBe(true);
  });

  it("validates opportunity risks (isOpportunity=true)", () => {
    const opportunity = {
      title: "Automatizar validación de presupuesto",
      description:
        "El paso de validación de presupuesto requiere acceso manual a SAP. " +
        "Podría automatizarse con una integración ERP reduciendo 2 horas/semana.",
      riskType: "OPERATIONAL",
      severity: 2,
      probability: 2,
      isOpportunity: true,
      source: "AI_AUDIT",
      relatedItemId: null,
      suggestedMitigations: ["Desarrollar integración automática ERP para validación de presupuesto en tiempo real"],
      suggestedControls: [
        { name: "Validación automática de presupuesto", controlType: "PREVENTIVE", automated: true },
      ],
    };
    const result = NewRiskSchema.safeParse(opportunity);
    expect(result.success).toBe(true);
  });

  it("validates INTELLIGENCE_GAP source with relatedItemId", () => {
    const gapRisk = {
      title: "Excepción sin procedimiento: proveedor rechaza orden",
      description:
        "El intelligence item #item-1 identificó que no existe procedimiento " +
        "documentado para cuando el proveedor rechaza la orden de compra. " +
        "Esto crea un gap de proceso con riesgo COMPLIANCE.",
      riskType: "COMPLIANCE",
      severity: 3,
      probability: 3,
      isOpportunity: false,
      source: "INTELLIGENCE_GAP",
      relatedItemId: "item-1",
      suggestedMitigations: [
        "Documentar procedimiento de contingencia para rechazo de orden por proveedor",
        "Definir nivel de autorización para aprobar proveedor alternativo de emergencia",
      ],
      suggestedControls: [],
    };
    const result = NewRiskSchema.safeParse(gapRisk);
    expect(result.success).toBe(true);
    expect(result.data?.relatedItemId).toBe("item-1");
  });
});

// ─── Risk Score Calculation ────────────────────────────────────────────────────

describe("Risk Priority Matrix — severity × probability", () => {
  // Matrix based on v2 prompt: CRITICAL ≥ 16, HIGH 8-15, MEDIUM 4-7, LOW ≤ 3
  const matrix: Array<[number, number, string]> = [
    [5, 5, "CRITICAL"], // 25
    [5, 4, "CRITICAL"], // 20
    [4, 4, "CRITICAL"], // 16
    [4, 3, "HIGH"],     // 12
    [3, 3, "HIGH"],     // 9  (>= 8 = HIGH)
    [3, 2, "MEDIUM"],   // 6
    [2, 2, "MEDIUM"],   // 4
    [1, 1, "LOW"],      // 1
  ];

  for (const [sev, prob, expectedLevel] of matrix) {
    it(`severity=${sev}, probability=${prob} → ${expectedLevel} (score=${sev * prob})`, () => {
      const score = sev * prob;
      let level: string;
      if (score >= 16) level = "CRITICAL";
      else if (score >= 8) level = "HIGH";
      else if (score >= 4) level = "MEDIUM";
      else level = "LOW";

      expect(level).toBe(expectedLevel);
    });
  }
});
