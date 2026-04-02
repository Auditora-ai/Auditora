# Issues Tracker — Auditora.ai Fase 1

Generado: 2026-04-02
Fuente de verdad: `docs/PRODUCT_VISION.md`

## Instrucciones
Cada issue está listo para copiar a GitHub. Los archivos `.md` están en `docs/issues/`.

Para crear todos los issues en GitHub con un PAT:
```bash
export GH_TOKEN="tu_token_aqui"
for f in docs/issues/F1-*.md; do
  title=$(head -1 "$f" | sed 's/^# //')
  body=$(tail -n +3 "$f")
  gh issue create --title "$title" --label "phase-1" --body "$body"
done
```

## Issues Fase 1 (orden de ejecución)

| # | Issue | Dependencias | Estimado |
|---|---|---|---|
| F1-01 | Extraer diagramador BPMN como lib compartida | Ninguna | L |
| F1-02 | Limpiar módulos muertos | Ninguna | S |
| F1-03 | Renombrar Simulations → Evaluaciones | Ninguna | M |
| F1-04 | Fusionar Procedimientos y Riesgos en Process Library | F1-01 | L |
| F1-05 | Rediseñar PlanLimits y planes de negocio | Ninguna | M |
| F1-06 | Rediseñar onboarding (4 steps wizard) | F1-05 | L |
| F1-07 | Refactorizar NavBar al nuevo sidebar (4 secciones) | F1-02, F1-03, F1-04 | L |
| F1-08 | Fusionar evaluation page en módulo Evaluaciones | F1-03 | M |
| F1-09 | Absorber deliverables en Procesos y Evaluaciones | F1-04, F1-03 | M |
| F1-10 | Refactorizar UsageDashboard para nuevas métricas | F1-05 | S |
| F1-11 | Actualizar translations (pricing + sidebar) | F1-03, F1-05, F1-07 | M |

## Issues Fase 2 (pendiente detalle)

| # | Issue |
|---|---|
| F2-01 | Scan free tier rebuild (público, sin registro, theatrical reveal) |
| F2-02 | Generación automática de escenarios desde procedimientos |
| F2-03 | Dashboard de riesgo humano por persona y por proceso |
| F2-04 | Before/after metrics (alineación procedimental) |
| F2-05 | Reportes exportables para junta directiva |

## Issues Fase 3 (pendiente detalle)

| # | Issue |
|---|---|
| F3-01 | Colaboración multi-usuario en procesos |
| F3-02 | Notificaciones y gestión del cambio |
| F3-03 | Integraciones (Slack, Teams, Google Workspace) |
| F3-04 | Módulo de onboarding basado en evaluaciones |
| F3-05 | Programa de certificación |
