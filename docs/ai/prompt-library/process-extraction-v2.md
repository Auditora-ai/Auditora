# process-extraction — v2
**Agent:** AI Specialist #06  
**Date:** 2026-04-02  
**Cycle:** 1  
**Status:** Analysis only — v1 is high quality, targeted improvements proposed

---

## Assessment Summary

process-extraction.ts is the most mature prompt in the codebase. It scores **82/100** — the highest of Tier 1. Several improvements can push it to 90+.

### v1 Quality Score: 82/100

| Dimension | Score | Notes |
|-----------|-------|-------|
| Role priming | 65/100 | "BPMN 2.0 extraction engine" is functional but lacks authoritative expert persona |
| Methodology reference | 85/100 | BPMN 2.0 spec well-referenced; naming rules excellent |
| Output schema | 90/100 | Very complete schema with all major fields |
| Anti-hallucination | 88/100 | "ONLY output nodes for steps NOT already in diagram" is strong |
| Few-shot examples | 78/100 | Intelligence Rules section provides implicit examples; could be stronger |
| Chain-of-Thought | 60/100 | No explicit CoT reasoning steps |
| Edge case handling | 85/100 | Good consultant instruction & teleprompter handling |
| Localization | 70/100 | "Use the language of the conversation" is weak — no bilingual guidance |

---

## Issues Found

### Issue 1 (Medium) — No confidence calibration guidance
The `confidence` field (0.0-1.0) is defined in the schema but the prompt gives minimal guidance beyond "High >0.7 = explicitly described". Models tend to over-rate confidence (anchoring bias toward 0.8-0.9). Need explicit calibration examples.

**Fix:** Add concrete examples:
```
confidence CALIBRATION:
- 1.0: Explicitly stated with exact words. "El analista revisa la factura en SAP" → Revisar factura (userTask) confidence 0.95
- 0.8: Clearly implied by context. "Luego la aprueban" → Aprobar solicitud confidence 0.80
- 0.6: Inferred from domain knowledge. "Después va al área de finanzas" → probably involves Validar pago, confidence 0.60
- 0.4: Possible but uncertain. "A veces hay un paso intermedio" → confidence 0.35
- Below 0.4: Skip unless consultant-instructed
```

### Issue 2 (Medium) — `inclusiveGateway` type missing from test schema
The extraction pipeline Zod schema (`process-extraction.ts pipeline`) has `inclusiveGateway` in VALID_NODE_TYPES but the test file's local schema (`__tests__/process-extraction.test.ts`) only has 5 types. Mismatch could hide test failures.

**Fix:** Update test schema to mirror the pipeline schema exactly (this is a code issue, not a prompt issue — see ai-tasks.md).

### Issue 3 (Low) — `flowCondition` validation gap
The prompt says flowCondition is REQUIRED for gateway exits but the Zod schema makes it optional. A gateway with no flowCondition creates broken diagrams. Need validation.

### Issue 4 (Low) — Bilingual diagram labels
When a Spanish conversation mentions English system names (SAP, Oracle, SharePoint), the lane should stay in English. When an English conversation mentions Spanish roles ("Gerente de Compras"), should the lane use the Spanish term or translate? The current rule "use the language of the conversation" is ambiguous for mixed-language sessions.

**Fix:** Add: "Lane names follow the ROLE's language: if the speaker is describing their company in Spanish, lanes are in Spanish even if the system name is English. System lanes (SAP, SharePoint, Oracle) always use their brand name as-is."

---

## Micro-improvements for v2 (targeted patches, not full rewrite)

### Patch 1: Role priming (lines 110-111)
```typescript
// BEFORE:
export const PROCESS_EXTRACTION_SYSTEM = `You are a BPMN 2.0 process extraction engine for Auditora.ai, a live process elicitation tool used by professional BPM consultants.

// AFTER:
export const PROCESS_EXTRACTION_SYSTEM = `You are a senior BPMN 2.0 process modeling expert with 10 years of experience in live process elicitation for operational consulting firms. You deeply understand the OMG BPMN 2.0 specification and Six Sigma process mapping conventions. You work for Auditora.ai, a real-time process elicitation tool used by BPM consultants across Latin America.
```

### Patch 2: Confidence calibration (insert after "confidence: High (>0.7)..." line 287)
```
CONFIDENCE CALIBRATION EXAMPLES:
- 0.95: "El analista revisa la factura en SAP" → userTask "Revisar factura" (lane: Analista)
- 0.80: "Luego la aprueban" → exclusiveGateway "¿Aprobada?" (implied approval step)
- 0.60: "Después va a finanzas" → probably task in Finanzas lane (inferred)
- 0.35: "A veces hay algo intermedio" → skip unless explicitly confirmed
```

### Patch 3: Bilingual lane rule (add to LANE RULES section)
```
- System/application names (SAP, Oracle, SharePoint, Salesforce): ALWAYS use brand name as-is, regardless of conversation language
- Role names: Follow the language of the person being interviewed. Spanish interview → Spanish lane names
- When a speaker code-switches (mixes Spanish/English), use whichever the speaker used for that specific role: "el Buyer hace la PO" → lane "Buyer"
```

### Patch 4: Self-validation gate (add before EXTRACTION RULES)
```
SELF-VALIDATION (run before outputting):
[ ] Every exclusiveGateway has 2+ outgoing connections defined in connectTo/flowCondition
[ ] No node has label "Sí", "No", "Si", "Yes", "No aplica" — these are conditions, not labels
[ ] No startEvent has label "Inicio" or "Start" — use the trigger description
[ ] No endEvent has label "Fin" or "End" — use the outcome description
[ ] Lane names are consistent with previously used lanes in this diagram
If any check fails, fix before outputting.
```

---

## Files to Modify
- `packages/ai/src/prompts/process-extraction.ts` — 4 targeted patches (lines 110, 287, LANE RULES section, EXTRACTION RULES section)
- `packages/ai/src/pipelines/__tests__/process-extraction.test.ts` — expand VALID_NODE_TYPES to match pipeline
