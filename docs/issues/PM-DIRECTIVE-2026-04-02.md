# PM DIRECTIVE — Urgent from Oscar (Founder)
**Date:** 2026-04-02
**Priority:** MAXIMUM
**Source:** Oscar via gap analysis review

---

## DIRECTIVE
Read `docs/issues/GAP_ANALYSIS_REPORT.md` COMPLETELY. It contains a full vision-vs-reality analysis.

Your job this cycle:
1. Create ALL missing bugs/issues from the gap analysis into PROGRESS.md
2. Prioritize them using RICE
3. Assign them to Agent #04 (Developer) for immediate resolution
4. The Developer agent reads PROGRESS.md and ai-tasks.md every cycle — make tasks crystal clear

---

## IMMEDIATE PRIORITIES (Oscar's order)

### WAVE A — Security Showstoppers (fix FIRST, before anything else)
- BUG-001: Auth bypass in verifyOrganizationMembership (CRITICAL)
- BUG-002: Wrong org in profile API (CRITICAL)  
- BUG-003: Missing forgot-password page (CRITICAL)

### WAVE B — High Bugs (fix second)
- BUG-004: Duplicate prop on EvaluacionesTabs
- BUG-005: Unsafe JSON.parse on riskResults (blocks scan)
- BUG-006: SessionProvider hung for unauthenticated (blocks public scan)
- BUG-007: No input validation on org profile PUT
- BUG-008: Wrong route in onboarding completion
- BUG-009: Missing .min(1) on name validation

### WAVE C — Onboarding bugs (from QA report)
- BUG-010: 20+ hardcoded English strings in onboarding (blocks LATAM)
- BUG-011: companyName collected but never sent to API
- BUG-012: Hardcoded Spanish "Inicio"/"Fin" in BPMN builder

### WAVE D — TypeScript errors (from tsc --noEmit)
- Duplicate organizationSlug prop in evaluaciones/page.tsx
- Prisma _ext type errors in packages/database/prisma/client.ts

### WAVE E — Vision Gaps (Phase 2 features, in order)
1. **F2-02: Auto-generate evaluations from processes** — THE most critical feature. Add "Generate Evaluation" button in ProcessWorkspace that triggers generateSimulationTemplate() pipeline. This connects Pillar 2→3 and enables monetization.
2. **F2-01: Scan free tier rebuild** — Theatrical reveal UX, shareable links, CTA to register
3. **F2-03: Human risk dashboard** — Before/after comparison view
4. **F2-05: Exportable reports** — Board-level PDF reports (reportsUsed is hardcoded to 0)
5. **F2-04: Before/after metrics** — "Team went from 45% to 82%"

### WAVE F — Quick Wins
- Sidebar label "Scan" → "Descubrir"
- Wire onboarding FirstValue hrefs to be org-scoped
- Add ARIA attributes to EvaluacionesTabs
- Fix NavBar indentation corruption
- Build Panorama consolidated dashboard (currently empty route)
- Add evaluation feedback loop to process documentation ("60% failed this step")

---

## FORMAT FOR DEVELOPER TASKS IN PROGRESS.md

For each task, include:
```
### TASK-NNN: [Title]
**Priority:** Critical/High/Medium
**Assigned to:** #04
**Status:** TODO
**Files to modify:** [exact file paths]
**What to do:** [specific implementation instructions]
**Acceptance criteria:** [how to verify it's done]
```

Make tasks SPECIFIC and ACTIONABLE. Don't be vague. Include file paths, function names, and exact changes needed.

---

## GITHUB ISSUES CREATED (reference these in PROGRESS.md)

### Wave A — Critical Security
- #26 BUG-001: Auth bypass verifyOrganizationMembership
- #27 BUG-002: Wrong org in profile API
- #28 BUG-003: Missing forgot-password page

### Wave B — High Bugs
- #29 BUG-004: Duplicate prop EvaluacionesTabs
- #30 BUG-005: Unsafe JSON.parse riskResults
- #31 BUG-006: SessionProvider hung for unauthenticated
- #32 BUG-007: No input validation org profile PUT
- #33 BUG-008: Wrong route onboarding completion
- #34 BUG-009: Missing .min(1) name validation

### Wave C — i18n + Onboarding
- #35 BUG-010: Hardcoded English strings in onboarding
- #36 BUG-011: companyName not sent to API
- #37 BUG-012: Hardcoded Inicio/Fin in BPMN

### Wave D — TypeScript
- #38 Fix TSC errors (Prisma _ext + duplicate prop)

### Wave E — Vision Gaps
- #39 Sidebar Scan → Descubrir
- #40 Onboarding FirstValue org-scoped hrefs
- #41 Panorama dashboard empty
- #42 Evaluation feedback loop to processes
- #43 Scan theatrical reveal + shareable + CTA

## NOTES
- All issues are on GitHub with labels (critical, high, medium, qa, vision-gap)
- Agent #04 can push to git via SSH (configured and working)
- Agent #05 (QA) will verify fixes in subsequent cycles
- Agent #06 (AI) handles prompt improvements separately
- The gap analysis found 38% overall vision alignment — target 70%+ after these fixes
- All 24 AI pipelines work — the gaps are in UI/UX wiring, not AI quality
- When closing issues, use: "Fixes #NN" in commit message to auto-close on GitHub
