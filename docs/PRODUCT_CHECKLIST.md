# Auditora.ai — Product Vision Checklist

**Generated:** 2026-04-03
**Source:** PRODUCT_VISION.md v2 + PROGRESS.md
**Legend:** ✅ Built | 🔵 In Progress | ⬜ Not Built

---

## SIDEBAR STRUCTURE (4 sections + config)

### 1. DESCUBRIR (Capturar — 3 channels into one destination)
*All 3 channels produce: BPMN diagram + procedure + identified risks*

#### a) Scan Automático (Free Tier — Zero Friction)
- ✅ Public URL scan, no registration required
- ✅ 60-second scan produces industry detection + critical processes + potential risks
- ✅ Theatrical progressive reveal (staggered 200ms–1800ms animations)
- ✅ Output feels business-specific, not generic
- ✅ CTA: "this is a preview — register for the real diagnosis"
- ✅ Shareable link so director can send to team (7-day tokens via /api/public/scan/share)
- ✅ SharedScanResults page for shared link recipients
- ⬜ Disclaimer as part of UX ("we're inferring, not auditing")
- ⬜ Scan quality: currently crawls marketing copy and produces generic inferences — needs rebuild to feel specific

#### b) Entrevista por Chat (Deep Capture)
- ⬜ AI assistant interviews process owner via chat (not call)
- ⬜ Adaptive structured questions (SIPOC methodology): "what goes in", "who does it", "what happens if it fails", "who approves"
- ⬜ Generates BPMN diagram from chat conversation
- ⬜ Generates procedure/SOP from chat conversation
- ⬜ Async — user completes at their own pace
- ⬜ Works in Spanish with accents
- ⬜ Faster and cheaper than a live call

#### c) Sesión en Vivo (Live Demo Wow)
- ⬜ Bot joins video call (via Recall.ai)
- ⬜ Listens to conversation in real-time
- ⬜ Generates BPMN diagram in real-time during call
- ⬜ Used for demos and premium clients
- ⬜ Secondary input channel (higher cost, more friction)

#### Descubrir General
- ✅ Scan, Entrevista, and Sesión en Vivo unified under single "Descubrir" sidebar item
- ⬜ All 3 channels funnel to the same output format (BPMN + procedure + risks)

---

### 2. PROCESOS (Documentar — Single workspace per process)
*Documentation exists TO enable evaluation, not for its own sake*

#### Per-Process Workspace
- ✅ Process library as main module (absorbs procedures + risks)
- ✅ Procedures merged into process-library (not separate module)
- ✅ Risks merged into process-library as property of each process (not separate module)
- ⬜ Diagrama BPMN — technical version (for consultant/analyst)
- ⬜ Mapa Visual — human-readable version (for CEO/manager/anyone)
- ⬜ Procedimiento (SOP) — AI-generated from process, editable, versioned
- ⬜ RACI matrix — who is responsible for each step
- ⬜ Riesgos — as property of process ("this step is high-risk because if it fails, the line stops")

#### Process Enrichment
- ✅ Evaluation feedback loop: processes enriched by evaluation results ("60% failed at this step")
- ✅ EvalFeedbackOverlay (failure badges on BPMN nodes)
- ✅ EvalFeedbackTab (sidebar showing per-process feedback)
- ✅ NodeContextPanel (per-node evaluation feedback)

#### Export from Processes
- ✅ Deliverables absorbed into Procesos (export) — redirects from /deliverables to /processes
- ⬜ PDF export of process documentation
- ⬜ PPTX export (Growth plan+)
- ⬜ Excel export (Growth plan+)
- ⬜ API export (Scale plan+)

---

### 3. EVALUACIONES (Evaluar — The product that sells)
*Harvard-case-style stress tests based on real company procedures*

#### Scenario Generation
- ✅ GenerateEvaluationDialog (239 lines) wired into ProcessDetailView
- ✅ Select a process → AI generates scenarios based on REAL company procedure
- ✅ Role selector (9 roles available)
- ✅ Risk picker (top 5 auto-selected)
- ✅ POST to /api/evaluaciones/generate
- ⬜ Employee faces concrete decisions (e.g., "$500K order, provider not on approved list — what do you do?")
- ⬜ Options A, B, C — each with consequences
- ⬜ System evaluates if decision aligns with procedure

#### Risk Dashboard (Tab within Evaluaciones)
- ✅ Evaluation + Risk dashboard merged into Evaluaciones with tab switcher (Catalog | Risk Dashboard)
- ✅ HumanRiskDashboard (7 sub-components, ~1,260 LOC)
- ✅ TeamTable — per-person scores
- ✅ ProcessHeatmap — per-process risk visualization
- ✅ ErrorPatternsCard — common error patterns
- ✅ ScoreTrendChart — score trends over time
- ✅ KpiRow — key performance indicators
- ✅ HeroScoreCard — main score display
- ✅ ScoreDistributionChart — score distribution

#### Progress / Before-After Metrics
- ✅ ProgressDashboard (409 lines) with DeltaBadge
- ✅ Per-process improvement tracking
- ✅ Per-member improvement tracking
- ✅ DimensionTrendChart
- ✅ "Progress" tab in EvaluacionesTabs
- ✅ First vs latest score comparison with delta indicators

#### CEO View (What the CEO sees)
- ✅ "Your purchasing team has X% procedural alignment"
- ✅ Weakest point identification (e.g., "new supplier approval — 3 of 5 made wrong decision")
- ✅ Per-person scores (e.g., "María García 91% — excellent. Carlos López 45% — needs urgent retraining")
- ⬜ Before/after error tracking ("Before: 3 critical errors/month. After retraining: 0")

#### Exportable Reports
- ✅ Enhanced human-risk-report-generator (834 lines)
- ✅ Executive insights in reports
- ✅ Inline SVG score trend charts
- ✅ Progress/improvement section in report
- ✅ Training recommendations
- ✅ API route /api/evaluation/export-report (branded HTML report)
- ✅ Session review export (303 lines) at /api/sessions/[id]/export/review
- ⬜ PDF report format
- ⬜ PPTX report format (for board presentations)
- ⬜ Excel data export

---

### 4. PANORAMA (Ver — Consolidated Dashboard)
*Actionable: "click to see the details"*

- ✅ 4 KPI cards (org score, evaluations completed, members evaluated, completion rate)
- ✅ Dimension progress bars (alignment, control, criterio)
- ✅ Score trend sparkline
- ✅ Data fetched server-side in parallel
- ⬜ Score global clearly displayed
- ⬜ Vulnerable processes highlighted
- ⬜ "Next steps" recommendations
- ⬜ Every element clickable — drill down to details

---

### 5. CONFIGURACIÓN (Bottom of sidebar)
- ⬜ Organization settings
- ⬜ Members management
- ⬜ Billing/facturación

---

## MODULES REMOVED (Per Vision)

| Old Module | Action | Status |
|---|---|---|
| Sessions (standalone) | Absorbed into Descubrir | ✅ Removed from nav |
| Riesgos (standalone) | Property of each process | ✅ Merged |
| Procedimientos (standalone) | Integrated into Procesos workspace | ✅ Merged |
| Simulations | Renamed to Evaluaciones | ✅ Renamed |
| Evaluation (standalone) | Fused into Evaluaciones (tab) | ✅ Merged |
| Deliverables | Absorbed into Procesos + Evaluaciones | ✅ Redirects |
| Discovery (standalone chat) | Absorbed into Descubrir | ✅ Removed |
| Documents | Eliminated | ✅ Removed |
| Assistant | Eliminated (AI integrated per-module) | ✅ Removed |

---

## ONBOARDING FLOW (4-Step Wizard)

### Step 1 — Cuenta (Account)
- ✅ Name, email, password (existed as OnboardingAccountStep)

### Step 2 — Tu Empresa (Your Company)
- ✅ Company name
- ✅ Industry dropdown (matching scan industries)
- ✅ Company size ranges (10-50, 51-200, 201-500, 501-1000)
- ✅ "How many people would you evaluate?" (5, 10-30, 31-100, 100+)
- ✅ "Which process worries you most?" (free text)

### Step 3 — Primer Valor (First Value)
- ✅ AI recommendation: "Based on what you told us, we recommend starting with [inferred process]"
- ✅ Option A: "Start chat interview" → goes to process capture chat
- ✅ Option B: "Schedule a live session" → goes to create session
- ✅ Option C: "Explore the dashboard" → skip, goes to Panorama
- ✅ 3 action cards UI

### Step 4 — Setup Completo
- ✅ Invite members (optional)
- ✅ "Your organization is ready. We recommend documenting your first process before creating evaluations."

### Onboarding Technical
- ✅ react-hook-form + zod validation
- ✅ Translations: en, es, fr, de
- ✅ Step bounds clamped to 1-4 range
- ✅ pnpm build passes

---

## ACQUISITION FUNNEL

```
LANDING (marketing)
  ↓
SCAN GRATIS (public, no registration)
  ↓ exit: "Register for full diagnosis"
  ↓
REGISTRO
  Onboarding wizard (Steps 1-4)
  ↓ auto-generates: first org, first real scan
  ↓
FREE TRIAL (14 days, full access)
  - Document up to 3 processes (via chat or session)
  - Generate up to 10 evaluations
  - See results and human risk dashboard
  - Export 1 report
  ↓ exit: "Your team has 62% alignment. Upgrade to evaluate everyone."
  ↓
CONVERSION
```

| Element | Status |
|---|---|
| Public scan (no auth) | ✅ Built |
| Scan → CTA to register | ✅ Built |
| Onboarding wizard | ✅ Built |
| Auto-generate first org | ⬜ Not verified |
| 14-day free trial | ⬜ Not built |
| Trial limits (3 processes, 10 evals, 1 report) | ⬜ Not built |
| Trial-end conversion CTA | ⬜ Not built |

---

## PRICING / PLANS

### Plan Structure
| | Starter | Growth | Scale | Enterprise |
|---|---|---|---|---|
| Target | Starting, 1 key process | Cover full area | Evaluate entire operation | Custom |
| Price | $49/mo | $199/mo | $499/mo | Custom |
| Processes | 3 | 15 | Unlimited | Unlimited |
| Evaluations/mo | 10 | 50 | 250 | Unlimited |
| Evaluators | 5 people | 30 people | 150 people | Unlimited |
| AI Sessions/mo | 3 | 10 | Unlimited | Unlimited |
| Reports/mo | 1 | 10 | Unlimited | Unlimited |
| Admin Users | 2 | 5 | 15 | Unlimited |
| Export | Basic PDF | PDF + PPTX + Excel | All + API | All + API + SSO |

### Plan Implementation Status
- ✅ PlanLimits type: evaluations/evaluators/processes/sessions/reports/adminUsers
- ✅ 3 plans configured (Starter $49, Growth $199, Scale $499)
- ✅ FR/DE pricing translations rewritten
- ✅ UsageDashboard shows evaluations as primary metric (not sessions)
- ✅ PricingTable updated for new features per plan
- ⬜ Enterprise plan (custom)
- ⬜ Stripe integration with new plan structure
- ⬜ Actual limit enforcement at API level
- ⬜ Trial period (14 days) implementation

### Usage Metrics Tracked
- ✅ Evaluations completed/month (SimulationRun.count)
- ✅ Unique evaluators/month (SimulationRun.userId distinct)
- ✅ Documented processes (ProcessDefinition.count)
- ✅ AI sessions/month (Session.count)
- ✅ Exported reports/month (Export.count)
- ✅ Usage API: /api/organizations/[orgId]/usage
- ✅ Server helper: packages/payments/lib/usage.ts

---

## SHARED INFRASTRUCTURE

### BPMN Process Engine (Shared Library)
- ✅ Extracted BPMN lib as shared package (process-engine)
- ✅ Used by scan + sessions + processes
- ⬜ Full BPMN diagramming capabilities across all 3 capture channels

### NavBar / Sidebar
- ✅ 4 items only: Descubrir → Procesos → Evaluaciones → Panorama
- ✅ Removed: sessions, evaluation, deliverables, documents
- ✅ MobileBottomBar matches desktop sidebar
- ✅ Configuración at bottom

### Translations / i18n
- ✅ English (en)
- ✅ Spanish (es)
- ✅ French (fr)
- ✅ German (de)
- ✅ Stale keys removed (sessionsIncluded, extraSession)
- ✅ All pricing references evaluations as value unit

---

## FASE 3 — GROWTH FEATURES (Roadmap)

| Feature | Issue | Status |
|---|---|---|
| Notificaciones y gestión del cambio | #20 | 🔵 Up Next |
| - Notification model | | ⬜ |
| - Bell UI | | ⬜ |
| - Change confirmations ("procedure X changed, 3 of 5 haven't confirmed") | | ⬜ |
| - Email digests | | ⬜ |
| Colaboración multi-usuario | #19 | ⬜ Pending |
| - Presence indicators | | ⬜ |
| - Edit locking | | ⬜ |
| - Comments/mentions | | ⬜ |
| - Activity log | | ⬜ |
| Onboarding basado en evaluaciones | #22 | ⬜ Pending |
| - OnboardingPlan model | | ⬜ |
| - Manager assigns processes to employees | | ⬜ |
| - Employee evaluation flows | | ⬜ |
| Programa de certificación | #23 | ⬜ Pending |
| - Certification/CertificationGrant models | | ⬜ |
| - Auto-certify after passing evaluations | | ⬜ |
| - Expiry/renewal cycle | | ⬜ |
| - "Your team is certified in Purchasing Process" | | ⬜ |
| Integraciones (Slack/Teams/GWS) | #21 | ⬜ Pending |
| - Webhook notifications | | ⬜ |
| - OAuth connections | | ⬜ |
| - Channel mapping | | ⬜ |

---

## KNOWN BUGS (Open)

| # | Severity | Description | Status |
|---|---|---|---|
| BUG-024 | 🟡 Medium | Hardcoded Spanish "Inicio"/"Fin" fallbacks in scan/BPMN pipeline | 🔴 OPEN |
| BUG-025 | 🟢 Low | Hardcoded Spanish labels in BPMN node workspace UI | 🔴 OPEN |

---

## SUMMARY STATS

| Category | Should Have | Built | Gap |
|---|---|---|---|
| Descubrir (Scan) | 9 items | 7 | 2 remaining |
| Descubrir (Chat Interview) | 7 items | 0 | 7 remaining |
| Descubrir (Live Session) | 5 items | 0 | 5 remaining |
| Procesos (Workspace) | 11 items | 7 | 4 remaining |
| Procesos (Export) | 4 items | 0 | 4 remaining |
| Evaluaciones (Scenarios) | 7 items | 5 | 2 remaining |
| Evaluaciones (Risk Dashboard) | 7 items | 7 | 0 remaining ✅ |
| Evaluaciones (Progress) | 5 items | 5 | 0 remaining ✅ |
| Evaluaciones (Reports) | 9 items | 7 | 2 remaining |
| Panorama | 4 items | 2 | 2 remaining |
| Onboarding | 14 items | 14 | 0 remaining ✅ |
| Pricing/Plans | 8 items | 5 | 3 remaining |
| Fase 3 Features | 15 items | 0 | 15 remaining |
| **TOTAL** | **~105 items** | **~59** | **~46 remaining** |
