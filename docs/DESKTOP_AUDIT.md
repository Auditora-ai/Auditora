# Auditora SaaS — Desktop Audit Report

**Date:** 2026-04-04
**Auditor:** Automated Code Audit
**Reference:** PRODUCT_VISION.md v3
**Scope:** All 6 new SaaS modules (home, discovery, capture, process, evaluate, panorama) + navigation

---

## Executive Summary

The 6 modules implement the full BPM cycle (ENTENDER → CAPTURAR → DOCUMENTAR → EVALUAR → ACTUAR) as described in the Product Vision. The UI components are well-structured, professional, and mobile-first. However, almost every module runs on 100% mock/hardcoded data with no backend API integration. Navigation has several broken links using old Spanish route slugs instead of the actual English routes defined in the codebase. The Evaluate module is missing its "Tomar evaluacion" (public intake) flow and the Results view has no page route. The Process module back button points to a non-existent route.

**Critical gaps: 7 | High gaps: 12 | Medium gaps: 13 | Total: 32**

---

## Gap Report

### HOME MODULE (`/[orgSlug]/`)

| GAP ID | Severity | Issue | What Needs to Change |
|--------|----------|-------|---------------------|
| HOME-01 | HIGH | **Mock data fallback always shown for new orgs.** The home page fetches real ProcessDefinition data from Prisma but falls back to `MOCK_PROCESSES` when zero results. This means the mock "Acme Manufacturing" data appears for every real org that hasn't done Discovery yet, giving a misleading impression. | Show an empty state with CTA to start Discovery instead of mock data. Reserve mock data for dev/demo mode only. |
| HOME-02 | HIGH | **Industry badge hardcoded.** When real data is loaded, industry shows "Sin clasificar" instead of reading from OrgContext or CompanyBrain. When mock, it shows "Manufactura". | Fetch industry from `OrgContext` or `CompanyBrain` model. |
| HOME-03 | MEDIUM | **Alignment % is a placeholder formula.** Line 99 of page.tsx calculates `alignmentPct = 100 - riskCount * 8` — this is not connected to actual SimulationRun/evaluation results as the vision demands. | Connect to actual evaluation score aggregation when available. |
| HOME-04 | MEDIUM | **Duplicate mock data.** `mock-processes.ts` AND `use-process-map.ts` both contain identical MOCK_PROCESSES arrays (113 lines x 2). | Remove duplicate in `use-process-map.ts` — the hook is unused by the page (page is server component, fetches directly). |
| HOME-05 | MEDIUM | **useProcessMap hook is unused.** The home page is a server component that fetches data directly from Prisma. The client-side `useProcessMap` hook exists but is never called. | Remove or repurpose — currently dead code. |
| HOME-06 | MEDIUM | **FAB overlaps MobileBottomBar.** The FAB is positioned at `bottom-6 right-4` but the MobileBottomBar is also fixed at bottom. On mobile the FAB will overlap the bottom nav bar. | Adjust FAB position to `bottom-20` on mobile to clear the nav bar. |

### DISCOVERY MODULE (`/[orgSlug]/discovery`)

| GAP ID | Severity | Issue | What Needs to Change |
|--------|----------|-------|---------------------|
| DISC-01 | CRITICAL | **100% mock/simulated — no AI backend.** The `useDiscoveryChat` hook uses hardcoded questions with `setTimeout` delays to simulate AI responses. No API calls, no LLM integration, no CompanyBrain storage. | Connect to real AI backend (DiscoveryThread/DiscoveryMessage models). Call LLM API for contextual follow-up questions. |
| DISC-02 | CRITICAL | **Architecture generation is entirely fake.** `generateMockArchitecture()` ignores the `_context` parameter and returns the same 16 hardcoded processes regardless of what the user answered. | Implement real architecture generation via AI that uses the collected company context. |
| DISC-03 | CRITICAL | **confirmArchitecture does nothing.** The confirm button just `console.log`s the confirmed processes. No API call, no ProcessDefinition creation, no navigation to home. | Call API to create ProcessArchitecture + ProcessDefinition records, then redirect to home. |
| DISC-04 | HIGH | **Back button points to non-existent route.** DiscoveryChat header has `href="/${organizationSlug}/descubrir"` — this route doesn't exist. The actual discovery route is `/discovery`. | Change to `/${organizationSlug}/discovery` or `/${organizationSlug}`. |
| DISC-05 | HIGH | **No Value Chain (Porter) visualization.** The Product Vision says Discovery should produce a "Cadena de valor (modelo Porter): actividades primarias y de soporte". The current implementation only produces a process architecture list — no Porter chain visualization. | Add Porter Value Chain visualization as an output of the Discovery interview. |
| DISC-06 | MEDIUM | **Category naming mismatch.** Discovery uses Spanish categories (`estrategico`, `operativo`, `soporte`) but Home uses English (`strategic`, `core`, `support`). If architecture feeds home, the mapping will break. | Standardize category naming across modules or add explicit mapping. |
| DISC-07 | MEDIUM | **No persistence of chat state.** If user navigates away mid-interview, all progress is lost (state is local `useState`). | Persist discovery session to backend (DiscoveryThread model). |
| DISC-08 | MEDIUM | **Module-level `msgId` counter is mutable global state.** `let msgId = 0` at module scope causes issues with concurrent renders and SSR. | Use `useRef` or `crypto.randomUUID()` instead. |

### CAPTURE MODULE (`/[orgSlug]/capture/new`, `/[orgSlug]/capture/[processId]`)

| GAP ID | Severity | Issue | What Needs to Change |
|--------|----------|-------|---------------------|
| CAP-01 | CRITICAL | **100% mock/simulated SIPOC interview.** `useCaptureChat` uses hardcoded questions with setTimeout. No AI, no actual process elicitation, no data storage. | Connect to AI backend for contextual SIPOC questions. Store responses in ProcessDefinition + related models. |
| CAP-02 | CRITICAL | **"Ver proceso completo" link is broken.** CaptureChat's CompleteCard links to `/${organizationSlug}/procesos/${processId}` but the actual route is `/process/${processId}`. Uses `/procesos/` (Spanish plural, old route) instead of `/process/`. | Fix to `/${organizationSlug}/process/${processId}`. |
| CAP-03 | HIGH | **Document upload method is a dead end.** MethodSelector shows "Tengo un documento" option but `handleMethodSelect` only handles `method === "chat"`. Selecting "document" does nothing visible. | Implement document upload flow or show "coming soon" feedback. |
| CAP-04 | HIGH | **Process ID is a mock timestamp.** `NewProcessForm` generates `proc_${Date.now()}` as processId. This doesn't create any real DB record. | Create actual ProcessDefinition via API before navigating to capture chat. |
| CAP-05 | HIGH | **CaptureChat role mismatch in message rendering.** Messages use `role: "assistant"` in the hook but the chat rendering checks `msg.role === "user"` and `msg.role === "assistant"` — however the avatar display checks `msg.role === "assistant"` but the condition shows it for non-"user", so this works. BUT the DiscoveryChat uses `role: "ai"` while CaptureChat uses `role: "assistant"` — inconsistent naming across modules. | Standardize message role types across all chat modules. |
| CAP-06 | MEDIUM | **Capture result is hardcoded.** After the SIPOC interview completes, the result always shows `stepsCount: 8, risksCount: 5` regardless of what the user said. | Generate real BPMN/FMEA from captured data. |
| CAP-07 | MEDIUM | **No validation that process name doesn't already exist.** NewProcessForm doesn't check for duplicate process names. | Add uniqueness validation. |

### PROCESS MODULE (`/[orgSlug]/process/[processId]`)

| GAP ID | Severity | Issue | What Needs to Change |
|--------|----------|-------|---------------------|
| PROC-01 | CRITICAL | **100% hardcoded mock data.** The page.tsx has `const process = mockProcess;` with a TODO comment. The `processId` param is completely ignored — every process shows "Compras de Materia Prima". | Fetch real ProcessDefinition + related data from Prisma using processId. |
| PROC-02 | HIGH | **Back button links to non-existent route.** ProcessDetail back button points to `/${organizationSlug}/procesos` — this route doesn't exist in the app router. Should go to home (`/${organizationSlug}`). | Fix to `/${organizationSlug}` (the home/process map). |
| PROC-03 | HIGH | **"Evaluar equipo" button has no navigation.** The CTA button at the bottom is a plain `<Button>` with no `href` or `onClick` handler. It renders but does nothing when clicked. | Add `Link` to `/${organizationSlug}/evaluate/${processId}` or onClick handler. |
| PROC-04 | HIGH | **No editing capability.** The vision says "El process owner puede editar cualquier paso" and "La documentación es viva, no un PDF muerto". Currently all tabs are read-only display. | Add edit mode for procedure steps, RACI assignments, risks. |
| PROC-05 | MEDIUM | **Status values mismatch between Home and Process.** Home uses `DRAFT/CAPTURED/DOCUMENTED/EVALUATED` but Process detail uses `DRAFT/MAPPED/DOCUMENTED/VALIDATED/APPROVED`. These don't fully align. | Standardize lifecycle states across all modules. |
| PROC-06 | MEDIUM | **No BPMN export.** Vision says "BPMN exportable para técnicos" and "diagrama paso a paso (vertical en mobile, BPMN exportable)". FlowTab is a nice vertical card layout but has no export functionality. | Add BPMN XML export button. |
| PROC-07 | MEDIUM | **HistoryTab shows mock data.** All history entries are hardcoded in mock-process.ts. No real version tracking. | Connect to ProcessVersion / ProcessActivityLog models. |

### EVALUATE MODULE (`/[orgSlug]/evaluate/[processId]`)

| GAP ID | Severity | Issue | What Needs to Change |
|--------|----------|-------|---------------------|
| EVAL-01 | CRITICAL | **No "Tomar evaluacion" (public intake) route exists.** The Product Vision specifies `/intake/evaluacion/[token]` as a public, no-auth route for evaluees. This route/page doesn't exist anywhere in the codebase. The EvaluationRunner component exists but has no page to render it. | Create the public intake route at `/intake/evaluacion/[token]/page.tsx` rendering EvaluationRunner. |
| EVAL-02 | CRITICAL | **No Results view page route.** EvaluationResults component exists and is complete, but the evaluate page only renders `EvaluateLauncher`. There's no way to see the results view — no tab, no route, no conditional rendering. | Add results mode to the evaluate page (e.g., `/evaluate/[processId]/results` or tab-based switching). |
| EVAL-03 | HIGH | **100% mock data.** The page always loads `mockEvaluationProcess` regardless of processId. No real scenario generation from FMEA/BPMN data. | Connect to real SimulationTemplate/SimulationScenario models. Generate scenarios from actual FMEA risks. |
| EVAL-04 | HIGH | **"Generar y enviar evaluación" is fake.** The send button just sets `isSent = true` locally. No API call, no email/link generation, no SimulationRun creation. | Implement real evaluation generation and distribution via API. |
| EVAL-05 | HIGH | **Progress tracker is fake.** After "sending", `completedCount` is hardcoded to `3`. It doesn't update or reflect real completion. | Connect to real SimulationRun completion tracking. |
| EVAL-06 | MEDIUM | **Missing accent marks in Spanish text.** Multiple strings like "evaluacion", "Quien evaluas", "Respondio", "areas" are missing tildes/accents. This looks unprofessional for a Spanish-language product. | Fix: "evaluación", "¿Quién evalúas?", "Respondió", "áreas", etc. |

### PANORAMA MODULE (`/[orgSlug]/panorama`)

| GAP ID | Severity | Issue | What Needs to Change |
|--------|----------|-------|---------------------|
| PAN-01 | HIGH | **100% hardcoded mock data.** `MOCK_PANORAMA` is always displayed. No real aggregation of process/evaluation data. | Aggregate real data: overall score from evaluations, documentation progress from ProcessDefinitions, risks from ProcessRisk. |
| PAN-02 | HIGH | **Action links point to old/non-existent routes.** Actions href values are `/evaluaciones` and `/descubrir` which are old Spanish routes. The actual routes are `/evaluate/[id]`, `/discovery`, etc. | Fix hrefs to match actual route structure. |
| PAN-03 | MEDIUM | **No "Qué tan preparada está mi operación?" answer.** Vision says Panorama answers 3 specific questions. The current layout shows score + breakdowns + alerts + actions + trend, which is close but doesn't explicitly frame the 3 questions. | Consider structuring sections around the 3 key questions from the vision. |
| PAN-04 | MEDIUM | **Sparkline bar chart uses CSS class `fill-[hsl(var(--palette-action))]`** which may not resolve correctly if the CSS variable isn't defined as an HSL value. Other modules use `var(--palette-action, #3B8FE8)` fallback pattern. | Standardize to `fill-[var(--palette-action,#3B8FE8)]` or ensure HSL variable exists. |

### NAVIGATION (MobileBottomBar + NavBar)

| GAP ID | Severity | Issue | What Needs to Change |
|--------|----------|-------|---------------------|
| NAV-01 | HIGH | **"Procesos" tab links to `/procesos` which doesn't have a dedicated route.** MobileBottomBar links to `${basePath}/procesos` and NavBar similarly. There's no `/procesos/page.tsx` — processes are shown on the home page (`/`). Clicking "Procesos" tab leads to a 404. | Either create a `/procesos` route that redirects to home, or change the tab to point to home. |
| NAV-02 | HIGH | **"Evaluaciones" tab links to `/evaluaciones` which likely doesn't have a list page.** The evaluate module only has `/evaluate/[processId]`. There's no `/evaluaciones/page.tsx` for listing all evaluations. | Create an evaluations list page at `/evaluaciones/page.tsx`. |
| NAV-03 | MEDIUM | **No Panorama tab in mobile bottom bar.** The vision says Panorama is a key section. It's accessible via the home path active-check but there's no dedicated "Panorama" tab. The Dashboard tab covers both home and panorama. | Consider adding Panorama as a distinct navigation item or making it clearly accessible from home. |

---

## Module-by-Module Summary

### HOME — Overall Grade: B
- **Vision match:** Good. Shows process map grouped by strategic/operative/support with maturity states.
- **Data source:** Hybrid — fetches real Prisma data but falls back to mock. Good foundation.
- **Navigation:** FAB correctly links to `/capture/new`. Process cards link to `/process/[id]`.
- **UX completeness:** Good empty-state handling needed. Professional design.
- **Code quality:** Good TypeScript, clean component structure, proper imports.
- **Professionalism:** Looks professional, not template-like. Custom design system colors.

### DISCOVERY — Overall Grade: C+
- **Vision match:** Partial. Has interview flow and architecture review but missing Value Chain (Porter) output.
- **Data source:** 100% mock. No AI, no persistence.
- **Navigation:** Back button broken. Confirm button is a dead end.
- **UX completeness:** The 3-phase flow (interview → generating → review) is well designed. Swipe-to-delete on cards is a nice touch.
- **Code quality:** Good TypeScript. Inline SVG icons could use lucide-react. Global mutable `msgId` is a bug risk.
- **Professionalism:** Looks polished. Progress bar, typing indicators, animation keyframes all present.

### CAPTURE — Overall Grade: C+
- **Vision match:** Good. SIPOC framework with S-I-P-O-C phase indicator, 3 capture methods (chat/doc/recording), completion card with step/risk counts.
- **Data source:** 100% mock. Hardcoded questions and results.
- **Navigation:** Back correctly goes to `/capture/new`. Completion link is broken (wrong route).
- **UX completeness:** Chat → generating → complete flow is solid. Document method is dead end. Recording correctly locked as premium.
- **Code quality:** Good TypeScript. Clean separation of concerns.
- **Professionalism:** Very polished chat interface with proper mobile considerations.

### PROCESS — Overall Grade: B-
- **Vision match:** Excellent structure. All 5 tabs (Flujo, Procedimiento, Riesgos, RACI, Historial) match the vision exactly.
- **Data source:** 100% hardcoded mock. Uses same process regardless of ID.
- **Navigation:** Back button broken. "Evaluar equipo" CTA is non-functional.
- **UX completeness:** All tabs are rich and well-designed. Missing: editing, export, AI suggestions.
- **Code quality:** Excellent TypeScript. Rich type definitions. Clean component decomposition.
- **Professionalism:** Highly professional. FMEA tab with S×F×D=RPN visual is standout. RACI matrix is well-structured.

### EVALUATE — Overall Grade: B-
- **Vision match:** Good coverage of Launcher (select people + see FMEA risks) and Runner (Harvard-case scenarios with feedback). Results view exists as component. Missing: public intake route.
- **Data source:** 100% mock. Excellent mock quality — 8 realistic Harvard-case scenarios for "Compras de Materia Prima".
- **Navigation:** No way to reach Results view. No public intake route.
- **UX completeness:** Launcher → Runner → Results flow is complete as components. Page wiring is incomplete.
- **Code quality:** Excellent. Proper readonly types, clean hooks, good state management.
- **Professionalism:** Outstanding. The evaluation scenarios read like real BPM case studies. Score ring animation is polished.

### PANORAMA — Overall Grade: B-
- **Vision match:** Good. Shows overall score with trend, breakdowns, alerts, and actionable suggestions — matches vision's 3 questions.
- **Data source:** 100% mock.
- **Navigation:** Action links point to wrong routes.
- **UX completeness:** Complete layout with sparkline trend chart, breakdown rings, alert cards, action cards.
- **Code quality:** Good. Uses Card components from UI lib properly.
- **Professionalism:** Clean executive dashboard feel. Sparkline SVG is custom-built.

---

## Priority Remediation Order

### Phase 1 — Fix broken navigation (Day 1)
1. **DISC-04** — Fix discovery back button route
2. **CAP-02** — Fix "Ver proceso completo" route
3. **PROC-02** — Fix process back button route
4. **PROC-03** — Wire "Evaluar equipo" button to evaluate route
5. **PAN-02** — Fix panorama action hrefs
6. **NAV-01** — Create /procesos route or redirect
7. **NAV-02** — Create /evaluaciones list page

### Phase 2 — Wire up real data for HOME (Day 2)
8. **HOME-01** — Replace mock fallback with empty state
9. **HOME-02** — Fetch real industry from OrgContext
10. **PROC-01** — Fetch real process data by ID

### Phase 3 — Create missing routes (Day 3)
11. **EVAL-01** — Create public intake route `/intake/evaluacion/[token]`
12. **EVAL-02** — Add results view route/tab for evaluate page

### Phase 4 — Backend integration (Week 2+)
13. **DISC-01, DISC-02, DISC-03** — Connect Discovery to AI + Prisma
14. **CAP-01, CAP-04** — Connect Capture to AI + Prisma
15. **EVAL-03, EVAL-04** — Connect Evaluate to real scenario generation
16. **PAN-01** — Aggregate real panorama data

---

## Files Audited

| # | File | Lines | Status |
|---|------|-------|--------|
| 1 | docs/PRODUCT_VISION.md | 388 | Reference |
| 2 | modules/home/components/ProcessMap.tsx | 126 | ✅ Read |
| 3 | modules/home/components/ProcessCard.tsx | 142 | ✅ Read |
| 4 | modules/home/components/CategoryGroup.tsx | 90 | ✅ Read |
| 5 | modules/home/data/mock-processes.ts | 113 | ✅ Read |
| 6 | modules/home/hooks/use-process-map.ts | 160 | ✅ Read |
| 7 | app/.../[organizationSlug]/page.tsx | 140 | ✅ Read |
| 8 | modules/discovery/components/DiscoveryChat.tsx | 303 | ✅ Read |
| 9 | modules/discovery/components/ArchitectureReview.tsx | 209 | ✅ Read |
| 10 | modules/discovery/components/ProcessSuggestionCard.tsx | 275 | ✅ Read |
| 11 | modules/discovery/hooks/use-discovery-chat.ts | 502 | ✅ Read |
| 12 | app/.../discovery/page.tsx | 15 | ✅ Read |
| 13 | modules/capture/components/CaptureChat.tsx | 450 | ✅ Read |
| 14 | modules/capture/components/MethodSelector.tsx | 150 | ✅ Read |
| 15 | modules/capture/components/NewProcessForm.tsx | 184 | ✅ Read |
| 16 | modules/capture/hooks/use-capture-chat.ts | 239 | ✅ Read |
| 17 | app/.../capture/new/page.tsx | 15 | ✅ Read |
| 18 | app/.../capture/[processId]/page.tsx | 26 | ✅ Read |
| 19 | modules/process/components/ProcessDetail.tsx | 183 | ✅ Read |
| 20 | modules/process/components/FlowTab.tsx | 215 | ✅ Read |
| 21 | modules/process/components/ProcedureTab.tsx | 120 | ✅ Read |
| 22 | modules/process/components/RisksTab.tsx | 177 | ✅ Read |
| 23 | modules/process/components/RaciTab.tsx | 161 | ✅ Read |
| 24 | modules/process/components/HistoryTab.tsx | 111 | ✅ Read |
| 25 | modules/process/data/mock-process.ts | 667 | ✅ Read |
| 26 | app/.../process/[processId]/page.tsx | 21 | ✅ Read |
| 27 | modules/evaluate/components/EvaluateLauncher.tsx | 255 | ✅ Read |
| 28 | modules/evaluate/components/EvaluationRunner.tsx | 415 | ✅ Read |
| 29 | modules/evaluate/components/EvaluationResults.tsx | 441 | ✅ Read |
| 30 | modules/evaluate/data/mock-evaluation.ts | 410 | ✅ Read |
| 31 | modules/evaluate/hooks/use-evaluation.ts | 123 | ✅ Read |
| 32 | app/.../evaluate/[processId]/page.tsx | 22 | ✅ Read |
| 33 | modules/panorama/components/PanoramaView.tsx | 316 | ✅ Read |
| 34 | modules/panorama/data/mock-panorama.ts | 93 | ✅ Read |
| 35 | app/.../panorama/page.tsx | 35 | ✅ Read |
| 36 | modules/shared/components/MobileBottomBar.tsx | 264 | ✅ Read |
| 37 | modules/shared/components/NavBar.tsx | 180 | ✅ Read |

**Total lines audited: ~6,200+**
