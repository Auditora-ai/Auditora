# PM Directive — Phase 2 Readiness & Priorities

**Date:** 2026-04-02
**Agent:** PM Agent #03
**Status:** Phase 1 COMPLETE → Phase 2 READY

---

## Vision Alignment Score: 72/100

### What's Working Well (Phase 1 achievements)
| Area | Score | Status |
|------|-------|--------|
| Sidebar restructure (4 sections) | 90/100 | ✅ Scan → Procesos → Evaluaciones → Panorama |
| Dead modules cleaned | 95/100 | ✅ documents, discovery, procedures, risk all removed |
| Evaluaciones renamed | 90/100 | ✅ Routes, nav, translations updated. Old /evaluation redirects properly |
| Process-engine extracted | 85/100 | ✅ BPMN builder as shared package with 48 passing tests |
| Onboarding 4-step wizard | 80/100 | ✅ Account → Company → First Value → Setup Complete |
| Pricing model updated | 85/100 | ✅ Starter $49, Growth $199, Scale $499. Evaluations as value unit |
| Procedures/risks merged | 85/100 | ✅ Absorbed into process-library module |
| i18n cleanup | 75/100 | ⚠️ Stale session refs removed but 20+ hardcoded strings remain (BUG-010, BUG-012) |

### What's Missing (Phase 2 gaps)
| Area | Score | Gap |
|------|-------|-----|
| Scan free tier | 30/100 | Exists but needs complete rebuild per vision (theatrical reveal, shareable link) |
| Evaluation scenario generation | 50/100 | AI prompts exist but no end-to-end flow for process→scenario auto-generation |
| Human risk dashboard | 40/100 | HumanRiskDashboard component exists but needs real data pipeline |
| Before/after metrics | 0/100 | Not implemented — critical for proving ROI |
| Exportable reports | 20/100 | Deliverables module absorbed but no PDF/report export |
| Test coverage | 35/100 | 48 unit tests, but zero tests for auth, scan, onboarding, evaluaciones flows |

---

## Phase 2 Priorities (ordered by RICE)

### 🔴 P0 — Must Do Next

#### F2-01: Scan Free Tier Rebuild
**Why:** This IS the acquisition funnel. Without it, there's no self-serve growth.
**Spec:**
- URL input → AI crawl → theatrical reveal (animated SIPOC map)
- Results must feel specific to the business (not generic)
- CTA: "this is a preview. Sign up for real diagnosis"
- Shareable link generation
- No registration required
**Dependencies:** None
**Effort:** XL (2+ sprints)

#### F2-02: Evaluation Scenario Auto-Generation from Process
**Why:** This is THE product that sells. Users need to go: select process → generate scenarios → run evaluation → see results.
**Spec:**
- Select any documented process
- AI generates 5-decision Harvard-style scenario (prompt already exists: `simulation-generator.ts`)
- Employee runs through decisions
- Results scored against procedural alignment
- Individual + team scores visible
**Dependencies:** Process library must have at least 1 process
**Effort:** L (1 sprint)

### 🟠 P1 — High Impact

#### F2-03: Human Risk Dashboard
**Why:** This is what the CEO buys — "show me where my team will fail"
**Spec:**
- Per-person alignment scores (already have HumanRiskDashboard component)
- Per-process risk heatmap (ProcessHeatmap component exists)
- Trend over time (ScoreTrendChart exists)
- Wire up to real evaluation data, not mocks
**Dependencies:** F2-02 (needs evaluation data)
**Effort:** M

#### F2-04: Before/After Metrics
**Why:** ROI proof. "Before training: 45% alignment. After: 89%."
**Spec:**
- Track evaluation scores over time per process
- Show delta between first evaluation and latest
- Generate "impact report" for leadership
**Dependencies:** F2-02, F2-03
**Effort:** M

### 🟡 P2 — Important But Can Wait

#### F2-05: Exportable Reports (PDF)
**Spec:** Export evaluation results + risk dashboard as branded PDF
**Effort:** M

#### Medium Bug Sprint (BUG-010 through BUG-017)
**Key items:**
- BUG-010: i18n onboarding company step (20+ hardcoded strings)
- BUG-011: companyName collected but never sent to API
- BUG-012: Hardcoded Spanish in BPMN builder
- BUG-013: Sequential DB queries → parallelize
- BUG-016: "Remember me" checkbox not connected

---

## Architecture Notes for Agent #04

### Files to touch for F2-02 (Evaluation Generation):
```
packages/ai/src/prompts/simulation-generator.ts   → Already has Harvard-style prompt ✅
packages/ai/src/pipelines/generate-simulation.ts   → Pipeline exists ✅
packages/ai/src/pipelines/evaluate-simulation.ts   → Evaluator exists ✅
apps/saas/modules/evaluaciones/components/          → UI components exist ✅
apps/saas/app/api/                                  → Need new API routes
packages/database/                                  → May need schema for evaluation runs
```

### Files to touch for F2-01 (Scan Rebuild):
```
apps/saas/modules/radiografia/                      → Current scan module
apps/saas/app/(authenticated)/.../scan/             → Scan routes
packages/ai/src/pipelines/process-discovery.ts      → Discovery pipeline
packages/ai/src/prompts/                            → May need new scan-specific prompts
```

---

## For Agent #06 (AI Specialist)

The simulation prompts are well-written but need testing against real process data. Priorities:
1. Test `simulation-generator.ts` with diverse process types (compras, manufactura, RH)
2. Evaluate output quality — are decisions nuanced enough?
3. Optimize `simulation-evaluator.ts` for accurate scoring
4. Improve scan AI to produce business-specific (not generic) results

---

## Next PM Cycle Actions
1. Create GitHub issues for F2-01 and F2-02 with full specs
2. Review Agent #04's implementation of F2-02 (highest ROI feature)
3. QA cycle after F2-02 completes
4. Begin F2-03 spec refinement
