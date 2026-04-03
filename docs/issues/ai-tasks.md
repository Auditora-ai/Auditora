# AI Layer Tasks — Agent #04 Implementation Queue

**Written by:** AI Specialist Agent #06  
**Date:** 2026-04-02  
**Status:** Pending implementation

---

## Priority Legend
- 🔴 **P1** — Core product quality; implement ASAP
- 🟠 **P2** — Key differentiator; implement in Phase 2
- 🟡 **P3** — Enhancement; implement when capacity allows

---

## AI-001 — Replace simulation-generator system prompt (v1 → v2) 🔴 P1

**File:** `packages/ai/src/prompts/simulation-generator.ts`  
**Reference:** `docs/ai/prompt-library/simulation-generator-v2.md`  
**Impact:** Quality score +27 points (62 → 89/100). Simulations gain ground truth (optimalDecision), richer metadata (keyLearning, difficultyLevel), and much better LATAM context.

### Step 1 — Replace the system prompt constant

Replace the current `SIMULATION_GENERATOR_SYSTEM` export with the v2 version from `docs/ai/prompt-library/simulation-generator-v2.md` (section "Improved Prompt (v2)").

### Step 2 — Update `SimulationPromptData` interface

```typescript
// packages/ai/src/prompts/simulation-generator.ts

export interface SimulationPromptData {
  processName: string;
  processDescription?: string;
  bpmnStepLabels: string[];
  risks: Array<{
    title: string;
    description: string;
    riskType: string;
    severity: number;
    probability: number;
    affectedStep?: string;
  }>;
  targetRole: string;
  // NEW: optional hints to improve narrative specificity
  organizationIndustry?: string;
  organizationSize?: string; // e.g., "120 empleados"
}
```

### Step 3 — Update `buildSimulationPrompt` user message

Add industry/size hints to the user prompt if provided:

```typescript
const contextHint = [
  data.organizationIndustry ? `INDUSTRIA: ${data.organizationIndustry}` : null,
  data.organizationSize ? `TAMAÑO: ${data.organizationSize}` : null,
].filter(Boolean).join('\n');

const user = `PROCESO: ${data.processName}
${data.processDescription ? `DESCRIPCIÓN: ${data.processDescription}` : ""}
${contextHint ? `\nCONTEXTO ORGANIZACIONAL:\n${contextHint}` : ""}

ROL OBJETIVO (el participante asume este rol): ${data.targetRole}
...`
```

### Step 4 — Update Zod schema in pipeline

File: `packages/ai/src/pipelines/generate-simulation.ts`

```typescript
const DecisionSchema = z.object({
  order: z.number().min(1).max(10),
  prompt: z.string(),
  options: z.array(OptionSchema).min(2).max(5),
  consequences: z.array(z.string()),
  proceduralReference: z.string().nullable().catch(null),
  riskLevelByOption: z.array(RiskLevelSchema),
  // NEW optional fields (backward compatible — use .optional().catch())
  optimalDecision: z.number().min(0).max(4).optional().catch(undefined),
  optimalDecisionRationale: z.string().optional().catch(undefined),
  keyLearning: z.string().optional().catch(undefined),
  anchoredRiskTitle: z.string().optional().catch(undefined),
  confidenceNote: z.string().nullable().optional().catch(null),
});

const SimulationResultSchema = z.object({
  title: z.string(),
  narrative: z.string(),
  difficultyLevel: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED"]).optional().catch("INTERMEDIATE"),
  decisions: z.array(DecisionSchema).min(1).max(10),
});
```

### Step 5 — Pass new fields to Decision DB create

In `generate-simulation.ts`, when creating decisions:
```typescript
await db.decision.create({
  data: {
    scenarioId: scenario.id,
    order: decision.order,
    prompt: decision.prompt,
    options: decision.options,
    consequences: decision.consequences,
    proceduralReference: decision.proceduralReference,
    riskLevelByOption: decision.riskLevelByOption,
    // New fields (only if DB schema supports them — see Step 6)
    ...(decision.keyLearning && { keyLearning: decision.keyLearning }),
    ...(decision.optimalDecision !== undefined && { optimalDecision: decision.optimalDecision }),
  },
});
```

### Step 6 — Prisma schema additions (optional, non-breaking)

```prisma
model Decision {
  // ... existing fields ...
  keyLearning        String?
  optimalDecision    Int?
}

model SimulationTemplate {
  // ... existing fields ...
  difficultyLevel    String?
}
```

Run: `pnpm db:generate` after schema change.

### Tests to add

File: `packages/ai/src/prompts/__tests__/simulation-generator.test.ts` (create new)

```typescript
import { describe, it, expect } from "vitest";
import { buildSimulationPrompt } from "../simulation-generator";

describe("buildSimulationPrompt", () => {
  it("includes process name in user prompt", () => {
    const { user } = buildSimulationPrompt({
      processName: "Compras",
      bpmnStepLabels: ["Recibir solicitud", "Validar presupuesto"],
      risks: [],
      targetRole: "Gerente de Compras",
    });
    expect(user).toContain("PROCESO: Compras");
  });

  it("includes all BPMN steps in user prompt", () => {
    const steps = ["Paso 1", "Paso 2", "Paso 3"];
    const { user } = buildSimulationPrompt({
      processName: "Test",
      bpmnStepLabels: steps,
      risks: [],
      targetRole: "Analista",
    });
    for (const step of steps) {
      expect(user).toContain(step);
    }
  });

  it("handles empty steps gracefully", () => {
    const { user } = buildSimulationPrompt({
      processName: "Test",
      bpmnStepLabels: [],
      risks: [],
      targetRole: "Analista",
    });
    expect(user).toContain("(No se extrajeron pasos del BPMN)");
  });

  it("includes risk data in user prompt", () => {
    const { user } = buildSimulationPrompt({
      processName: "Test",
      bpmnStepLabels: [],
      risks: [{ title: "Riesgo SAP", description: "...", riskType: "TECHNOLOGY", severity: 4, probability: 3 }],
      targetRole: "Analista",
    });
    expect(user).toContain("Riesgo SAP");
  });

  it("includes optional org context when provided", () => {
    const { user } = buildSimulationPrompt({
      processName: "Test",
      bpmnStepLabels: [],
      risks: [],
      targetRole: "Analista",
      organizationIndustry: "Manufactura",
      organizationSize: "250 empleados",
    });
    expect(user).toContain("Manufactura");
    expect(user).toContain("250 empleados");
  });

  it("system prompt references Harvard methodology", () => {
    const { system } = buildSimulationPrompt({
      processName: "Test",
      bpmnStepLabels: [],
      risks: [],
      targetRole: "Analista",
    });
    expect(system.toLowerCase()).toContain("harvard");
  });
});
```

---

## AI-002 — Replace risk-audit system prompt (v1 → v2) 🔴 P1

**File:** `packages/ai/src/prompts/risk-audit.ts`  
**Reference:** `docs/ai/prompt-library/risk-audit-v2.md`  
**Impact:** Quality score +20 points (70 → 90/100). FMEA completeness +48 points. New `executiveSummary` field enables CEO-ready reports.

### Step 1 — Replace RISK_AUDIT_SYSTEM constant

Replace with v2 from `docs/ai/prompt-library/risk-audit-v2.md` (section "Improved Prompt (v2)").

### Step 2 — Replace FMEA_ADDENDUM constant

Replace with v2 FMEA addendum from the same document.

### Step 3 — Update NewRiskSchema in pipeline

File: `packages/ai/src/pipelines/risk-audit.ts`

```typescript
const NewRiskSchema = z.object({
  title: z.string(),
  description: z.string(),
  riskType: z.enum([
    "OPERATIONAL", "COMPLIANCE", "STRATEGIC", "FINANCIAL",
    "TECHNOLOGY", "HUMAN_RESOURCE", "REPUTATIONAL",
  ]),
  severity: z.number().min(1).max(5).catch(3),
  probability: z.number().min(1).max(5).catch(3),
  riskScore: z.number().optional().catch(undefined),    // NEW — severity × probability
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().catch(undefined), // NEW
  affectedStep: z.string().optional(),
  affectedRole: z.string().optional(),
  isOpportunity: z.boolean().catch(false),
  opportunityValue: z.string().optional(),   // was nullable, now also string description
  source: z.enum(["AI_AUDIT", "AI_FMEA", "INTELLIGENCE_GAP", "CONVERSATION"]),
  relatedItemId: z.string().nullable().catch(null),
  suggestedMitigations: z.array(z.string()).catch([]),
  suggestedControls: z.array(SuggestedControlSchema).catch([]),
  // FMEA fields
  failureMode: z.string().optional(),
  failureEffect: z.string().optional(),
  failureCause: z.string().optional(),    // NEW — root cause
  detectionDifficulty: z.number().min(1).max(5).optional(),
  rpn: z.number().optional(),
  recommendedAction: z.string().optional(),   // NEW — specific FMEA action
});

const RiskSummarySchema = z.object({
  totalRiskScore: z.number().catch(0),
  criticalCount: z.number().catch(0),
  highCount: z.number().catch(0),
  mediumCount: z.number().catch(0),   // NEW
  topRiskArea: z.string().catch("OPERATIONAL"),
  risksByCategory: z.record(z.string(), z.number()).optional().catch(undefined),  // NEW
  topVulnerableStep: z.string().nullable().optional().catch(null),  // NEW
  executiveSummary: z.string().optional().catch(undefined),  // NEW
});
```

### Step 4 — Fix TypeScript error on line 223

Current code has a syntax error:
```typescript
// BROKEN:
const maxTokens=*** === "full" ? 16384 : 8192;

// FIXED:
const maxTokens = input.mode === "full" ? 16384 : 8192;
```

This is a pre-existing syntax error that needs to be fixed. Verify the exact content around line 223 and fix.

### Tests to add

File: `packages/ai/src/prompts/__tests__/risk-audit.test.ts` (create new)

```typescript
import { describe, it, expect } from "vitest";
import { RISK_AUDIT_USER, RISK_AUDIT_SYSTEM, FMEA_ADDENDUM } from "../risk-audit";

describe("RISK_AUDIT_USER", () => {
  const baseInput = {
    mode: "risk" as const,
    processName: "Compras",
    processLevel: "OPERATIONAL",
    knowledgeSnapshot: JSON.stringify({ steps: ["Recibir solicitud"] }),
    intelligenceItems: "[]",
    existingRisks: "[]",
  };

  it("includes process name", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).toContain("PROCESO: Compras");
  });

  it("includes knowledge snapshot", () => {
    const prompt = RISK_AUDIT_USER(baseInput);
    expect(prompt).toContain("KNOWLEDGE SNAPSHOT");
  });

  it("appends FMEA mode instruction for mode=fmea", () => {
    const prompt = RISK_AUDIT_USER({ ...baseInput, mode: "fmea" });
    expect(prompt).toContain("FMEA");
  });

  it("appends only risk instruction for mode=risk", () => {
    const prompt = RISK_AUDIT_USER({ ...baseInput, mode: "risk" });
    expect(prompt).toContain("Solo riesgos");
  });

  it("includes organization context when provided", () => {
    const prompt = RISK_AUDIT_USER({ ...baseInput, organizationContext: "Manufactura, CDMX" });
    expect(prompt).toContain("CONTEXTO ORGANIZACIONAL");
    expect(prompt).toContain("Manufactura");
  });

  it("includes transcript excerpts when provided", () => {
    const prompt = RISK_AUDIT_USER({ ...baseInput, transcriptExcerpts: "El sistema falla cada semana" });
    expect(prompt).toContain("EXTRACTOS DE TRANSCRIPCIÓN");
  });
});

describe("RISK_AUDIT_SYSTEM", () => {
  it("references ISO 31000", () => {
    expect(RISK_AUDIT_SYSTEM).toContain("ISO 31000");
  });

  it("defines all 7 risk types", () => {
    const types = ["OPERATIONAL", "COMPLIANCE", "STRATEGIC", "FINANCIAL", "TECHNOLOGY", "HUMAN_RESOURCE", "REPUTATIONAL"];
    for (const t of types) {
      expect(RISK_AUDIT_SYSTEM).toContain(t);
    }
  });
});

describe("FMEA_ADDENDUM", () => {
  it("references RPN calculation", () => {
    expect(FMEA_ADDENDUM).toContain("rpn");
  });

  it("includes detection scale", () => {
    expect(FMEA_ADDENDUM).toContain("detection");
  });
});
```

---

## AI-003 — Patch process-extraction.ts (targeted micro-improvements) 🟠 P2

**File:** `packages/ai/src/prompts/process-extraction.ts`  
**Reference:** `docs/ai/prompt-library/process-extraction-v2.md`  
**Impact:** Quality score +8 points (82 → 90/100). Improves confidence calibration, lane bilingual handling, and adds a self-validation gate.

### Patch 1 — Role priming (line 110)

**Find:**
```typescript
export const PROCESS_EXTRACTION_SYSTEM = `You are a BPMN 2.0 process extraction engine for Auditora.ai, a live process elicitation tool used by professional BPM consultants.
```

**Replace with:**
```typescript
export const PROCESS_EXTRACTION_SYSTEM = `You are a senior BPMN 2.0 process modeling expert with 10 years of experience in live process elicitation for operational consulting firms in Latin America. You have deep mastery of the OMG BPMN 2.0 specification and Six Sigma SIPOC methodology. You work for Auditora.ai, a real-time process capture and evaluation platform.
```

### Patch 2 — Confidence calibration (insert after line 287, "confidence: High (>0.7)..." line)

**Find:**
```
- confidence: High (>0.7) = explicitly described or consultant instruction. Medium (0.4-0.7) = implied. Low (<0.4) = inferred
```

**Replace with:**
```
- confidence CALIBRATION:
  * 0.90-0.95: Exactly stated. "El analista revisa la factura en SAP" → userTask "Revisar factura" conf 0.92
  * 0.75-0.85: Clearly implied. "Luego la aprueban" → exclusiveGateway "¿Aprobada?" conf 0.80
  * 0.55-0.70: Inferred from domain context. "Pasa a finanzas" → task in Finanzas lane conf 0.60
  * 0.35-0.50: Uncertain/speculative. Only include if process flow would be broken without it.
  * < 0.35: Skip unless explicitly instructed by consultant.
  * Consultant instructions: always 0.90
  * Teleprompter answers: always 0.85
```

### Patch 3 — Bilingual lane rule (insert into LANE RULES section, after existing rules)

**Find:**
```
- If the speaker says "el jefe" without specifying which, use the most specific lane available
```

**Add after:**
```
- System/application brand names (SAP, Oracle, SharePoint, Salesforce, Teams, Power BI): ALWAYS use the brand name as-is regardless of conversation language
- Role/department lanes: follow the language of the interview. Spanish interview → Spanish lanes. English interview → English lanes.
- Code-switching: if a speaker says "el Buyer hace la PO", use "Buyer" as-is (not "Comprador")
```

### Patch 4 — Self-validation gate (insert before EXTRACTION RULES section)

**Find:**
```
EXTRACTION RULES:
```

**Add before:**
```
SELF-VALIDATION (mandatory — run before outputting):
[ ] No node label is "Sí", "No", "Si", "Yes", "No aplica" — these are flow conditions, NOT node labels
[ ] No startEvent has label "Inicio", "Start", or "Comienzo" — use the trigger description instead
[ ] No endEvent has label "Fin", "End", or "Terminar" — use the outcome description instead
[ ] Every exclusiveGateway has at least one outgoing connection with a flowCondition defined
[ ] Lane names are consistent with previously used lanes (exact same spelling/case)
[ ] Properties only include fields that were ACTUALLY MENTIONED in the transcript
If any item fails, fix it before outputting the JSON.

```

### Tests to update

File: `packages/ai/src/pipelines/__tests__/process-extraction.test.ts`

Add `inclusiveGateway` to the local `VALID_NODE_TYPES` array in the test file to match the pipeline schema:

```typescript
// BEFORE:
const VALID_NODE_TYPES = [
  "startEvent",
  "endEvent",
  "task",
  "exclusiveGateway",
  "parallelGateway",
] as const;

// AFTER (mirrors pipeline schema):
const VALID_NODE_TYPES = [
  "startEvent",
  "endEvent",
  "task",
  "userTask",
  "serviceTask",
  "manualTask",
  "businessRuleTask",
  "subProcess",
  "exclusiveGateway",
  "parallelGateway",
  "inclusiveGateway",
  "timerEvent",
  "messageEvent",
  "signalEvent",
  "conditionalEvent",
  "textAnnotation",
  "dataObject",
] as const;
```

---

## AI-004 — Fix syntax error in risk-audit pipeline 🔴 P1 (BUG)

**File:** `packages/ai/src/pipelines/risk-audit.ts`  
**Line:** ~223  
**Issue:** Syntax error `const maxTokens=*** === "full" ? 16384 : 8192;` — the `***` is clearly a corrupted token.

**Fix:**
```typescript
// BEFORE:
const maxTokens=*** === "full" ? 16384 : 8192;

// AFTER:
const maxTokens = input.mode === "full" ? 16384 : 8192;
```

This is a blocking bug — the risk-audit pipeline will throw a syntax error at runtime whenever `auditRisks()` is called. Fix immediately.

---

## AI-005 — Add simulation-evaluator confidence scoring 🟠 P2

**File:** `packages/ai/src/prompts/simulation-evaluator.ts`  
**Current score:** 78/100  
**Target:** 88/100

The evaluator is well-designed but has one gap: the `overallScore` formula is hardcoded in the pipeline (`0.3 * alignment + 0.3 * (100 - riskLevel) + 0.4 * criterio`) but the model doesn't know this. If the model tries to "help" by computing a score internally, it may be inconsistent.

Additionally, the evaluator should acknowledge when `proceduralReference` is `"[Procedimiento no especificado]"` (the new v2 format from simulation-generator-v2) and NOT penalize alignment for those decisions.

### Changes needed

**In `simulation-evaluator.ts` REGLAS ESTRICTAS section**, update Rule 4:

**Find:**
```
4. Si no hay referencia procedimental para una decisión, NO penalices alignment por esa decisión específica.
```

**Replace with:**
```
4. Si no hay referencia procedimental para una decisión (null o "[Procedimiento no especificado — evaluar por criterio general]"), NO penalices alignment por esa decisión específica. Evalúa esas decisiones SOLO en las dimensiones RISK_LEVEL y CRITERIO.
```

**Add after Rule 7:**
```
8. Las decisiones que corresponden a un optimalDecision explícito (proporcionado por el generador) deben usarse como VERDAD FUNDAMENTAL para evaluar alignment. Si el participante eligió el optimalDecision, alignment para esa decisión es 95-100.
9. NO calcules un puntaje global — el sistema lo calcula externamente como: 0.3×alignment + 0.3×(100-riskLevel) + 0.4×criterio. Solo proporciona las 3 dimensiones.
```

---

## Summary Table

| Task | File | Priority | Estimated Effort | Impact |
|------|------|----------|-----------------|--------|
| AI-001 | simulation-generator.ts + pipeline | 🔴 P1 | 2h | +27 quality points |
| AI-002 | risk-audit.ts + pipeline | 🔴 P1 | 2h | +20 quality points |
| AI-003 | process-extraction.ts + test | 🟠 P2 | 1h | +8 quality points |
| AI-004 | risk-audit pipeline syntax fix | 🔴 P1 | 15min | BUG FIX — blocking |
| AI-005 | simulation-evaluator.ts | 🟠 P2 | 45min | +10 quality points |

**AI-004 is a blocking bug — fix first.**  
**AI-001 and AI-002 are the highest-impact quality improvements.**

---

# Cycle 2 Tasks — 2026-04-03

**Written by:** AI Specialist Agent #06 (Cycle 2)  
**Status:** Pending implementation — all Cycle 1 tasks (AI-001 to AI-005) still pending

---

## ⚠️ STATUS ALERT — ALL CYCLE 1 TASKS STILL PENDING

Verified via `git log` and source inspection on 2026-04-03. None of AI-001 through AI-005 have been implemented yet. The blocking bug (AI-004) is still present at `packages/ai/src/pipelines/risk-audit.ts:223`:

```typescript
const maxTokens=*** === "full" ? 16384 : 8192; // ← CORRUPTED — MUST FIX FIRST
```

**🔴 AI-004 must be fixed before ANY risk-audit calls can succeed.** This is a TypeScript syntax error that will crash the entire `auditRisks()` function.

**Priority Order for Implementation:**
1. AI-004 (5 min, blocking bug)
2. AI-001 (2h, +27 quality pts)  
3. AI-002 (2h, +20 quality pts)
4. AI-005 (45 min, +10 quality pts)
5. AI-003 (1h, +8 quality pts)

---

## AI-006 — Replace teleprompter system prompt (v1 → v2) 🟠 P2

**File:** `packages/ai/src/prompts/teleprompter.ts`  
**Reference:** `docs/ai/prompt-library/teleprompter-v2.md`  
**Impact:** Quality score +17 points (74 → 91/100). Non-repetition +48pts, language adaptation +62pts, progressive depth +55pts.

### Step 1 — Replace the TELEPROMPTER_SYSTEM constant

Replace the current `TELEPROMPTER_SYSTEM` export with the v2 version from `docs/ai/prompt-library/teleprompter-v2.md` (section "Improved Prompt (v2)").

**Key changes vs v1:**
- Stronger role priming (12-year BPM consultant, LATAM experience)
- Question bank per SIPOC dimension with L1/L2/L3 depth levels
- Explicit non-repetition rule with questionHistory check
- Language detection (Spanish vs English based on transcript)
- Empty diagram failsafe (always ask about trigger first)
- New `urgency`, `depthLevel`, `language` fields in output schema

### Step 2 — Add `questionHistory` parameter to TELEPROMPTER_USER

```typescript
// packages/ai/src/prompts/teleprompter.ts

export const TELEPROMPTER_USER = (
  sessionType: "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION",
  currentNodes: Array<{
    id: string;
    type: string;
    label: string;
    lane?: string;
    connections: string[];
  }>,
  recentTranscript: string,
  processName?: string,
  context?: SessionContext,
  questionHistory?: string[], // NEW — array of previously asked questions this session
) => {
  // ... existing nodesDescription, sipocHints code unchanged ...

  // NEW: Question history block
  const questionHistoryBlock =
    questionHistory && questionHistory.length > 0
      ? `\n\nPREGUNTAS ANTERIORES EN ESTA SESIÓN (NO REPETIR ESTOS TEMAS):\n${questionHistory
          .slice(-10)
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}`
      : "";

  return `Session type: ${sessionType}${processName ? ` — Process: "${processName}"` : ""}

${nodesDescription}
${sipocHintsBlock}

Recent transcript:
${recentTranscript}
${contextHint}
${questionHistoryBlock}
Analiza la cobertura SIPOC, identifica el gap más crítico y sugiere la siguiente pregunta.`;
};
```

### Step 3 — Update Zod schema in teleprompter pipeline

**File:** `packages/ai/src/pipelines/teleprompter.ts`

Find the `TeleprompterResultSchema` (or equivalent) and add new optional fields:

```typescript
const TeleprompterResultSchema = z.object({
  nextQuestion: z.string().min(1),
  reasoning: z.string(),
  gapType: z.enum([
    "never_mapped",        // NEW — when diagram is empty
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
  depthLevel: z.enum(["L1", "L2", "L3"]).optional().catch("L1"), // NEW
  language: z.enum(["es", "en"]).optional().catch("es"),          // NEW
  urgency: z.enum(["HIGH", "MEDIUM", "LOW"]).optional().catch("MEDIUM"), // NEW
  completenessScore: z.number().min(0).max(100).catch(0),
  sipocCoverage: z.object({
    suppliers: z.number().min(0).max(100).catch(0),
    inputs: z.number().min(0).max(100).catch(0),
    process: z.number().min(0).max(100).catch(0),
    outputs: z.number().min(0).max(100).catch(0),
    customers: z.number().min(0).max(100).catch(0),
  }).catch({ suppliers: 0, inputs: 0, process: 0, outputs: 0, customers: 0 }),
});
```

### Step 4 — Update teleprompter pipeline caller signature

Find where `TELEPROMPTER_USER` is called in the pipeline and add the optional `questionHistory` parameter. This should come from session state or be passed in from the meeting module.

### Step 5 — Pass `urgency` and `depthLevel` back to caller

If the pipeline returns `urgency: "HIGH"`, the meeting module UI should show a visual indicator. Add these to the `TeleprompterResult` interface:

```typescript
export interface TeleprompterResult {
  nextQuestion: string;
  reasoning: string;
  gapType: string;
  depthLevel?: "L1" | "L2" | "L3";   // NEW
  language?: "es" | "en";              // NEW
  urgency?: "HIGH" | "MEDIUM" | "LOW"; // NEW
  completenessScore: number;
  sipocCoverage: {
    suppliers: number;
    inputs: number;
    process: number;
    outputs: number;
    customers: number;
  };
}
```

### Tests to add

File: `packages/ai/src/prompts/__tests__/teleprompter.test.ts` (already created by Agent #06)

Run: `pnpm test packages/ai/src/prompts/__tests__/teleprompter.test.ts`

---

## AI-007 — Add `flowCondition` validation to process-extraction pipeline 🟡 P3

**File:** `packages/ai/src/pipelines/process-extraction.ts`  
**Impact:** Prevents invalid diagrams where exclusiveGateway exits have no condition label.

### Problem

The prompt says `flowCondition` is REQUIRED for gateway exits, but `NewNodeSchema.flowCondition` is currently `z.string().nullable().optional()` — no enforcement. Invalid diagrams reach the frontend.

### Fix

Add a Zod `.superRefine()` check after schema parse:

```typescript
// In process-extraction.ts pipeline, after parsing:

function validateGatewayFlowConditions(result: ExtractionResult): string[] {
  const warnings: string[] = [];
  
  // Check if any newNode connects FROM a gateway but has no flowCondition
  const gatewayIds = new Set(
    result.newNodes
      .filter(n => n.type.includes("Gateway"))
      .map(n => n.id)
  );
  
  for (const node of result.newNodes) {
    if (
      node.connectFrom &&
      gatewayIds.has(node.connectFrom) &&
      !node.flowCondition
    ) {
      warnings.push(
        `Node "${node.label}" connects from gateway "${node.connectFrom}" but has no flowCondition`
      );
    }
  }
  
  return warnings;
}

// After parseLlmJson:
const warnings = validateGatewayFlowConditions(result);
if (warnings.length > 0) {
  console.warn("[ProcessExtraction] Gateway flow condition warnings:", warnings);
  // Don't block — just warn. Consultant can fix in UI.
}
```

This adds observability without breaking the pipeline.

---

## AI-008 — Add evaluation tests for all prompt files 🟡 P3

**Written by:** Agent #06  
**Files created:** (already written — Agent #04 just needs to verify they run)

```bash
# Run all new AI test files
pnpm test packages/ai/src/prompts/__tests__/teleprompter.test.ts
pnpm test packages/ai/src/prompts/__tests__/process-extraction-prompt.test.ts
pnpm test packages/ai/src/prompts/__tests__/simulation-evaluator.test.ts
pnpm test packages/ai/src/prompts/__tests__/simulation-generator.test.ts  # from Cycle 1
pnpm test packages/ai/src/prompts/__tests__/risk-audit.test.ts             # from Cycle 1
```

If any test file fails to import (missing export), check that the prompt file exports the function by that exact name. The most likely issue: `buildEvaluationPrompt` must be exported from `simulation-evaluator.ts`.

---

## Updated Summary Table (Cycle 1 + Cycle 2)

| Task | File | Priority | Effort | Impact | Status |
|------|------|----------|--------|--------|--------|
| AI-004 | risk-audit pipeline syntax fix | 🔴 P1 | 5min | BUG FIX blocking | ⚠️ NOT DONE |
| AI-001 | simulation-generator.ts + pipeline | 🔴 P1 | 2h | +27 quality pts | ⚠️ NOT DONE |
| AI-002 | risk-audit.ts + pipeline | 🔴 P1 | 2h | +20 quality pts | ⚠️ NOT DONE |
| AI-005 | simulation-evaluator.ts | 🟠 P2 | 45min | +10 quality pts | ⚠️ NOT DONE |
| AI-003 | process-extraction.ts + test | 🟠 P2 | 1h | +8 quality pts | ⚠️ NOT DONE |
| AI-006 | teleprompter.ts + pipeline | 🟠 P2 | 2h | +17 quality pts | 🆕 NEW |
| AI-007 | process-extraction pipeline validation | 🟡 P3 | 30min | Diagram integrity | 🆕 NEW |
| AI-008 | Run new test files | 🟡 P3 | 15min | Test coverage | 🆕 NEW |
