# Plan de Refactorización: Alinear Código Existente con Product Vision v3

**Fecha:** 2026-04-05
**Status:** PENDIENTE APROBACIÓN
**Principio:** NO crear módulos mock. Refactorizar lo existente para que cumpla la visión.

---

## Estado Actual (Post-Limpieza)

Los módulos mock (home, discovery, capture, process, evaluate, panorama) fueron eliminados correctamente. Lo que queda son módulos REALES con API/DB integration:

| Módulo Actual | Archivos | API Calls | Función Real |
|---|---|---|---|
| **meeting/** | 39 | 18 files c/fetch | Diagrammer BPMN, SIPOC chat, transcript, sesiones en vivo |
| **process-library/** | 61 | 25 files c/fetch | Workspace de proceso: BPMN editor, RACI, riesgos, SOP, versiones |
| **evaluaciones/** | 20 | 4 files c/fetch + 2 DB | Hub evaluaciones, runner Harvard-case, resultados, dashboard riesgo humano |
| **ai-interview/** | 7 | 3 files c/fetch | Entrevista SIPOC por IA, chat con topics |
| **command-center/** | 20 | 10 files c/fetch | RiskDashboard, wizard sesiones, agenda, stats |
| **collaboration/** | 13 | 4 files c/fetch | Comentarios, presencia, locks de edición |
| **scan/** | 11 | 5 files c/fetch | Scan público URL, análisis, Turnstile |
| **notifications/** | 6 | 2 files c/fetch | Contador no leídos, campana |
| **shared/** | 42 | 5 files c/fetch | NavBar, MobileBottomBar, CommandPalette, etc. |

### Rutas Actuales (las que funcionan)

```
/[orgSlug]/                         → RiskDashboard (HOME actual)
/[orgSlug]/descubrir/               → Lista de sesiones discovery
/[orgSlug]/descubrir/new            → Wizard nueva sesión
/[orgSlug]/descubrir/interview/*    → Entrevista SIPOC
/[orgSlug]/descubrir/scan/          → Scan URL
/[orgSlug]/procesos/                → Lista de procesos
/[orgSlug]/procesos/[id]            → Workspace del proceso
/[orgSlug]/processes/[id]           → Workspace (duplicado inglés)
/[orgSlug]/procedures/[id]          → Detalle procedimiento
/[orgSlug]/evaluaciones/            → Hub evaluaciones
/[orgSlug]/evaluaciones/[id]        → Evaluación específica
/[orgSlug]/evaluaciones/[id]/run/*  → Runner del escenario
/[orgSlug]/panorama                 → Dashboard ejecutivo
/[orgSlug]/deliverables/*           → Vistas de entregables
/[orgSlug]/risks/                   → Vista de riesgos
/[orgSlug]/sessions/*               → Sesiones en vivo
```

---

## Visión de Producto v3 — Mapa de Rutas Objetivo

```
/[orgSlug]/                         → HOME: Mapa de procesos con madurez
/[orgSlug]/discovery                → Discovery organizacional
/[orgSlug]/capture/new              → Nuevo proceso + selector de método
/[orgSlug]/capture/[processId]      → Entrevista SIPOC
/[orgSlug]/process/[processId]      → Documento vivo (Flujo|SOP|FMEA|RACI|Historial)
/[orgSlug]/evaluate/[processId]     → Lanzar + resultados evaluación
/[orgSlug]/panorama                 → Dashboard ejecutivo
/intake/evaluacion/[token]          → Tomar evaluación (público)
/scan                               → Scan público (marketing funnel)
```

---

## Arquitectura: MOBILE es un componente, WEB es otro

Cada pantalla tiene 2 variantes que comparten la misma lógica de datos:

```
modules/[feature]/
├── components/
│   ├── [Feature]Mobile.tsx       ← Componente mobile-first (< md)
│   ├── [Feature]Desktop.tsx      ← Componente desktop (≥ md)
│   └── [Feature]Page.tsx         ← Orchestrator: detecta breakpoint, renderiza el correcto
├── hooks/
│   └── use-[feature]-data.ts     ← Hook compartido de datos (oRPC/fetch)
├── lib/
│   └── types.ts                  ← Interfaces TypeScript compartidas
└── index.ts
```

Regla: `[Feature]Page.tsx` es un client component que usa `useIsMobile()` y renderiza el componente correcto. La data se pasa como props desde el hook compartido.

---

## Plan de Ejecución — 6 Módulos

### MÓDULO 1: HOME — Mapa de Procesos con Madurez

**Fuente de datos:** `command-center/RiskDashboard` + `process-library/` queries
**Lo que ya existe:** RiskDashboard con stats reales, ProcessCard con fetch real

**Mobile (HomeMobile.tsx):**
- Header: nombre org + badge industria (desde OrgContext)
- Summary card: "12 procesos · 5 documentados · 3 evaluados"
- Lista agrupada por categoría (Estratégicos/Operativos/Soporte) usando `Accordion` de shadcn
- Cada proceso: `Card` con nombre, `Badge` de estado (DRAFT/CAPTURED/DOCUMENTED/EVALUATED), barra de alineación, indicador de riesgos
- FAB "+" flotante → navega a /capture/new (posición: bottom-20 para no chocar con bottom bar)
- Tap en proceso → navega según estado

**Desktop (HomeDesktop.tsx):**
- Layout 2 columnas: izquierda mapa de procesos con filtros, derecha panel de resumen/stats
- Mismos datos pero con `Table` component para lista y `Card` grid para resumen
- Quick actions en cada fila: "Evaluar", "Documentar", "Ver proceso"

**Componentes shadcn:** Card, Badge, Button, Accordion, Progress, Skeleton, Table (desktop)

**Backend:** Reutiliza queries existentes de `command-center/RiskDashboard` + agrega grupo por categoría

---

### MÓDULO 2: DISCOVERY — Discovery Organizacional

**Fuente de datos:** `ai-interview/` + `command-center/wizard/ProcessDiscoveryChat`
**Lo que ya existe:** InterviewChat con streaming IA real, ProcessDiscoveryChat con preguntas contextuales

**Mobile (DiscoveryMobile.tsx):**
- Chat fullscreen, input bottom-anchored con safe-area
- Mensajes IA como `Card` con contenido estructurado
- Progress indicator: "Entendiendo tu negocio... 5/8 preguntas" usando `Progress` bar
- Al completar: transición a ArchitectureReview
- Architecture cards: `Card` swipeable con badges de categoría
- Botón sticky "Confirmar arquitectura"

**Desktop (DiscoveryDesktop.tsx):**
- Split view: chat izquierda (60%), preview de arquitectura derecha (40%)
- Arquitectura se va construyendo en tiempo real en el panel derecho
- Cards de procesos sugeridos con drag-and-drop para reordenar prioridad
- Value Chain visualization (Porter) como diagrama horizontal

**Componentes shadcn:** Card, Badge, Button, Input, Textarea, Progress, ScrollArea, Tabs

**Backend:** Reutiliza `ai-interview/hooks/useInterviewChat` + API existente de discovery threads. Agrega procedure para generar arquitectura con IA.

---

### MÓDULO 3: CAPTURE — Elicitation SIPOC

**Fuente de datos:** `ai-interview/` (entrevista SIPOC real) + `meeting/` (sesión en vivo)
**Lo que ya existe:** AIInterviewPage con chat SIPOC real, TopicChips con indicador S-I-P-O-C, MeetingView para sesiones

**Mobile (CaptureMobile.tsx):**
- Step 1: MethodSelector — 3 cards grandes (Chat/Documento/Sesión en vivo)
- Step 2 (chat): Chat fullscreen siguiendo SIPOC
  - Header: "Capturando: [nombre] · [categoría]"
  - SIPOC phase indicator (badges: S-I-P-O-C, activo resaltado)
  - Chat con streaming IA
  - Al completar: Card de resumen con conteo pasos/riesgos + CTA "Ver proceso"
- Step 2 (documento): Upload zone + preview procesamiento
- Step 2 (sesión): Wizard de meeting existente

**Desktop (CaptureDesktop.tsx):**
- Split: chat izquierda, preview de estructura SIPOC derecha
- El panel derecho muestra en tiempo real los suppliers/inputs/steps/outputs/customers que va capturando
- Al completar: sidebar cambia a preview completo del proceso

**Componentes shadcn:** Card, Badge, Button, Input, Textarea, Tabs, Dialog, Sheet

**Backend:** Reutiliza 100% el `useInterviewChat` hook y el API de `ai-interview/`. Para método "documento", reutiliza upload existente + nuevo endpoint de parsing.

---

### MÓDULO 4: PROCESS — Documento Vivo

**Fuente de datos:** `process-library/ProcessWorkspace` (el módulo más robusto, 61 archivos)
**Lo que ya existe:** BPMN editor, SOP editor, RACI tab, Risk tab, versiones, procedimientos

**Mobile (ProcessMobile.tsx):**
- Header: nombre proceso + `Badge` estado + score madurez
- Tabs horizontales (scroll): Flujo | Procedimiento | Riesgos | RACI | Historial
- **Flujo tab:** Cards verticales por paso (no BPMN visual — mobile friendly)
  - Cada card: número, nombre, quién ejecuta (Badge), duración, risk dot
  - Decision points como cards diamante con branches
- **Procedimiento tab:** SOP como secciones colapsables (`Accordion`)
  - Cada paso: instrucción, quién, inputs, outputs, warnings
  - Tap para editar inline
- **Riesgos tab:** Cards ordenadas por RPN
  - Cada card: descripción, paso afectado, S×F×D = RPN, color coded
- **RACI tab:** Cards por paso (no tabla)
  - R: [nombre], A: [nombre], C: [nombres], I: [nombres]
- **Historial tab:** Timeline vertical de versiones
- Bottom CTA: "Evaluar equipo en este proceso" (solo si DOCUMENTED)

**Desktop (ProcessDesktop.tsx):**
- Layout 3 columnas: sidebar izq (navegación pasos), centro (contenido), sidebar der (context/chat/comments)
- BPMN visual editor (DiagramEditor existente) en tab Flujo
- Tablas reales para RACI
- Split pane editor para SOP
- Panel de colaboración (comentarios, presencia) del módulo `collaboration/`

**Componentes shadcn:** Card, Badge, Button, Tabs, Accordion, Table (desktop), Dialog, Sheet, Progress, Skeleton

**Backend:** Reutiliza 100% de `process-library/` — es el módulo más completo. Agrega adapter para mobile view.

---

### MÓDULO 5: EVALUATE — Evaluaciones Harvard-Case

**Fuente de datos:** `evaluaciones/` (hub + runner + results + dashboard)
**Lo que ya existe:** EvaluacionHub, EvaluacionRunner (runner real), EvaluacionResults, HumanRiskDashboard con DB queries

**Mobile (EvaluateMobile.tsx):**
- 3 modos (tabs o navegación condicional):

**Modo LANZAR:**
- Summary Card: "[Proceso] · [N pasos] · [N riesgos críticos]"
- Selector de personas (`Avatar` + checkboxes)
- Cards de riesgos FMEA que serán base de escenarios
- Button "Generar y enviar evaluación"
- Progress: "3/8 personas han completado" (`Progress` bar)

**Modo TOMAR (ruta pública /intake/evaluacion/[token]):**
- Fullscreen immersive, un escenario por pantalla
- Context paragraph + "¿Qué haces?" + 3 options (buttons grandes min-h-[56px])
- Feedback post-selección con link al paso del SOP
- Score final con gaps específicos

**Modo RESULTADOS:**
- Por persona: score + gaps vinculados a pasos del proceso
- Por proceso: % alineación del equipo, pasos más débiles
- Drill-down: decisiones exactas vs respuesta correcta

**Desktop (EvaluateDesktop.tsx):**
- Dashboard con tabla de personas, filtros, comparativa
- Vista split: resultados globales izq, drill-down persona der
- Gráficos: trend de alineación, heatmap por proceso/paso

**Componentes shadcn:** Card, Badge, Button, Avatar, Progress, Table (desktop), Tabs, Dialog, Chart

**Backend:** Reutiliza 100% `evaluaciones/` — ya tiene queries DB reales, runner, score-utils.

---

### MÓDULO 6: PANORAMA — Dashboard Ejecutivo

**Fuente de datos:** `evaluaciones/dashboard/` + `command-center/RiskDashboard`
**Lo que ya existe:** HeroScoreCard, KpiRow, ProcessHeatmap, ScoreTrendChart, TeamTable, DimensionTrendChart, ScoreDistributionChart, ErrorPatternsCard

**Mobile (PanoramaMobile.tsx):**
- Score card principal: "Tu operación: 67% bajo control" con trend arrow
- Breakdown cards: documentación, evaluación, alineación
- Alertas (cards rojas): procesos vulnerables, personas en riesgo
- Acciones (cards azules): CTAs accionables con navegación
- Trend simple: sparkline últimas 4 evaluaciones

**Desktop (PanoramaDesktop.tsx):**
- Grid dashboard: score card + KPI row top
- Heatmap de procesos centro
- Charts de tendencia y distribución
- Tabla de equipo con scores
- Action items sidebar

**Componentes shadcn:** Card, Badge, Button, Progress, Chart, Table (desktop), Skeleton

**Backend:** Reutiliza queries de `evaluaciones/lib/dashboard-queries.ts` + RiskDashboard.

---

## Navegación Refactorizada

### MobileBottomBar (4 tabs + More)
```
1. HOME (/) — HomeIcon — "Inicio"
2. DESCUBRIR (/descubrir) — CompassIcon — "Descubrir"
3. EVALUACIONES (/evaluaciones) — GraduationCapIcon — "Evaluar"
4. PANORAMA (/panorama) — LayoutDashboardIcon — "Panorama"
5. MORE (sheet) — MoreHorizontalIcon — "Más"
```

### NavBar Desktop (sidebar)
```
FLUJO BPM (section header)
├── Inicio (/) — mapa de procesos
├── Descubrir (/descubrir) — discovery + captura
├── Procesos (/procesos) — biblioteca de procesos
├── Evaluaciones (/evaluaciones) — Harvard-case
├── Panorama (/panorama) — dashboard ejecutivo

CONFIGURACIÓN (section header)
├── Settings
├── Members
├── Billing
```

---

## Orden de Ejecución

### Round 1 (paralelo): HOME + PANORAMA
- Son los más simples (leen data, no escriben)
- HOME reutiliza RiskDashboard existente
- PANORAMA reutiliza dashboard-queries existente

### Round 2 (paralelo): PROCESS + EVALUATE
- Son los más complejos pero modulares
- PROCESS reutiliza process-library (el módulo más grande)
- EVALUATE reutiliza evaluaciones (ya tiene runner real)

### Round 3 (paralelo): DISCOVERY + CAPTURE
- Requieren las mayores adaptaciones al flujo de UX
- DISCOVERY refactoriza ai-interview + ProcessDiscoveryChat
- CAPTURE refactoriza ai-interview + meeting

### Round 4: NAVEGACIÓN + RUTAS + CLEANUP
- Actualizar MobileBottomBar + NavBar + CommandPalette
- Crear redirects de rutas viejas a nuevas
- Actualizar i18n keys
- Eliminar módulos zombie que ya fueron absorbidos
- Build final + deploy

---

## Reglas de Implementación

1. **NUNCA crear data mock** — todo se conecta a APIs/DB existentes
2. **Componentes solo de shadcn luma** — Card, Badge, Button, Tabs, Dialog, Sheet, Progress, Avatar, Skeleton, Table, Accordion, Chart, Input, Textarea, ScrollArea
3. **CSS solo semantic tokens** — bg-background, text-foreground, etc. NUNCA hardcodear hex
4. **Mobile-first** — el componente mobile es la prioridad, desktop lo extiende
5. **Touch targets ≥ 48px** — min-h-[48px] en todo lo interactivo
6. **TypeScript estricto** — interfaces para todo, no `any`
7. **Server Components por defecto** — `"use client"` solo donde haya interactividad
8. **Reutilizar hooks existentes** — no reinventar data fetching

---

## Checklist Pre-Build por Módulo

- [ ] ¿El módulo fuente existe y tiene API calls reales? (grep fetch/orpc)
- [ ] ¿Las interfaces TypeScript están definidas?
- [ ] ¿El hook de datos está identificado y funciona?
- [ ] ¿Los componentes shadcn necesarios están instalados?
- [ ] ¿Las rutas objetivo están definidas?
- [ ] ¿Los redirects de rutas viejas están planeados?
- [ ] ¿Las i18n keys existen?
