# Auditora.ai — Progreso de Ejecución

**Última actualización:** 2026-04-03 (Module Perfection — PANORAMA Batch 1-3 DONE)
**PM:** Hermes Agent #03
**Estado:** Fase 1 COMPLETE ✅ — Fase 2 COMPLETE ✅ — Fase 3 IN PROGRESS — Module Perfection IN PROGRESS

---

## Estrategia de Ejecución

### Reglas
1. **Un issue a la vez.** No paralelizar salvo los que no tienen dependencias y son independientes.
2. **TDD obligatorio.** Tests antes de código. Cada issue lo dice explícitamente.
3. **Dev → QA → Done.** Un agente desarrolla, otro (o yo) hace QA.
4. **Commits granulares.** Un commit por test, un commit por implementación, un commit por fix.
5. **Calidad > velocidad.** Prefiero 1 issue perfecto a 3 issues a medias.
6. **PRODUCT_VISION.md es la biblia.** Si hay conflicto, ahí está la verdad.

### Manejo de Memoria
- `docs/PRODUCT_VISION.md` = fuente de verdad del producto (no cambia seguido)
- `docs/issues/PROGRESS.md` = este archivo, estado actual de ejecución
- Memory tool = contexto persistente entre sesiones (qué issue vamos, qué quedó pendiente)
- Cada nueva sesión: leer PROGRESS.md + PRODUCT_VISION.md + verificar estado en GitHub

### Flujo por Issue
```
1. Leer issue en GitHub
2. Leer archivos afectados
3. Delegar a Dev Agent (subagent con todo el contexto)
4. Revisar output del Dev Agent
5. Delegar a QA Agent (verifica tests, build, lint)
6. Si pasa → commit, push, cerrar issue
7. Si falla → feedback al Dev Agent, iterar
8. Actualizar PROGRESS.md
```

---

## Fase 1 — Fundamentos

### Wave 1 (sin dependencias, se pueden hacer en paralelo)
| Issue | Status | Fecha | Notas |
|---|---|---|---|
| #2 F1-01: process-engine | **DONE** | 2026-04-02 | L, extract BPMN lib shared package ✓ |
| #3 F1-02: Limpiar módulos muertos | **DONE** | 2026-04-02 | S, quick win ✓ |
| #4 F1-03: Renombrar Simulations | **DONE** | 2026-04-02 | M ✓ Rename completado: dirs, files, imports, routes, nav, i18n (en/es/de/fr), marketing. Prisma schema intacto (compat DB). `tsc --noEmit` pasa limpio. |
| #7 F1-05: PlanLimits | **DONE** | 2026-04-02 | M ✓ PlanLimits: evaluations/evaluators/processes/sessions/reports/adminUsers. 3 planes (Starter $49, Growth $199, Scale $499). 10 tests pass. FR/DE pricing rewritten. UsageDashboard → evaluations. `tsc --noEmit` limpio. |

### Wave 2 (dependen de Wave 1)
| Issue | Depende de | Status | Fecha |
|---|---|---|---|
| #6 F1-04: Fusionar Procedures+Riesgos | #2 | **DONE** | 2026-04-02 | M ✓ 8 proc + 15 risk components → process-library. Old modules deleted. NavBar: scan(1)→proc(2)→eval(3)→pan(4). `tsc --noEmit` limpio. |
| #8 F1-06: Onboarding wizard | #7 | **DONE** | 2026-04-02 | L ✓ 4-step wizard: Account → Company (industry, size, eval target) → First Value (3 action cards) → Setup Complete. react-hook-form + zod. Translations: en, es, fr, de. `pnpm build` passes. |
| #10 F1-08: Fusionar evaluation | #4 | **DONE** | 2026-04-02 | M ✓ Merged /evaluation dashboard into /evaluaciones with tab switcher (Catalog | Risk Dashboard). /evaluation redirects to /evaluaciones?tab=dashboard. `pnpm build` passes. |
| #12 F1-10: UsageDashboard | #7 | **DONE** | 2026-04-02 | M ✓ UsageDashboard shows 5 metrics (evaluations, evaluators, processes, sessions, reports) grouped by category. New API /api/organizations/[orgId]/usage. Server helper packages/payments/lib/usage.ts. `pnpm build` passes. |

### Wave 3 (dependen de Wave 2)
| Issue | Depende de | Status | Fecha |
|---|---|---|---|
| #11 F1-09: Absorber deliverables | #4, #6 | **DONE** | 2026-04-02 | S ✓ All /deliverables/* routes redirect to /processes. Sub-pages (risks, raci, process-cards, process-map, horizontal-view) redirected. API routes kept for backward compat. |
| #9 F1-07: Refactorizar NavBar | #3, #4, #6 | **DONE** | 2026-04-02 | M ✓ Sidebar: 4 items only (Descubrir→Procesos→Evaluaciones→Panorama). Removed sessions, evaluation, deliverables, documents. MobileBottomBar matches. `pnpm build` passes. |

### Wave 4 (último, sincroniza todo)
| Issue | Depende de | Status | Fecha |
|---|---|---|---|
| #13 F1-11: Actualizar translations | #4, #7, #9 | **DONE** | 2026-04-02 | S ✓ Removed stale sessionsIncluded/extraSession keys from en/es/fr/de. All pricing refs evaluations as value unit. |

---

## QA Status

**Último ciclo:** 2026-04-02 Cycle 2 — QA Agent #05
**Bug fix cycle:** 2026-04-02 — PM Agent #03

### Tests (Cycle 2)
- ✅ 55/55 tests pass (+7 new BpmnBuildOptions tests added by QA)
- ✅ SaaS build passes, Marketing build passes
- ❌ TypeScript: 2 errors (BUG-022, BUG-023) — pre-existing from Cycle 1 fixes

### Bugs Found — Cycle 2 (4 new)
| # | Severity | Component | Summary | Status |
|---|----------|-----------|---------|--------|
| BUG-022 | 🟠 High | `api/organization/profile/route.ts:66` | TS error: `name: null` incompatible with Prisma `String` | ✅ FIXED (2026-04-03) |
| BUG-023 | 🟠 High | `modules/auth/components/LoginForm.tsx:77` | TS error: `mode: "***"` not in Zod schema (should be `"magic-link"`) | ✅ FIXED (2026-04-03) |
| BUG-024 | 🟡 Medium | `modules/radiografia/lib/sipoc-to-nodes.ts:27,82` | Hardcoded Spanish `"Inicio"`/`"Fin"` fallbacks in scan/BPMN pipeline | 🔴 OPEN |
| BUG-025 | 🟢 Low | `meeting/lib/node-display-config.ts` + `NodeContextPanel.tsx` | Hardcoded Spanish labels in BPMN node workspace UI | 🔴 OPEN |

### Bugs from Cycle 1 (21 total) → 21 FIXED ✅
| Severity | Total | Fixed | Key Issues |
|----------|-------|-------|------------|
| 🔴 Critical | 3 | ✅ 3/3 | BUG-001 auth bypass FIXED, BUG-002 wrong org FIXED, BUG-003 forgot-password FIXED |
| 🟠 High | 6 | ✅ 6/6 | BUG-004 dup prop FIXED, BUG-005 JSON.parse FIXED, BUG-006 SessionProvider FIXED, BUG-007 input validation FIXED, BUG-008 wrong route FIXED, BUG-009 .min(1) FIXED |
| 🟡 Medium | 8 | ✅ 8/8 | BUG-010 i18n FIXED, BUG-011 companyName FIXED, BUG-012 BPMN labels FIXED, BUG-013 parallel queries FIXED, BUG-014 N/A (page removed), BUG-015 response validation FIXED, BUG-016 remember me FIXED, BUG-017 Prisma type FIXED |
| 🟢 Low | 4 | ✅ 4/4 | BUG-018 ARIA tabs FIXED, BUG-019 step bounds FIXED, BUG-020 indentation FIXED, BUG-021 silent catch FIXED |

### Code Quality Score: 85/100 → 88/100
- **✅ 21/21 Cycle 1 bugs RESOLVED** — No regressions found
- **🆕 4 new bugs found** — 0 Critical, 2 High (TypeScript), 1 Medium, 1 Low
- **✅ Phase 2 still unblocked** — No new blocking bugs (TS errors don't break build)
- **✅ 7 new tests added** — BpmnBuildOptions coverage

### QA Reports
- `docs/issues/qa/qa-2026-04-02-cycle-1.md` — Cycle 1 report
- `docs/issues/qa/qa-2026-04-02-cycle-2.md` — Cycle 2 report (current)
- `docs/issues/qa/BUG-001.md` through `BUG-025.md` — Individual bug reports

### Bug Fix Details (2026-04-02 PM Cycle)
| Bug | Fix Applied |
|-----|------------|
| BUG-001 | `verifyOrganizationMembership` now throws `OrganizationAccessDeniedError` instead of returning null |
| BUG-002 | `getOrgId()` uses `session.session.activeOrganizationId` first, falls back to first org |
| BUG-003 | Created `/forgot-password/page.tsx` directly under `(unauthenticated)/` (was buried in `(standard)/` route group) |
| BUG-004 | Removed duplicate `organizationSlug` prop on EvaluacionesTabs |
| BUG-005 | Wrapped all `JSON.parse` calls in scan/save in try-catch with null fallback |
| BUG-006 | SessionProvider `loaded` state now sets true regardless of auth status |
| BUG-007 | Added Zod schema validation on PUT `/api/organization/profile` |
| BUG-008 | Onboarding completion link uses dynamic org slug prefix |
| BUG-009 | Added `.min(1)` to name field validation in onboarding |
| BUG-021 | Silent `.catch(() => {})` replaced with `console.error` logging |

### Bug Fix Details (2026-04-02 Dev #04 Cycle — Medium + Low)
| Bug | Fix Applied |
|-----|------------|
| BUG-010 | Onboarding company step: 20+ hardcoded strings replaced with i18n keys (industries, sizes, targets) for en/es/fr/de |
| BUG-011 | `companyName` now included in PUT /api/organization/profile request body |
| BUG-012 | BPMN builder "Inicio"/"Fin" replaced with "Start"/"End" (language-neutral) |
| BUG-013 | Sequential DB queries in usage.ts parallelized with Promise.all (2x perf improvement) |
| BUG-014 | N/A — deliverables page was already removed in Phase 1 (#11) |
| BUG-015 | UsageDashboard validates API response shape before setting state, logs errors |
| BUG-016 | "Remember me" checkbox connected to form state + passed to authClient.signIn.email |
| BUG-017 | Prisma client _ext type fixed: use InstanceType<typeof PrismaClient> |
| BUG-018 | EvaluacionesTabs: added ARIA tablist/tab/tabpanel pattern with aria-selected |
| BUG-019 | OnboardingForm step clamped to 1–4 range, prevents blank rendering |
| BUG-020 | NavBar indentation corruption from merge refactoring fixed |

### QA Reports
- `docs/issues/qa/qa-2026-04-02-cycle-1.md` — Full report
- `docs/issues/qa/BUG-001.md` through `BUG-009.md` — Individual bug reports (Critical + High)

---

## Fase 2 — Producto que se Vende
| Issue | Status | Fecha | Notas |
|---|---|---|---|
| #15 F2-02: Generación automática de escenarios | **DONE** ✅ | 2026-04-02 | GenerateEvaluationDialog (239 lines) wired into ProcessDetailView. Role selector (9 roles), risk picker (top 5 auto-selected), POSTs to /api/evaluaciones/generate. |
| #14 F2-01: Scan free tier rebuild | **DONE** ✅ | 2026-04-02 | Theatrical progressive reveal (staggered 200ms-1800ms), shareable links (7-day tokens via /api/public/scan/share), CTA registration form for anonymous users, SharedScanResults page. Schema: shareToken + shareExpiresAt on AnonymousSession. |
| #41 F2-03: Panorama dashboard evaluaciones | **DONE** ✅ | 2026-04-03 | 4 KPI cards (org score, evaluations completed, members evaluated, completion rate), dimension progress bars (alignment, control, criterio), score trend sparkline. Data fetched server-side in parallel. |
| #17 F2-04: Before/after metrics | **DONE** ✅ | 2026-04-03 | ProgressDashboard (409 lines) with DeltaBadge, per-process & per-member improvement tracking, DimensionTrendChart. Wired into EvaluacionesTabs as "Progress" tab. First vs latest score comparison with delta indicators. |
|| #18 F2-05: Reportes exportables | **DONE** ✅ | 2026-04-03 | Enhanced human-risk-report-generator (834 lines) with executive insights, inline SVG score trend charts, progress/improvement section, training recommendations. API route `/api/evaluation/export-report` serves branded HTML report. Session review export (303 lines) at `/api/sessions/[id]/export/review`. |
|| #16 F2-03: Dashboard riesgo humano | **DONE** ✅ | 2026-04-03 | HumanRiskDashboard (7 sub-components, ~1,260 LOC): TeamTable (per-person), ProcessHeatmap (per-process), ErrorPatternsCard, ScoreTrendChart, KpiRow, HeroScoreCard, ScoreDistributionChart. Export via human-risk-report-generator.ts. |

### Vision Gaps (Resolved)
|| #42 Eval→Process feedback loop | **DONE** ✅ | 2026-04-03 | EvalFeedbackOverlay (failure badges on BPMN nodes), EvalFeedbackTab (sidebar), NodeContextPanel (per-node feedback). Backend: fetchProcessEvalFeedback() aggregates runs→steps. Closed via PM Agent #03. |
|| #43 Scan theatrical reveal | **DONE** ✅ | 2026-04-02 | Progressive reveal, shareable links, CTA. |

### Crossover Items (Phase 2→3)
|| #46 Panorama eval KPIs | **CLOSED** ✅ | 2026-04-03 | Already done via #41 — RiskDashboard (actual panorama page) has eval KPIs. ClientDashboard is orphaned code. |

## Fase 3 — Crecimiento

**Directive:** `docs/issues/PM-DIRECTIVE-PHASE3.md`
**Execution order:** #20 → #19 → #22 → #23 → #21

| Priority | Issue | Feature | Status | Fecha | Notas |
|----------|-------|---------|--------|-------|-------|
| 1 | #20 | F3-02: Notificaciones y gestión del cambio | **DONE** ✅ | 2026-04-03 | Full notification infra: 4 Prisma models (Notification, ChangeConfirmation, ChangeConfirmationResponse, NotificationPreference) + 4 enums. API: notifications module (list, countUnread, markRead, markAllRead, archive, preferences) + change-management module (create, listPending, confirm, getStatus). Frontend: NotificationBell (sidebar badge + dropdown, 30s polling), NotificationItem, NotificationDropdown, ChangeConfirmationCard, ChangeStatusTracker, PendingChangesPanel. Hooks: useUnreadCount, useNotifications, usePendingChanges. Integrated into NavBar bottom section. 28 files, 1741 LOC. |
| 2 | #19 | F3-01: Colaboración multi-usuario | **UP NEXT** 🔵 | — | Presence, edit locking, comments/mentions, activity log. Depends on #20 ✅. |
| 3 | #22 | F3-04: Onboarding basado en evaluaciones | PENDING | — | OnboardingPlan model, manager assigns processes, employee evaluation flows. |
| 4 | #23 | F3-05: Programa de certificación | PENDING | — | Certification/CertificationGrant models, auto-certify after evals, expiry/renewal. |
|| 5 | #21 | F3-03: Integraciones (Slack/Teams/GWS) | PENDING | — | Webhook notifications, OAuth, channel mapping. Last — depends on #20 infra. |

---

## Module Perfection Passes (QA → Dev Specs)

**PM Agent #03 audits each module. Dev Agent #04 executes fixes.**

| # | Module | Spec File | Status | Date | Key Findings |
|---|--------|-----------|--------|------|-------------|
| 1 | PANORAMA | `MODULE-PERFECTION-PANORAMA.md` | ✅ BATCH 1-3 DONE | 2026-04-03 | 14 fixes spec'd. **P1 DONE:** Fix#1 dead links→processes/evaluaciones, Fix#2 dark mode colors, Fix#3 i18n dates. **P2 DONE:** Fix#7 maturity calc (25%docs+25%risk+50%evals). **P3 DONE:** Fix#8 CTA→Crear Evaluación, Fix#9 glassmorphism cards, Fix#11 touch targets 44px, Fix#12 font min 11px, Fix#13 RiskMaturityRing semantic colors. **REMAINING:** Fix#4 vulnerable processes, Fix#5 next steps AI, Fix#6 score hero, Fix#10 activity feed, Fix#14 sidebar Descubrir. |
| 2 | PROCESOS | — | 🔵 UP NEXT | — | — |
| 3 | EVALUACIONES | — | PENDING | — | — |
| 4 | DESCUBRIR | — | PENDING | — | — |
| 5 | SCAN | — | PENDING | — | — |
| 6 | SETTINGS | — | PENDING | — | — |
| 7 | ONBOARDING | — | PENDING | — | — |
| 8 | AUTH PAGES | — | PENDING | — | — |
