# Auditora.ai — Progreso de Ejecución

**Última actualización:** 2026-04-02 (PM Cycle — Bug Fix Sprint)
**PM:** Hermes Agent #03
**Estado:** Fase 1 COMPLETE ✅ — Fase 2 UNBLOCKED (all Critical+High bugs fixed)

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

**Último ciclo:** 2026-04-02 Cycle 1 — QA Agent #05
**Bug fix cycle:** 2026-04-02 — PM Agent #03

### Tests
- ✅ 48/48 tests pass (process-engine: bpmn-builder fixed 19 failures)
- ✅ SaaS build passes, Marketing build passes

### Bugs Found (21 total) → 10 FIXED
| Severity | Total | Fixed | Key Issues |
|----------|-------|-------|------------|
| 🔴 Critical | 3 | ✅ 3/3 | BUG-001 auth bypass FIXED, BUG-002 wrong org FIXED, BUG-003 forgot-password FIXED |
| 🟠 High | 6 | ✅ 6/6 | BUG-004 dup prop FIXED, BUG-005 JSON.parse FIXED, BUG-006 SessionProvider FIXED, BUG-007 input validation FIXED, BUG-008 wrong route FIXED, BUG-009 .min(1) FIXED |
| 🟡 Medium | 8 | 🔲 0/8 | Hardcoded strings (BUG-010, BUG-012), companyName not sent (BUG-011), sequential queries (BUG-013), redirect flash (BUG-014), no Zod on response (BUG-015), remember me (BUG-016), Prisma type (BUG-017) |
| 🟢 Low | 4 | ✅ 1/4 | BUG-021 silent catch FIXED. Remaining: ARIA tabs (BUG-018), blank step (BUG-019), indentation (BUG-020) |

### Code Quality Score: 68/100 → Estimated 78/100 after fixes
- **✅ Phase 2 UNBLOCKED:** All 3 Critical + 6 High bugs resolved
- **Remaining:** 8 Medium + 3 Low bugs (non-blocking)

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

### QA Reports
- `docs/issues/qa/qa-2026-04-02-cycle-1.md` — Full report
- `docs/issues/qa/BUG-001.md` through `BUG-009.md` — Individual bug reports (Critical + High)

---

## Fase 2 — Producto que se Vende (pendiente Fase 1)
| Issue | Status |
|---|---|
| #14 F2-01: Scan free tier rebuild | PENDING |
| #15 F2-02: Generación automática de escenarios | PENDING |
| #16 F2-03: Dashboard riesgo humano | PENDING |
| #17 F2-04: Before/after metrics | PENDING |
| #18 F2-05: Reportes exportables | PENDING |

## Fase 3 — Crecimiento (pendiente Fase 2)
| Issue | Status |
|---|---|
| #19 F3-01: Colaboración multi-usuario | PENDING |
| #20 F3-02: Notificaciones | PENDING |
| #21 F3-03: Integraciones | PENDING |
| #22 F3-04: Onboarding basado en evaluaciones | PENDING |
| #23 F3-05: Programa de certificación | PENDING |
