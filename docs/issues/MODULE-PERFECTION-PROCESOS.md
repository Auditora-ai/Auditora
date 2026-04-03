# Module Perfection Spec — PROCESOS (Process Library)

**Module:** Procesos (Process Library)
**Path:** `apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/processes/`
**Module code:** `apps/saas/modules/process-library/`
**Date:** 2026-04-03
**Author:** PM Agent #03
**Status:** 📝 SPEC READY — Awaiting Dev Agent #04

---

## Module Stats

- **Total source files:** ~60 (.tsx + .ts)
- **Total lines of code:** ~12,188
- **Component count:** ~55 components
- **Sub-systems:** Library listing, Workspace (BPMN editor), Procedures, Risks, Sidebar Tabs, Supporting components

---

## A) VISION CHECK

### What PRODUCT_VISION.md says Procesos should do:

> **Pilar 2: DOCUMENTAR — Donde viven los procesos**
> Each process has:
> - **Diagrama BPMN** — la versión técnica (para el consultor/analista) ✅ EXISTS
> - **Mapa visual** — la versión humana (para el CEO, el gerente, cualquier persona) ⚠️ MISSING (no simplified visual map)
> - **Procedimiento (SOP)** — generado por IA a partir del proceso, editable, versionado ✅ EXISTS
> - **RACI** — quién es responsable de cada paso ✅ EXISTS
> - **Riesgos** — no como módulo separado, como propiedad del proceso ✅ EXISTS
>
> "La documentación no es estática. Se enriquece con las evaluaciones: 'el 60% de los evaluados falló en este paso del proceso de compras — necesitamos revisar el procedimiento aquí.'" ✅ EXISTS (EvalFeedbackOverlay + EvalFeedbackTab)

### Vision Compliance Scorecard:

| Feature | Status | Notes |
|---------|--------|-------|
| BPMN Diagram | ✅ Full | DiagramCanvas with bpmn-js, modeler hooks, fullscreen, repair |
| Visual Map (human-readable) | ❌ Missing | No simplified visual map for non-technical users |
| Procedures (SOP) | ✅ Full | Complete workspace with editor, preview, version timeline, status flow |
| RACI Matrix | ✅ Full | RaciTab with CRUD, AI generation, cell editing |
| Risks as Process Property | ✅ Full | Rich risk subsystem: register, heat matrix, FMEA, trends, mitigations |
| Eval Feedback Integration | ✅ Full | EvalFeedbackOverlay on BPMN nodes + sidebar tab |
| Version History | ✅ Full | VersionDiff, VersionesTab |
| Export | ✅ Partial | ExportReportButton exists, but export-book route handler needed |
| Process Health Scoring | ✅ Full | ProcessHealthRing, ProcessPhaseDashboard |
| Consolidation | ✅ Full | Multi-session consolidation view |
| Context Chat | ✅ Full | AI-powered context enrichment |
| Gantt Planning | ✅ Full | ProjectGantt with auto-scheduling |
| Process Templates | ✅ Full | TemplatePicker with industry templates |
| Import BPMN | ✅ Full | ImportBpmnDialog with drag & drop |
| Generate Evaluation | ✅ Full | Dialog to generate evaluations from process |

**Overall Vision Compliance: ~90%** — Only missing the "Visual Map" (simplified human-readable view). Everything else exists and is feature-complete.

---

## B) DESKTOP AUDIT

### B1. Process Library Listing (`ProcessLibrary.tsx` — 239 lines)

**What exists:**
- Category tabs (Todos, Core, Estratégicos, Soporte) with counts
- Filter bar (search, status, level)
- Grid of ProcessCards (sm:2-col, lg:3-col)
- Action buttons: Import BPMN, Templates, Manual add
- Empty state with CTA
- "Add Process" card at end of grid

**Issues found:**
1. **Hardcoded Spanish category tabs** (lines 18-21): `"Todos"`, `"Core"`, `"Estratégicos"`, `"Soporte"` — NOT using translation keys
2. **Hardcoded action button labels**: `"Importar"`, `"Templates"`, `"Manual"`, `"Agregar manual"`, `"Agregar Proceso"`, `"Manual o con Discovery IA"` — not translated
3. **ProcessFilters hardcoded strings**: `"Draft"`, `"Mapped"`, `"Validated"`, `"Approved"`, `"Process"`, `"Subprocess"`, `"Task"` — not translated
4. **STATUS_MAP inconsistency**: `MAPPED` = `"warning"` in `types.ts` but `"info"` in `ProcessCard.tsx` `statusBadge` map

### B2. Process Card (`ProcessCard.tsx` — 142 lines)

**Issues found:**
1. **Touch target too small**: Dropdown trigger `h-7 w-7 p-0` = 28×28px (line 81) — below 44px mobile minimum
2. **Hardcoded colors**: `text-red-400` and `text-amber-400` (line 124) for risk indicators — won't adapt to themes
3. **Hardcoded Spanish**: `"riesgo"/"riesgos"` (line 127) — not translated

### B3. Process Workspace (`ProcessWorkspace.tsx` — 79 lines)

**What exists:**
- Split layout: DiagramCanvas (left) + ContextSidebar (right, collapsible)
- CollaborationProvider wrapper for real-time collaboration
- ProcessWorkspaceContext for state management

**Issues found:**
1. **Magic number height**: `h-[calc(100vh-64px)]` (line 42) — assumes fixed 64px nav height. Brittle.
2. **No mobile responsive sidebar**: Sidebar is fixed at `w-[380px]` with no breakpoint adaptation — **will overflow on mobile**
3. **Redundant class**: `mr-0` on line 52 is a no-op (default margin is 0)

### B4. Workspace Header (`WorkspaceHeader.tsx` — 296 lines)

**What exists:**
- Breadcrumb (hidden on mobile), inline-editable process name
- Category badge, MaturityFlow stepper, PresenceAvatars
- Export button, GenerateEvaluation dialog, more menu (share, delete)
- Sidebar toggle

**Issues found:**
1. **Multiple small touch targets**: Back button `h-8 w-8` (32px, line 163), more menu `h-8 w-8` (32px, line 256), sidebar toggle `h-8 w-8` (32px, line 283) — all below 44px
2. **Unused import**: `User` icon (line 19) imported but never used
3. **Hardcoded Spanish strings**: `"Link copiado"`, `"Eliminar proceso"`, `"Exportar"`, `"Deep Dive"`, `"Compartir"`, `"Eliminar"`, `"Mostrar panel"/"Ocultar panel"` — not translated
4. **Many features hidden on mobile**: Breadcrumb, category badge, MaturityFlow, PresenceAvatars, export button, eval dialog — all `hidden sm:*`. Mobile users see almost nothing.

### B5. Diagram Canvas (`DiagramCanvas.tsx` — 316 lines)

**What exists:**
- BPMN modeler/viewer with toolbar (undo, redo, zoom, fit, save, fullscreen)
- Empty state with "Create Diagram" CTA
- Repair banner with AI fix and regenerate options
- HealthBadgeOverlay (RACI indicators) and EvalFeedbackOverlay (failure rate badges)

**Issues found:**
1. **All toolbar buttons too small**: `h-7 w-7 p-0` = 28×28px (lines 209-232) — 5+ buttons all failing 44px touch target
2. **Hardcoded dark-mode-breaking colors**: `bg-amber-100 text-amber-800` (line 267), `bg-yellow-200 text-amber-900` (line 275) — light theme only
3. **Hardcoded `hover:bg-blue-600`** (line 282) — should use `hover:bg-primary/90`
4. **Possible typo**: `border-orientation` (line 267) — this is NOT a standard Tailwind class. Should be `border-orange-*` or a design token
5. **Unused imports**: `MessageSquareIcon`, `SparklesIcon` — never used
6. **No responsive breakpoints** — Zero `sm:`, `md:`, `lg:` classes. The entire canvas area has no mobile adaptations
7. **Hardcoded Spanish strings**: `"Crear Diagrama"`, `"↑ Subir"`, `"Ajustar"`, `"Reparando diagrama..."`, `"Regenerar"`, `"Arreglar con IA"`

### B6. Context Sidebar / Tabs (`ContextSidebar.tsx` — 114 lines + 7 tab files)

**What exists:**
8 tabs: Resumen, Contexto, RACI, Riesgos, Eval, Versiones, Sesiones, Actividad

**Issues found:**
1. **All tab labels hardcoded Spanish**: `"Resumen"`, `"Contexto"`, `"RACI"`, `"Riesgos"`, `"Eval"`, `"Versiones"`, `"Sesiones"`, `"Actividad"` — not translated
2. **Tab touch targets borderline**: `px-2.5 py-2 text-xs` — effective height ~28-30px
3. **No responsive breakpoints** in ContextSidebar or any tabs
4. **ContextoTab**: Tag remove button `p-0.5` (~18px) way too small; Plus button `h-7 w-7` (28px) too small; Unused imports (`Badge`, `ProcessChild`); Unused props (`processesPath`, `organizationSlug`)
5. **ResumenTab**: Unused imports (`Badge`, `FileTextIcon`, `CheckCircleIcon`); All strings hardcoded Spanish
6. **EvalFeedbackTab**: Inline `style={{}}` hex colors (`#DC2626`, `#EAB308`, `#16A34A`) in 6 places — breaks dark mode; ALL strings in English (inconsistent with rest of module)
7. **SessionesTab**: View/Play buttons `h-6 w-6 p-0` (24px) — severely too small for touch
8. **VersionesTab**: Version row height `py-1.5` (~28px) too small if made interactive

### B7. Procedures Subsystem (8 files, ~1,344 lines)

**What exists:**
- ProcedureWorkspace: Split editor/preview with view modes (split, editor, preview)
- ProcedureList: Filterable list with create dialog
- ProcedureDetail: Full detail view (possible legacy duplicate)
- ProcedurePreview: Document-style SOP preview
- ProcedureStatusBar: DRAFT → IN_REVIEW → APPROVED → PUBLISHED stepper
- ProcedureGenerateButton: AI generation with loading messages
- ProcedureVersionTimeline: Version history display
- CreateProcedureDialog: Create dialog with AI toggle

**Issues found:**
1. **`ProcedureDetail.tsx` appears to be a LEGACY DUPLICATE**: Uses `window.location.reload()`, has its own status handler, is never imported in routes — superseded by ProcedureWorkspace
2. **Type inconsistency**: `ProcedureStep.responsible` (Workspace/Preview) vs `ProcedureStep.responsibleRole` (Detail)
3. **`ProcedureStatus` type defined in 5 separate files** — should be shared in types.ts
4. **Hardcoded colors in ProcedureDetail**: `bg-blue-600 text-white` (status button, line 122), `border-blue-500` (active tab, line 139), `text-slate-500 hover:text-slate-300` (back link, line 100) — should use semantic tokens
5. **ProcedureStatusBar**: Zero responsive breakpoints — stepper will overflow on narrow screens
6. **ProcedurePreview**: Zero responsive breakpoints — `grid grid-cols-3` (meta) will be cramped on mobile
7. **Small touch targets**: ProcedureWorkspace ViewToggle `px-2.5 py-1` (~28px), History button `px-3 py-1.5` (~30px)
8. **Unused imports** across 3 files: `FilterIcon`, `ClipboardListIcon`, `ShieldAlertIcon`

### B8. Risks Subsystem (13 files)

**What exists:**
- Full risk management: RiskRegister, RiskHeatMatrix (SVG with keyboard navigation), RiskDetailSheet, RiskTrendChart
- FMEA analysis: FmeaView, OrgFmeaView
- Cross-process dashboard: CrossProcessRiskDashboard, OrgRisksDashboard with sidebar
- Stat cards: OrgRiskStatCards (responsive)
- Mitigation tracking: MitigationTracker, ControlMapping
- Opportunities: OpportunityRegister

**Issues found:**
1. **RiskHeatMatrix SVG uses 10+ hardcoded hex colors** that will NOT adapt to dark mode: `#DC2626`, `#D97706`, `#0EA5E9`, `#16A34A`, `#94A3B8`, `#3B8FE8`, `#334155`, `#F1F5F9`, `#475569`
2. **CrossProcessRiskDashboard**: `grid-cols-4` with NO responsive fallback — will be unusable on mobile
3. **Duplicated code**: `TYPE_LABELS`, `STATUS_LABELS`, `getScoreBadge()` function replicated in 4+ files — should be extracted to shared constants
4. **TASK_TYPES Set duplicated** in EvalFeedbackOverlay and HealthBadgeOverlay — extract to shared constant
5. **Consistent hardcoded color palette** across all risk files: `text-red-400`, `bg-red-600/20`, `text-amber-400`, `text-sky-400`, `text-green-400` — acceptable for risk severity semantics but should use design tokens
6. **FmeaView table rows**: `py-2.5` (~28-30px) — below 44px touch target for mobile

### B9. Supporting Components

**Issues found:**
1. **ProcessDetailView.tsx (1,499 lines) is DEAD CODE**: Never imported anywhere. Referenced only in a comment. Should be deleted.
2. **ProcessHealthRing**: 4 hardcoded SVG hex colors (`#16A34A`, `#D97706`, `#DC2626`, `#E2E8F0`) — no dark mode
3. **RaciTab**: RACI cell colors (`bg-emerald-100 text-emerald-800`, etc.) are light-mode-only — WILL look wrong in dark mode. RACI cells `h-7 w-7` (28px) too small for touch
4. **PhaseCard**: Progress bar colors (`bg-emerald-500`, `bg-amber-500`, `bg-red-500`) hardcoded — no dark variants. `variant="primary"` may not be valid Button variant
5. **AddProcessModal**: Raw `<div>` overlay — NO `role="dialog"`, no `aria-modal`, no focus trap, no Escape key handling. Close button `size-8` (32px) too small
6. **ProjectGantt**: Uses `toast` from `sonner` directly instead of `@repo/ui/components/toast`. 14+ hardcoded hex colors for Gantt tasks
7. **gantt-transformer.ts**: Duplicates `calculatePhaseCompleteness` logic from `ProcessPhaseDashboard`
8. **GenerateEvaluationDialog**: Checkbox `h-4 w-4` (16px) — way too small for touch. All strings hardcoded Spanish, no `useTranslations`
9. **ExportReportButton**: Unused `Download` import. Hardcoded English "Export Report"
10. **ImportBpmnDialog**: Drop zone has `onKeyDown` but no `role` or `tabIndex` — accessibility issue. All strings hardcoded English
11. **TemplatePicker**: Hardcoded `bg-amber-500/10 text-amber-600` for strategic category. All strings hardcoded English

### B10. Maturity Flow (`MaturityFlow.tsx` — 67 lines)

**Issues found:**
1. **Extremely small touch targets**: `px-2 py-0.5 text-[10px]` — approximately 20-24px tall — **SEVERELY FAILS touch target guidelines**
2. **Dark-mode-breaking color**: `bg-blue-100 text-blue-800` (past steps) — light mode only
3. **Mixed language**: Step labels in English ("Draft", "Mapped", "Validated", "Approved") but tooltips in Spanish ("Requiere diagrama BPMN", "Requiere RACI")

---

## C) MOBILE AUDIT

### Critical Mobile Issues (Priority Order):

| Issue | Severity | Components Affected |
|-------|----------|-------------------|
| **Sidebar overflows viewport** | 🔴 Critical | ProcessWorkspace — `w-[380px]` sidebar with no responsive collapse |
| **BPMN editor has zero mobile adaptations** | 🔴 Critical | DiagramCanvas — no responsive breakpoints at all |
| **Toolbar buttons too small (28px)** | 🔴 High | DiagramCanvas (5 buttons), WorkspaceHeader (3 buttons), ProcessCard, SessionesTab |
| **MaturityFlow steps nearly untouchable (20-24px)** | 🔴 High | MaturityFlow |
| **CrossProcessRiskDashboard 4-col grid on mobile** | 🟡 Medium | CrossProcessRiskDashboard — unusable on phone |
| **ProcedureStatusBar overflows** | 🟡 Medium | ProcedureStatusBar — 4-step stepper with no wrap/scroll |
| **ProcedurePreview 3-col meta grid** | 🟡 Medium | ProcedurePreview — `grid-cols-3` will be tiny on phone |
| **WorkspaceHeader hides 80% of features on mobile** | 🟡 Medium | Breadcrumb, badge, maturity, presence, export, eval — all `hidden sm:*` |
| **AddProcessModal no focus trap or Escape** | 🟡 Medium | AddProcessModal — accessibility issue on all devices |
| **Tag remove buttons 18px** | 🟡 Medium | ContextoTab — `p-0.5` makes tags unremovable on touch |
| **RACI cells 28px** | 🟡 Medium | RaciTab — `h-7 w-7` cells too small for touch editing |

### Responsive Breakpoint Coverage:

| Component | sm: | md: | lg: | Status |
|-----------|-----|-----|-----|--------|
| ProcessLibrary grid | ✅ | — | ✅ | OK |
| ProcessFilters | ✅ | — | — | OK |
| ProcessWorkspace | — | — | — | ❌ NONE |
| DiagramCanvas | — | — | — | ❌ NONE |
| ContextSidebar | — | — | — | ❌ NONE |
| WorkspaceHeader | ✅ | — | — | Partial |
| MaturityFlow | — | — | — | ❌ NONE |
| ProcedureWorkspace | — | — | ✅ | Partial |
| ProcedureList | ✅ | — | — | Partial |
| ProcedureDetail | — | — | — | ❌ NONE |
| ProcedurePreview | — | — | — | ❌ NONE |
| ProcedureStatusBar | — | — | — | ❌ NONE |
| Risk subsystem (all) | — | — | — | ❌ NONE (except OrgRiskStatCards) |
| ProjectGantt | — | — | — | ❌ NONE |
| RaciTab | — | — | — | ❌ NONE |

---

## D) QUALITY AUDIT

### Design System Consistency

| Criterion | Status | Details |
|-----------|--------|---------|
| Dark theme consistency | ❌ POOR | 40+ hardcoded colors across all subsystems that break in dark mode |
| Glassmorphism cards | ❌ Missing | No glassmorphism/blur effects anywhere in the module |
| Animations | ⚠️ Minimal | Only `animate-pulse` on loading states, `transition-colors` on hovers. No entrance/exit animations |
| Marketing site quality match | ⚠️ Partial | Functional but lacks the visual polish of the marketing landing |
| Typography consistency | ⚠️ Mixed | Some files use `font-display`, others don't. Inconsistent text sizing |
| Color semantic system | ⚠️ Mixed | Some files use chrome tokens (`text-chrome-text-secondary`), others use standard Tailwind semantic tokens (`text-muted-foreground`), others use raw colors (`text-red-400`) |

### Hardcoded Color Inventory (must fix for dark mode):

| Location | Colors | Impact |
|----------|--------|--------|
| ProcessHealthRing SVG | `#16A34A`, `#D97706`, `#DC2626`, `#E2E8F0` | Ring breaks in dark mode |
| RiskHeatMatrix SVG | 10+ hex values | Entire matrix breaks in dark mode |
| MaturityFlow | `bg-blue-100 text-blue-800` | Past steps invisible in dark |
| RaciTab | `bg-emerald-100/-800`, `bg-blue-100/-800`, `bg-amber-100/-800`, `bg-purple-100/-800` | RACI cells wrong colors in dark |
| DiagramCanvas | `bg-amber-100`, `bg-yellow-200`, `text-amber-800/900` | Repair banner breaks in dark |
| EvalFeedbackTab | Inline `#DC2626`, `#EAB308`, `#16A34A` in 6 places | Progress bars/text wrong in dark |
| NodeContextPanel | `bg-yellow-50 text-yellow-800`, `bg-green-50 text-green-800` | Info boxes break in dark |
| PhaseCard | `bg-emerald-500`, `bg-amber-500`, `bg-red-500` | Progress bars break in dark |
| ConsolidationView | `border-emerald-200`, `bg-emerald-50/50` | ✅ Has dark: variants |
| Risk subsystem (all) | `text-red-400`, `text-amber-400`, `text-sky-400`, `text-green-400` | Semantic risk colors — acceptable |
| ProcedureDetail | `bg-blue-600 text-white`, `border-blue-500`, `text-slate-500` | Should use primary token |
| gantt-transformer | 14 hex values for task colors | Gantt chart wrong colors in dark |

### i18n Inventory (untranslated strings):

- **Fully untranslated components**: AddProcessModal, GenerateEvaluationDialog, ExportReportButton, ImportBpmnDialog, TemplatePicker, ConsolidationView
- **Mixed translated**: ProcessLibrary, ProcessFilters, WorkspaceHeader, DiagramCanvas, ContextoTab, ResumenTab, RaciTab, VersionDiff, ProjectGantt, ContextChat
- **Wrong language**: EvalFeedbackTab uses ALL English strings while rest is Spanish
- **Estimated untranslated strings**: ~120+

---

## E) FIX LIST — Prioritized

### Batch 1: P1 — Critical Bugs & Breaking Issues

| # | Fix | File(s) | Effort | Description |
|---|-----|---------|--------|-------------|
| 1 | **Delete dead ProcessDetailView** | `components/ProcessDetailView.tsx` | S | 1,499 lines of dead code. Never imported. Delete entirely. |
| 2 | **Fix STATUS_MAP inconsistency** | `ProcessCard.tsx` line 44 | S | Change `MAPPED: "info"` → `MAPPED: "warning"` to match `types.ts` |
| 3 | **Fix `border-orientation` typo** | `DiagramCanvas.tsx` line 267 | S | Replace `border-orientation` with proper border class (e.g., `border-amber-200 dark:border-amber-800`) |
| 4 | **Fix AddProcessModal accessibility** | `AddProcessModal.tsx` | M | Replace raw `<div>` modal with Shadcn `Dialog` component. Adds focus trap, Escape handling, aria-modal, portal rendering. |
| 5 | **Fix ProcedureDetail `window.location.reload()`** | `ProcedureDetail.tsx` line 86 | S | Replace with `router.refresh()` for SPA-friendly navigation |
| 6 | **Fix ImportBpmnDialog accessibility** | `ImportBpmnDialog.tsx` | S | Add `role="button"` and `tabIndex={0}` to drop zone div |

### Batch 2: P2 — Mobile & Touch Target Fixes

| # | Fix | File(s) | Effort | Description |
|---|-----|---------|--------|-------------|
| 7 | **Mobile-responsive ProcessWorkspace** | `ProcessWorkspace.tsx` | L | On mobile (<768px): sidebar should be a Sheet/drawer that slides in from right, not a fixed-width column. Replace `w-[380px]` with `md:w-[380px]` and add mobile sheet. Replace `h-[calc(100vh-64px)]` with proper CSS var. |
| 8 | **DiagramCanvas toolbar mobile** | `DiagramCanvas.tsx` | M | Increase all toolbar buttons from `h-7 w-7` → `h-9 w-9 sm:h-7 sm:w-7`. Add horizontal scroll for toolbar on mobile. |
| 9 | **WorkspaceHeader touch targets** | `WorkspaceHeader.tsx` | M | Back button, more menu, sidebar toggle: all from `h-8 w-8` → `h-10 w-10 sm:h-8 sm:w-8`. Add mobile-specific actions menu. |
| 10 | **MaturityFlow touch targets** | `MaturityFlow.tsx` | M | Increase from `px-2 py-0.5 text-[10px]` → `px-3 py-1.5 text-xs sm:px-2 sm:py-0.5 sm:text-[10px]`. Minimum 36px height on mobile. |
| 11 | **ProcessCard dropdown touch target** | `ProcessCard.tsx` line 81 | S | Change `h-7 w-7 p-0` → `h-9 w-9 p-0 sm:h-7 sm:w-7` |
| 12 | **SessionesTab button targets** | `SessionesTab.tsx` | S | Change view/play buttons from `h-6 w-6 p-0` → `h-9 w-9 p-0 sm:h-6 sm:w-6` |
| 13 | **ContextoTab tag targets** | `ContextoTab.tsx` | S | Tag remove: `p-0.5` → `p-1 sm:p-0.5`. Plus button: `h-7 w-7` → `h-9 w-9 sm:h-7 sm:w-7` |
| 14 | **RaciTab cell targets** | `RaciTab.tsx` | S | RACI badge: `h-7 w-7` → `h-9 w-9 sm:h-7 sm:w-7` |
| 15 | **GenerateEvaluationDialog checkbox** | `GenerateEvaluationDialog.tsx` | S | Change `h-4 w-4` → `h-5 w-5` and wrap in larger clickable label area |
| 16 | **CrossProcessRiskDashboard responsive** | `CrossProcessRiskDashboard.tsx` | M | Change `grid-cols-4` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| 17 | **ProcedureStatusBar responsive** | `ProcedureStatusBar.tsx` | M | Add `flex-wrap` or horizontal scroll for mobile. Hide step labels on mobile, show icons only. |
| 18 | **ProcedurePreview responsive** | `ProcedurePreview.tsx` | M | Change meta `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`. Change I/O `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`. |

### Batch 3: P3 — Dark Mode & Color Fixes

| # | Fix | File(s) | Effort | Description |
|---|-----|---------|--------|-------------|
| 19 | **ProcessHealthRing dark mode** | `ProcessHealthRing.tsx` | S | Replace hardcoded hex colors with CSS variables. Use `var(--color-success)` / `var(--color-warning)` / `var(--color-destructive)` for strokes. Use `var(--color-muted)` for track. |
| 20 | **RiskHeatMatrix dark mode** | `RiskHeatMatrix.tsx` | M | Replace all 10+ hardcoded SVG hex colors with CSS variables. Cell backgrounds, text, strokes — all need dark variants. Consider using `currentColor` pattern with Tailwind `text-*` classes on parent. |
| 21 | **MaturityFlow dark mode** | `MaturityFlow.tsx` | S | Replace `bg-blue-100 text-blue-800` → `bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300` |
| 22 | **RaciTab RACI cell colors dark mode** | `RaciTab.tsx` | S | Add dark variants: `bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400` (and same for blue, amber, purple) |
| 23 | **DiagramCanvas repair banner dark mode** | `DiagramCanvas.tsx` | S | Replace `bg-amber-100 text-amber-800` → `bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`. Fix `bg-yellow-200 text-amber-900` similarly. Replace `hover:bg-blue-600` → `hover:bg-primary/90`. |
| 24 | **EvalFeedbackTab inline colors** | `EvalFeedbackTab.tsx` | M | Replace 6 inline `style={{color: "#DC2626"}}` with Tailwind classes that support dark mode: `text-red-600 dark:text-red-400`. Same for `#EAB308` → `text-yellow-600 dark:text-yellow-400` and `#16A34A` → `text-green-600 dark:text-green-400`. |
| 25 | **NodeContextPanel info boxes dark mode** | `NodeContextPanel.tsx` | S | Replace `bg-yellow-50 text-yellow-800` → `bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300`. Same for `bg-green-50 text-green-800`. Replace inline `style` hex colors with Tailwind classes. |
| 26 | **PhaseCard progress bar dark mode** | `PhaseCard.tsx` | S | Colors `bg-emerald-500`, `bg-amber-500`, `bg-red-500` are semantically fine for both themes — keep as is. But add `text-emerald-600 dark:text-emerald-400` for the percentage text. |
| 27 | **ProcedureDetail hardcoded colors** | `ProcedureDetail.tsx` | S | Replace `bg-blue-600 text-white` → `bg-primary text-primary-foreground`. Replace `border-blue-500` → `border-primary`. Replace `text-slate-500 hover:text-slate-300` → `text-muted-foreground hover:text-foreground`. |
| 28 | **ProcessCard hardcoded risk colors** | `ProcessCard.tsx` | S | Replace `text-red-400`/`text-amber-400` → `text-destructive`/`text-warning` or keep with dark variants |
| 29 | **Gantt chart colors** | `gantt-transformer.ts`, `ProjectGantt.tsx` | M | Create CSS variables for Gantt phase colors. Apply in both JS config and Tailwind classes. |

### Batch 4: P4 — Code Quality & Dedup

| # | Fix | File(s) | Effort | Description |
|---|-----|---------|--------|-------------|
| 30 | **Extract shared risk constants** | Multiple risk files | M | Create `process-library/lib/risk-constants.ts` with shared `TYPE_LABELS`, `STATUS_LABELS`, `getScoreBadge()`, `SEVERITY_LABELS`, `PROBABILITY_LABELS`. Import in all risk components instead of duplicating. |
| 31 | **Extract shared TASK_TYPES constant** | `EvalFeedbackOverlay.tsx`, `HealthBadgeOverlay.tsx` | S | Move `TASK_TYPES` Set to `process-library/lib/bpmn-constants.ts` and import from both overlays |
| 32 | **Extract shared ProcedureStatus type** | 5 procedure files | S | Move `ProcedureStatus` type to `process-library/types.ts` and import from all procedure components |
| 33 | **Remove unused imports** | Multiple files | S | Remove unused icons/types across ~8 files: `User` (WorkspaceHeader), `MessageSquareIcon`/`SparklesIcon` (DiagramCanvas), `BoxIcon`/`GitBranchIcon`/`CircleIcon`/`ArrowRightIcon` (NodeContextPanel), `FilterIcon` (ProcedureList), `ClipboardListIcon` (ProcedureDetail), `ShieldAlertIcon` (ProcedurePreview), `Download` (ExportReportButton), `Badge`/`FileTextIcon`/`CheckCircleIcon` (ResumenTab), `Badge`/`ProcessChild` (ContextoTab) |
| 34 | **Remove unused props** | `ContextoTab.tsx` | S | Remove `organizationSlug` and `processesPath` from ContextoTabProps — they are never used |
| 35 | **Fix inconsistent toast import** | `ProjectGantt.tsx` | S | Replace `import { toast } from "sonner"` → `import { toastSuccess, toastError } from "@repo/ui/components/toast"` |
| 36 | **Delete or archive ProcedureDetail.tsx** | `procedures/ProcedureDetail.tsx` | S | Appears to be legacy — superseded by ProcedureWorkspace. Verify not used anywhere, then delete. Also remove from `procedures/index.ts` export. |

### Batch 5: P5 — i18n (Lower Priority)

| # | Fix | File(s) | Effort | Description |
|---|-----|---------|--------|-------------|
| 37 | **Add translations to ProcessLibrary** | `ProcessLibrary.tsx` | M | Move category tab labels to translation keys. Move action button labels to translation keys. |
| 38 | **Add translations to AddProcessModal** | `AddProcessModal.tsx` | M | Add `useTranslations("processLibrary")` and replace ~15 hardcoded Spanish strings |
| 39 | **Add translations to GenerateEvaluationDialog** | `GenerateEvaluationDialog.tsx` | M | Add `useTranslations` and replace ~10 hardcoded Spanish strings |
| 40 | **Fix EvalFeedbackTab language consistency** | `EvalFeedbackTab.tsx` | M | All strings are English while rest of module is Spanish — either add i18n or make consistent |
| 41 | **Add translations to remaining components** | Multiple files | L | WorkspaceHeader, DiagramCanvas, ContextSidebar tabs, MaturityFlow, ContextChat, ConsolidationView, VersionDiff, ProjectGantt, ImportBpmnDialog, TemplatePicker, ExportReportButton, all risk components — ~120+ strings total |

### Batch 6: P6 — Visual Polish (Optional)

| # | Fix | File(s) | Effort | Description |
|---|-----|---------|--------|-------------|
| 42 | **Add glassmorphism to workspace cards** | Multiple sidebar tabs | M | Add `backdrop-blur-xl bg-card/80 border-white/10` to key cards in Resumen, Contexto, Risk tabs |
| 43 | **Add entrance animations** | ProcessLibrary, ProcessCard | M | Staggered fade-in for process cards using framer-motion |
| 44 | **Add Visual Map view** | New component | L | Create simplified process flow view for non-technical users — aligned with PRODUCT_VISION "mapa visual" requirement |

---

## F) EFFORT SUMMARY

| Batch | Fixes | Est. Time | Priority |
|-------|-------|-----------|----------|
| **Batch 1: P1 Critical** | #1-6 | ~3 hours | 🔴 Do first |
| **Batch 2: P2 Mobile** | #7-18 | ~8 hours | 🔴 Do second |
| **Batch 3: P3 Dark Mode** | #19-29 | ~5 hours | 🟡 Do third |
| **Batch 4: P4 Code Quality** | #30-36 | ~3 hours | 🟡 Do fourth |
| **Batch 5: P5 i18n** | #37-41 | ~6 hours | 🟢 When time allows |
| **Batch 6: P6 Polish** | #42-44 | ~8 hours | 🟢 Optional |
| **TOTAL** | 44 fixes | **~33 hours** | — |

---

## Implementation Order for Dev Agent #04

### Sprint 1 (Batch 1 + start Batch 2):
1. Delete `ProcessDetailView.tsx` (1,499 lines gone)
2. Fix STATUS_MAP inconsistency
3. Fix `border-orientation` typo
4. Replace AddProcessModal with Dialog
5. Fix ProcedureDetail reload → router.refresh
6. Fix ImportBpmnDialog accessibility
7. Start mobile workspace responsive (the hardest fix)

### Sprint 2 (Finish Batch 2 + Batch 3):
8. All touch target fixes (12 components)
9. CrossProcessRiskDashboard responsive
10. ProcedureStatusBar + ProcedurePreview responsive
11. ProcessHealthRing dark mode
12. RiskHeatMatrix dark mode
13. All other dark mode fixes

### Sprint 3 (Batch 4 + 5):
14. Extract shared constants
15. Clean unused imports/props
16. Fix toast import
17. Delete ProcedureDetail legacy
18. i18n pass on all components
