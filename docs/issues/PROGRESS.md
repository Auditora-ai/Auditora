# Auditora.ai — Progreso de Ejecución

**Última actualización:** 2026-04-02
**PM:** Hermes Agent
**Estado:** Fase 1 — Iniciando

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
| #7 F1-05: PlanLimits | PENDING | — | M |

### Wave 2 (dependen de Wave 1)
| Issue | Depende de | Status | Fecha |
|---|---|---|---|
| #6 F1-04: Fusionar Procedures+Riesgos | #2 | PENDING | — |
| #8 F1-06: Onboarding wizard | #7 | PENDING | — |
| #10 F1-08: Fusionar evaluation | #4 | PENDING | — |
| #12 F1-10: UsageDashboard | #7 | PENDING | — |

### Wave 3 (dependen de Wave 2)
| Issue | Depende de | Status | Fecha |
|---|---|---|---|
| #11 F1-09: Absorber deliverables | #4, #6 | PENDING | — |
| #9 F1-07: Refactorizar NavBar | #3, #4, #6 | PENDING | — |

### Wave 4 (último, sincroniza todo)
| Issue | Depende de | Status | Fecha |
|---|---|---|---|
| #13 F1-11: Actualizar translations | #4, #7, #9 | PENDING | — |

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
