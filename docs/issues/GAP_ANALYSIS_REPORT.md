# Auditora.ai — Gap Analysis Report
# Vision vs. Reality Assessment

**Date:** 2026-04-02
**Analyst:** Automated Code Analysis
**Scope:** PRODUCT_VISION.md v2 vs. Actual Codebase (post Phase 1 refactor)
**Code Quality Score (QA):** 68/100

---

## Executive Summary

Phase 1 (Foundations) is complete: 12/12 issues done. The structural refactoring is solid — dead modules removed, sidebar reorganized, evaluaciones renamed, plan limits updated, onboarding wizard built. However, the product remains far from sellable. The 3 critical bugs (auth bypass, wrong org, missing forgot-password) are showstoppers. More importantly, the **core value proposition features** (Pillar 3: EVALUATE) exist as scaffolding but lack the automated scenario generation flow that makes the product useful without manual intervention. The scan free tier (acquisition funnel) is not rebuilt yet.

**Overall Vision Alignment: 38%**

| Pillar | Score | Status |
|--------|-------|--------|
| CAPTURAR (Capture) | 45% | PARTIALLY — Scan + Interview exist but scan is weak, no live session capture |
| DOCUMENTAR (Document) | 55% | PARTIALLY — BPMN, procedures, risks, RACI all exist but not unified workspace |
| EVALUAR (Evaluate) | 25% | PARTIALLY — Pipeline exists but no auto-generation from processes, no public-facing eval flow |
| Business Model | 40% | PARTIALLY — Plans/limits updated, onboarding built, but funnel broken |

---

## Pillar 1: CAPTURAR — How Processes Enter the System

### 1a. Scan Automatico (Free Tier — Zero Friction)

| Feature | Vision Promise | Status | Notes |
|---------|---------------|--------|-------|
| Public scan without registration | "Pega URL y en 60 seg ve algo impresionante" | PARTIALLY | `/app/(public)/scan/page.tsx` exists with `RadiografiaWizard`, but... |
| Theatrical reveal UX | "Visually impactante, not tabla aburrida" | MISSING | Current scan renders `InstantReport` which is a standard report layout |
| Shareable link | "Genera un link compartible" | MISSING | No share mechanism from public scan results |
| CTA to register | "Regístrate para el diagnóstico real" | MISSING | No clear funnel from public scan → registration |
| Business-specific output | "Datos específicos al negocio, no genéricos" | PARTIALLY | Has `industry-inference.ts` but vision says output feels generic ("empresa de manufactura") |
| Scan save bug | Stable save endpoint | BUG-005 | Unsafe `JSON.parse` on riskResults crashes save |

**Scan Module Architecture:**
- `modules/radiografia/` has v2 components (AuthenticatedScan, RadiografiaWizard, multi-step wizard)
- `lib/web-crawler.ts`, `industry-inference.ts`, `sipoc-to-nodes.ts`, `sipoc-to-knowledge.ts` exist
- Public scan route exists at `(public)/scan/page.tsx`
- Authenticated scan at `[orgSlug]/scan/page.tsx`
- **Gap:** No rebuild of the scan UX as theatrical reveal; no funnel to registration

### 1b. Entrevista por Chat (Deep Capture)

| Feature | Vision Promise | Status | Notes |
|---------|---------------|--------|-------|
| AI chat interview | "Asistente de IA entrevista por chat" | IMPLEMENTED | `sessions/interview/page.tsx` creates AI_INTERVIEW sessions, loads `AIInterviewPage` component |
| SIPOC-structured questions | "Pregunta qué entra, quién lo hace, qué pasa si falla" | IMPLEMENTED | `ai/pipelines/sipoc-extraction.ts` + `chat-extraction.ts` + `discovery-extraction.ts` |
| Generates BPMN from chat | "Genera diagrama BPMN y procedimiento" | IMPLEMENTED | `process-extraction.ts` pipeline, `bpmn-builder.ts` in process-engine |
| Works in Spanish | "Funciona en español con acentos" | PARTIALLY | Prompts are in Spanish, but BUG-012 shows hardcoded "Inicio"/"Fin" in BPMN builder |

### 1c. Sesión en Vivo (Live Demo)

| Feature | Vision Promise | Status | Notes |
|---------|---------------|--------|-------|
| Bot joins videocall | "Recall.ai bot se une a la videollamada" | EXISTS | `sessions/[sessionId]/live/` route exists with layout hiding NavBar |
| Real-time BPMN generation | "Genera diagrama BPMN en tiempo real" | PARTIALLY | Session flow exists but real-time generation quality unknown |
| Premium feature | "Secundario como input channel" | IMPLEMENTED | Behind session credits limit |

**Pillar 1 Assessment: 45%** — The building blocks exist (scan, chat interview, live sessions) but the FREE TIER SCAN FUNNEL is broken, which is the entire acquisition strategy. BUG-005 makes scan save unreliable. No theatrical reveal. No share links. No clear CTA to registration.

---

## Pillar 2: DOCUMENTAR — Where Processes Live

### Process Library (Unified Workspace)

| Feature | Vision Promise | Status | Notes |
|---------|---------------|--------|-------|
| BPMN Diagram | "Versión técnica para consultor/analista" | IMPLEMENTED | `process-engine` package with `bpmn-builder.ts`, `bpmn-layout-preprocessor.ts`, viewer in ProcessWorkspace |
| Visual Map | "Versión humana para CEO/gerente" | PARTIALLY | `ProcessMapVisual.tsx` and `HorizontalFlowVisual.tsx` exist in deliverables module (still present) |
| SOP/Procedure | "Generado por IA, editable, versionado" | IMPLEMENTED | `procedure-gen.ts` pipeline, `ProcedureWorkspace.tsx`, `ProcedureList.tsx`, versioning via `VersionDiff.tsx` |
| RACI | "Quién es responsable de cada paso" | IMPLEMENTED | `raci-generator.ts` pipeline, `RaciTab.tsx`, `SidebarRaciTab.tsx` |
| Risks as property | "No módulo separado, propiedad del proceso" | IMPLEMENTED | `SidebarRiskTab.tsx` in process-library, risks route redirects. `risk-audit.ts` pipeline supports ISO 31000 + FMEA |
| Procedures merged | "Se integra dentro del workspace de Procesos" | IMPLEMENTED | Procedures components moved to `process-library/components/procedures/` |
| Enriched by evaluations | "60% de evaluados falló en este paso" | MISSING | No feedback loop from evaluation results back to process documentation |
| Export capability | "Deliverables absorbed in Procesos" | PARTIALLY | `ExportReportButton.tsx` exists, deliverables routes redirect to `/processes` |

**Pillar 2 Assessment: 55%** — This is the strongest pillar. BPMN, procedures, RACI, and risks all have working AI pipelines and UI components. The workspace pattern (diagram + context sidebar) is solid. Key gap: no feedback loop from evaluations enriching documentation, and export is limited (BUG: reports count is hardcoded to 0 in usage.ts).

---

## Pillar 3: EVALUAR — The Product That Sells

### Evaluation Engine

| Feature | Vision Promise | Status | Notes |
|---------|---------------|--------|-------|
| Harvard-style case generation | "IA genera escenarios basados en procedimiento REAL" | IMPLEMENTED | `generate-simulation.ts` pipeline with full prompt engineering |
| Decision-based scenarios | "Empleado enfrenta decisiones concretas" | IMPLEMENTED | `EvaluacionRunner.tsx`, `EvaluacionRunPage.tsx` with decision flow |
| AI-powered scoring | "Sistema evalúa si decisión alinea con procedimiento" | IMPLEMENTED | `evaluate-simulation.ts` with alignment/risk/criterio scores, control points |
| Human Risk Profile | "Score por persona" | IMPLEMENTED | `HumanRiskProfile` model in DB, `upsertHumanRiskProfile()` in evaluation pipeline |
| Risk Dashboard | "Dashboard de riesgo humano" | IMPLEMENTED | `dashboard-queries.ts` with KpiRow, ScoreDistributionChart, TeamTable, ProcessHeatmap, ErrorPatternsCard, ScoreTrendChart |
| Tab-based catalog+dashboard | Catalog | Risk Dashboard tabs | IMPLEMENTED | `EvaluacionesTabs.tsx` with switcher (BUG-004: duplicate prop) |
| **AUTO-GENERATION from process** | "Seleccionas un proceso → IA genera" | MISSING | The pipeline exists but there's NO UI flow to trigger it from a process. User must manually create simulation templates. This is the critical missing link. |
| Before/After metrics | "Pasamos de 45% a 82% de alineación" | MISSING | `scoreTrend` exists in dashboard-queries but no before/after comparison view |
| Exportable reports | "Reportes para junta directiva" | MISSING | Usage.ts has `reportsUsed = 0` hardcoded. No report generation/export for evaluations. |
| Per-person breakdown | "María 91%, Carlos 45%" | IMPLEMENTED | TeamTable component shows per-person scores |
| Procedural alignment % | "72% de alineación procedimental" | IMPLEMENTED | alignment score in evaluation pipeline |

**Pillar 3 Assessment: 25%** — The AI pipelines and scoring engine are well-built, but the CRITICAL GAP is: **there is no user-facing flow to automatically generate evaluations from documented processes**. The user must currently create SimulationTemplates manually. The vision says "select a process → AI generates scenarios" — this bridge doesn't exist in the UI. This is Phase 2 Feature #15 (F2-02), which is PENDING. Without it, the entire monetization model (evaluations as unit of value) is non-functional.

---

## Business Model & Funnel

| Feature | Vision Promise | Status | Notes |
|---------|---------------|--------|-------|
| Plans: Starter $49, Growth $199, Scale $499 | New evaluation-based plans | IMPLEMENTED | `config.ts` has all 3 plans with correct limits |
| Enterprise plan | Custom, sales-led | IMPLEMENTED | `isEnterprise: true` in config |
| PlanLimits | evaluations/evaluators/processes/sessions/reports/adminUsers | IMPLEMENTED | Types and config match vision exactly |
| 14-day trial | Free trial on all plans | IMPLEMENTED | `trialPeriodDays: 14` on all prices |
| UsageDashboard | Shows evaluation metrics | IMPLEMENTED | 5 metrics grouped by category, API endpoint exists |
| Onboarding wizard (4 steps) | Account → Company → First Value → Setup | IMPLEMENTED | All 4 steps exist, form + zod validation |
| Company step | Industry, size, eval target, concern process | IMPLEMENTED | But BUG-010: 20+ hardcoded English strings, BUG-011: companyName not sent to API |
| First Value step | 3 action cards (chat, dashboard, process) | IMPLEMENTED | Cards exist but hrefs are relative (`/scan`, `/`, `/processes`) — not org-scoped |
| Setup Complete step | Invite members link | BUG-008 | Wrong route `/settings/members` missing org slug |
| Scan free tier → Register | Funnel from public scan to signup | MISSING | No CTA or redirect flow |
| Evaluation-based billing | Enforce limits based on evaluations | PARTIALLY | Usage tracking works, but limit enforcement at API level is not confirmed |

**Business Model Assessment: 40%** — Pricing infrastructure is in place. Onboarding is built but has 3+ bugs. The critical gap is the **acquisition funnel**: public scan → registration → first value. The funnel is conceptually defined but not wired up.

---

## Sidebar & Navigation

| Vision Sidebar | Actual Implementation | Status |
|---------------|----------------------|--------|
| 1. Descubrir (Scan + Interview + Live) | "Scan" (ScanSearchIcon, `/scan`) | PARTIALLY — Labeled "Scan" not "Descubrir". Chat interview is via `/sessions/interview`, not integrated into scan flow |
| 2. Procesos (BPMN + procedures + RACI + risks) | "Processes" (WorkflowIcon, `/processes`) | IMPLEMENTED — Unified workspace |
| 3. Evaluaciones (Stress tests + Risk Dashboard) | "Evaluaciones" (GraduationCapIcon, `/evaluaciones`) | IMPLEMENTED — Tabs with catalog + dashboard |
| 4. Panorama (Dashboard consolidado) | "Dashboard" (LayoutDashboardIcon, basePath) | PARTIALLY — Route exists but no consolidated dashboard built |
| 5. Configuración (bottom) | "Settings" (SettingsIcon, `/settings`) | IMPLEMENTED |

**Navigation Assessment:** Sidebar matches vision structure (4 items + settings at bottom). Has flow step indicators (1→2→3→4) with completion tracking. Minor gaps: "Scan" should be "Descubrir", interview not integrated as channel.

---

## AI Capabilities Inventory

| AI Pipeline | File | Status | Used By |
|-------------|------|--------|---------|
| process-discovery | prompts + pipeline | EXISTS | Scan |
| chat-extraction | prompts + pipeline | EXISTS | AI Interview |
| session-summary | prompts + pipeline | EXISTS | Session review |
| sipoc-extraction | pipeline only | EXISTS | Scan/Interview |
| process-extraction | prompts + pipeline + tests | EXISTS | Core process capture |
| process-landscape | prompts + pipeline | EXISTS | Org-level view |
| diagram-repair | prompts + pipeline | EXISTS | BPMN fixing |
| value-chain | prompts + pipeline | EXISTS | Strategic view |
| simulation-generator | prompts + pipeline | EXISTS | Evaluation creation |
| simulation-evaluator | prompts + pipeline | EXISTS | Evaluation scoring |
| bpmn-to-text | pipeline only | EXISTS | Utility |
| discovery-extraction | prompts + pipeline | EXISTS | Discovery flow |
| document-extraction | prompts + pipeline | EXISTS | Document processing |
| stakeholder-consolidation | pipeline only | EXISTS | Multi-session merge |
| process-audit | prompts + pipeline | EXISTS | Process analysis |
| teleprompter | prompts + pipeline | EXISTS | Session preparation |
| horizontal-view | prompts + pipeline | EXISTS | Visual map |
| mission-vision | prompts + pipeline | EXISTS | Org context |
| procedure-gen | prompts + pipeline | EXISTS | SOP generation |
| risk-audit | prompts + pipeline | EXISTS | ISO 31000 + FMEA |
| company-brain-enrichment | prompts + pipeline | EXISTS | Knowledge base |
| raci-generator | pipeline only | EXISTS | RACI matrix |
| complexity-score | pipeline only | EXISTS | Process scoring |
| session-preparation | prompts + pipeline | EXISTS | Pre-session prep |

**AI Assessment:** Comprehensive pipeline coverage. 24 AI pipelines covering the full spectrum from capture to evaluation. The AI layer is the strongest part of the codebase. Key gap: simulation generation is not auto-triggered from the UI.

---

## Critical Bugs Blocking Vision

### SHOWSTOPPERS (Must fix before any sales)

| Bug | Severity | Impact on Vision | Compounds With |
|-----|----------|-----------------|----------------|
| BUG-001 | 🔴 CRITICAL | Auth bypass — any user can access any org's data. Blocks ALL paid features. | Every feature that uses org-scoped data |
| BUG-002 | 🔴 CRITICAL | Multi-org users get wrong org data updated. Corrupts onboarding company step data. | BUG-007 (no input validation amplifies damage) |
| BUG-003 | 🔴 CRITICAL | Forgot password 404 — users can't recover accounts. Blocks retention. | - |

### HIGH SEVERITY (Block specific flows)

| Bug | Impact on Vision | Compounds With |
|-----|-----------------|----------------|
| BUG-005 | Scan save crashes — blocks entire acquisition funnel | Pillar 1 gap (scan rebuild) |
| BUG-006 | SessionProvider hung for unauthenticated users — blocks public scan | Pillar 1 gap (free tier scan) |
| BUG-008 | Onboarding completion sends to wrong route — broken first-run experience | Business model gap (onboarding) |
| BUG-009 | Empty name accepted in onboarding — data quality issues | BUG-007, BUG-011 |
| BUG-010 | 20+ hardcoded English strings in onboarding — blocks LATAM target | i18n debt |
| BUG-011 | companyName collected but never sent to API — lost data | BUG-002, BUG-007 |
| BUG-012 | Hardcoded Spanish "Inicio"/"Fin" in BPMN builder — mixed languages | i18n debt |

---

## Feature-by-Feature Gap Matrix

| # | Vision Feature | Code Exists | UI Wired | Bugs | Status |
|---|---------------|-------------|----------|------|--------|
| 1 | Public scan (no auth) | ✅ Route + wizard | ⚠️ Basic | BUG-005, BUG-006 | PARTIALLY |
| 2 | Theatrical reveal UX | ❌ | ❌ | - | MISSING |
| 3 | Shareable scan results | ❌ | ❌ | - | MISSING |
| 4 | Scan → Register CTA | ❌ | ❌ | - | MISSING |
| 5 | AI Chat Interview | ✅ Pipeline + API | ✅ Full page | - | IMPLEMENTED |
| 6 | Live Session (Recall.ai) | ✅ Route + layout | ⚠️ Basic | - | PARTIALLY |
| 7 | BPMN diagrams | ✅ process-engine | ✅ ProcessWorkspace | BUG-012 | IMPLEMENTED |
| 8 | Visual process map | ✅ Components | ⚠️ In deliverables | - | PARTIALLY |
| 9 | SOP/Procedure generation | ✅ Pipeline + UI | ✅ ProcedureWorkspace | - | IMPLEMENTED |
| 10 | RACI matrix | ✅ Pipeline + UI | ✅ RaciTab | - | IMPLEMENTED |
| 11 | Risks as process property | ✅ SidebarRiskTab | ✅ In workspace | - | IMPLEMENTED |
| 12 | FMEA analysis | ✅ risk-audit pipeline | ⚠️ Via risks | - | PARTIALLY |
| 13 | Harvard-style evaluations | ✅ generate-simulation | ⚠️ Manual creation only | BUG-004 | PARTIALLY |
| 14 | Auto-generate from process | ❌ No UI trigger | ❌ | - | MISSING |
| 15 | Evaluation runner | ✅ EvaluacionRunner | ✅ Run flow | - | IMPLEMENTED |
| 16 | AI scoring engine | ✅ evaluate-simulation | ✅ Auto-scores | - | IMPLEMENTED |
| 17 | Human Risk Profile | ✅ DB model + upsert | ✅ Dashboard | - | IMPLEMENTED |
| 18 | Risk dashboard | ✅ dashboard-queries | ✅ 6 dashboard cards | - | IMPLEMENTED |
| 19 | Before/after metrics | ❌ | ❌ | - | MISSING |
| 20 | Exportable reports | ❌ (reportsUsed = 0) | ❌ | - | MISSING |
| 21 | Evaluation-based plans | ✅ config.ts | ✅ Pricing table | - | IMPLEMENTED |
| 22 | 4-step onboarding | ✅ All steps | ⚠️ Has bugs | BUG-008,009,010,011 | PARTIALLY |
| 23 | UsageDashboard | ✅ API + UI | ✅ 5 metrics | - | IMPLEMENTED |
| 24 | Panorama (consolidated dashboard) | ⚠️ Route exists | ❌ Not built | - | MISSING |
| 25 | Multi-user collaboration | ❌ | ❌ | - | MISSING (Phase 3) |
| 26 | Notifications | ❌ | ❌ | - | MISSING (Phase 3) |
| 27 | Integrations (Slack/Teams) | ❌ | ❌ | - | MISSING (Phase 3) |
| 28 | Certification program | ❌ | ❌ | - | MISSING (Phase 3) |

**Summary: 10 IMPLEMENTED, 8 PARTIALLY, 6 MISSING (Phase 2), 4 MISSING (Phase 3)**

---

## Critical Gaps Blocking Sellability

### Gap 1: No Automated Evaluation Generation (CRITICAL)
**Vision says:** "Select a process → AI generates scenarios automatically"
**Reality:** The `generateSimulationTemplate()` pipeline exists and works beautifully, but there is NO UI button or flow that lets a user go from a documented process to generating an evaluation. This is the entire monetization thesis — evaluations as unit of value. Without this bridge, the product cannot demonstrate its core value.
**Fix:** Phase 2 Issue #15 (F2-02). Add "Generate Evaluation" button in ProcessWorkspace that triggers the pipeline.
**Effort:** M (Medium)

### Gap 2: Broken Acquisition Funnel (CRITICAL)
**Vision says:** "Scan free → impressive result → register → convert"
**Reality:** Public scan exists but doesn't have theatrical reveal, no shareable links, no CTA to register. BUG-005 makes scan save crash. BUG-006 hangs SessionProvider for unauthenticated users.
**Fix:** Phase 2 Issue #14 (F2-01). Rebuild scan UX with wow factor.
**Effort:** L (Large)

### Gap 3: Auth Bypass (CRITICAL)
**BUG-001** allows any user to access any org's data. This is a security showstopper that blocks all paid features.
**Fix:** Add null check/throw in `verifyOrganizationMembership()`.
**Effort:** S (Small) but high risk.

### Gap 4: No Exportable Reports (HIGH)
**Vision says:** "Reportes exportables para junta directiva"
**Reality:** `reportsUsed = 0` is hardcoded. No report generation exists for evaluations. This is a key selling point for the CEO persona.
**Fix:** Phase 2 Issue #18 (F2-05).
**Effort:** L (Large)

### Gap 5: No Before/After Metrics (HIGH)
**Vision says:** "Tu equipo pasó de 45% a 82% de alineación en 3 meses"
**Reality:** Score trend exists but no comparison view showing improvement over time per process.
**Fix:** Phase 2 Issue #17 (F2-04).
**Effort:** M (Medium)

---

## Priority Recommendations

### Immediate (Before ANY Phase 2 work)
1. **Fix 3 Critical bugs** (BUG-001, BUG-002, BUG-003) — 1 day
2. **Fix 6 High bugs** (BUG-004 through BUG-009) — 1-2 days
3. **Fix BUG-010 + BUG-011** (onboarding i18n + companyName) — 0.5 days
4. **Remove token from git history** (push blocked) — 0.5 days

### Phase 2 Priority Order (Product becomes sellable)
1. **F2-02: Auto-generate evaluations from processes** — This is THE feature that connects Pillar 2 to Pillar 3 and enables monetization
2. **F2-01: Scan free tier rebuild** — Acquisition funnel, biggest growth lever
3. **F2-03: Human risk dashboard improvements** — Before/after metrics for CEO persona
4. **F2-05: Exportable reports** — Board-level deliverable
5. **F2-04: Before/after metrics** — Tangible ROI proof

### Quick Wins That Increase Perceived Quality
- Fix sidebar label "Scan" → "Descubrir" (matches vision)
- Wire onboarding FirstValue step hrefs to be org-scoped
- Add ARIA attributes to EvaluacionesTabs (BUG-018)
- Fix indentation corruption in NavBar (BUG-020)

---

## Appendix: Module Inventory

### apps/saas/modules/ (Active)
- `auth/` — Authentication (login, signup, session, forgot password)
- `onboarding/` — 4-step wizard (Account, Company, FirstValue, SetupComplete)
- `radiografia/` — Scan module (v2 wizard, crawler, industry inference, SIPOC)
- `process-library/` — Unified process workspace (BPMN, procedures, risks, RACI, sessions, versions)
- `evaluaciones/` — Evaluation catalog + runner + risk dashboard
- `organizations/` — Org management, members, invitations, AI keys
- `deliverables/` — Remaining visual components (ProcessMapVisual, HorizontalFlowVisual) — partially absorbed
- `shared/` — NavBar, sidebar, hooks, cache, i18n
- `payments/` — UsageDashboard, PricingTable, UpgradeBanner
- `i18n/` — Locale management

### packages/ (Shared)
- `process-engine/` — BPMN builder, layout, colors, export (48 tests pass)
- `ai/` — 24 AI pipelines + prompts + schemas + instrumentation
- `payments/` — Plan config, types, usage tracking, provider integrations
- `database/` — Prisma client + schema
- `auth/` — Authentication config
- `i18n/` — Translation files (en, es, fr, de)
- `ui/` — Shared UI components

### Routes (58 total page.tsx files)
- 8 public routes (scan, share, risks, prepare)
- 50 authenticated routes (org-scoped, settings, admin, onboarding)

---

*Report generated from codebase analysis on 2026-04-02. Cross-referenced with PRODUCT_VISION.md v2, PROGRESS.md, and 21 QA bug reports (BUG-001 through BUG-021).*
