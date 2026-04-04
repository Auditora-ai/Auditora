# SaaS Module Audit — Brutally Honest Assessment

*Generated: 2026-04-04*

---

## 1. DESCUBRIR (Discovery Hub)

### Screens
- **`/[org]/descubrir`** — Hub page with 3 channel cards (Scan, Interview, Live) + past sessions list
- **`/[org]/descubrir/scan`** — Website URL scan (AI-powered)
- **`/[org]/descubrir/interview`** — Start new AI interview session
- **`/[org]/descubrir/interview/[sessionId]`** — Resume existing AI interview
- **`/[org]/descubrir/new`** — Create new live meeting session (video call join)

### What Actually Works

**Scan (REAL):**
- Input: URL + Turnstile captcha
- Backend: `POST /api/public/scan/analyze` — crawls website via `web-crawler.ts`, runs LLM analysis (GLM or Claude), streams SSE progress events
- Creates: Scan result with company name, industry, vulnerability score, process list, highest-risk process, FMEA risks
- Data: Creates a `MeetingSession` record with type `SCAN`, stores scan result
- Limitations: No auth required, rate-limited by IP. Results are ephemeral unless user signs up.
- **Verdict: FULLY FUNCTIONAL — end-to-end working scan pipeline**

**AI Interview (REAL):**
- Creates session via `POST /api/sessions` (type `AI_INTERVIEW`)
- Chat via `POST /api/sessions/interview/[sessionId]/chat` — SIPOC-driven questions from LLM
- Tracks: completeness score, SIPOC coverage per dimension, ghost nodes, ready-for-reveal flag
- Completion via `POST /api/sessions/interview/[sessionId]/complete` — generates BPMN XML + risk analysis
- Resume via `GET /api/sessions/interview/[sessionId]/status` — loads conversation history
- Data: Creates `MeetingSession`, updates `conversationLog`, generates `bpmnXml`, `risks[]`
- **Verdict: FULLY FUNCTIONAL — complete AI-driven process discovery pipeline**

**Live Session / New (REAL):**
- `NewSessionForm` creates a session that joins a video call via call bot
- Session lifecycle: SCHEDULED → CONNECTING → ACTIVE → ENDED
- Live page at `/[org]/session/[sessionId]/live` with real-time transcript extraction
- Review page at `/[org]/session/[sessionId]/review` — generates 5 deliverables async:
  - Summary (executive summary + action items)
  - Process Audit (completeness score, SIPOC scores, knowledge gaps, contradictions)
  - RACI Matrix
  - Risk Audit (FMEA-style risks with severity/probability)
  - Complexity Score
- **Verdict: FULLY FUNCTIONAL — real meeting intelligence pipeline**

### API Endpoints Called
- `POST /api/public/scan/analyze` (SSE stream, no auth)
- `POST /api/sessions` (create session)
- `POST /api/sessions/interview/[id]/chat`
- `POST /api/sessions/interview/[id]/complete`
- `GET /api/sessions/interview/[id]/status`
- `POST /api/sessions/[id]/end`
- Various deliverable endpoints for review page

---

## 2. PROCESOS (Process Library)

### Screens
- **`/[org]/procesos`** — Process library with card grid, filtering, search
- **`/[org]/procesos/[processId]`** — Full process workspace

### What Actually Works

**Process Library (REAL):**
- Server-side query: `db.processDefinition.findMany()` with counts for sessions, versions, risks
- Filtering by: search text, status (all/draft/active/archived), level (all/macro/process/subprocess), category (core/strategic/support)
- Actions: Add process manually (`AddProcessModal`), import BPMN (`ImportBpmnDialog`), template picker, export report
- Delete process with confirmation dialog
- Process cards show: name, description, level, status, version count, session count, risk count, critical risk count, BPMN presence
- **Verdict: FULLY FUNCTIONAL — real CRUD on process definitions**

**Process Workspace (REAL):**
- Loads full process data including: BPMN XML, parent/children hierarchy, sessions, versions, RACI entries, eval feedback, intelligence
- Features:
  - **BPMN Diagram Canvas** (`DiagramCanvas.tsx`) — renders BPMN XML with bpmn.js, interactive nodes
  - **Health badges** on BPMN nodes from RACI and eval feedback data
  - **Context sidebar** with tabs: Sessions, Eval Feedback, Context Chat, Version History
  - **RACI Tab** — view/manage RACI matrix per process
  - **Risk management** — full risk CRUD per process: RiskRegister, RiskHeatMatrix, FmeaView, ControlMapping, MitigationTracker
  - **Procedures** — create/view/version procedures linked to process nodes
  - **Version history** — create snapshots, rollback, diff view
  - **Collaboration** — presence indicators, locking, comments (via `@collaboration` module)
  - **AI context chat** per process
  - **Generate evaluations** from process context
- Backend APIs:
  - `PATCH /api/processes/[id]` (update process)
  - `GET/POST /api/processes/[id]/risks` (risk CRUD)
  - `GET/POST /api/processes/[id]/raci` (RACI management)
  - `POST /api/processes/[id]/consolidate` (version consolidation)
  - `POST /api/processes/[id]/context-chat` (AI chat about process)
  - `GET/POST /api/processes/[id]/intelligence` (process intelligence items)
  - `POST /api/processes/[id]/procedures/generate` (AI procedure generation)
  - `POST /api/processes/[id]/repair` (BPMN repair)
  - `POST /api/processes/[id]/export-book` (full process book export)
  - `POST /api/processes/export-report` (org-wide report)
- **Verdict: DEEPLY FUNCTIONAL — this is the most feature-rich module in the app**

---

## 3. EVALUACIONES (Evaluations / Simulations)

### Screens
- **`/[org]/evaluaciones`** — Hub with 3 tabs: Catalog, Dashboard, Progress
- **`/[org]/evaluaciones/[templateId]`** — Template detail with scenarios, run history
- **`/[org]/evaluaciones/[templateId]/run/[scenarioId]`** — Run a simulation (implied from links)

### What Actually Works

**Evaluation Hub (REAL):**
- Lists simulation templates from DB (`simulationTemplate` table)
- Stats: template count, completed runs, average score
- Template cards show: title, process name, target role, scenario count, completion rate, avg score, risk level badge
- Recent runs with user name, score, status
- **Verdict: FULLY FUNCTIONAL listing and stats**

**Template Detail (REAL):**
- Loads template with scenarios, decisions, and run history
- Shows: narrative context, stats (scenarios/evaluations/completed), scenario list with decision counts
- "Iniciar Evaluacion" button links to run page
- Recent runs with user, duration, score, status
- **Verdict: FULLY FUNCTIONAL detail view**

**Evaluation Runner (REAL):**
- `EvaluacionRunner` component — full decision-based simulation
- Presents sequential decisions with multiple choice options
- Each choice: `POST {endpoint}/respond` with decisionId, chosenOption, timeToDecide
- Shows consequence interstitials between decisions
- On completion: `POST {endpoint}/complete` returns scores (alignment, riskLevel, criterio, overallScore)
- GSAP animations for card transitions
- Procedural references shown per decision
- **Verdict: FULLY FUNCTIONAL — complete Harvard-case-style simulation engine**

**Dashboard Tab (REAL):**
- `fetchHumanRiskDashboardData()` — aggregates from `HumanRiskProfile` and `SimulationRun` tables
- Shows: org avg score, total simulations, members evaluated, completion rate, dimension averages (alignment/riskLevel/criterio), score trend by month, process heatmap, error patterns, member profiles
- Components: HeroScoreCard, KpiRow, ScoreTrendChart, DimensionTrendChart, ScoreDistributionChart, ProcessHeatmap, ErrorPatternsCard, TeamTable
- **Verdict: FULLY FUNCTIONAL — real analytics from real data**

**Progress Tab (REAL):**
- `fetchProgressData()` — computes before/after comparisons
- Shows: overall delta, per-process progress, per-member progress, dimension trends over time
- **Verdict: FULLY FUNCTIONAL — real progress tracking**

### API Endpoints
- `POST /api/intake/evaluacion/[token]` (external intake)
- Evaluation run endpoints at `{respondEndpoint}/respond` and `{respondEndpoint}/complete`
- `POST /api/evaluation/export-report` (export)
- Template generation via `GenerateEvaluationDialog` from process workspace

### Data Models
- `SimulationTemplate` — evaluation definition per process + role
- `SimulationScenario` — scenario within template
- `SimulationDecision` — decision points with options/consequences
- `SimulationRun` — user attempt with scores
- `HumanRiskProfile` — aggregated per-user risk profile

---

## 4. PANORAMA (Command Center / Dashboard)

### Screens
- **`/[org]/panorama`** — Full-height risk command center dashboard

### What Actually Works

**Risk Dashboard (REAL):**
- Parallel server-side queries for: processes, top risks, next session, active session, recent sessions, evaluaciones data, recent evaluations
- Maturity score computed: 25% documentation + 25% risk coverage + 50% evaluation scores
- Sections:
  - Organization maturity score
  - Top 5 risks (by risk score) with severity/probability
  - Process count & documentation stats
  - Risk count
  - Next scheduled session
  - Recent activity feed (sessions + evaluations merged, sorted by date)
  - Evaluaciones integration (org avg, dimensions, trends)
  - Vulnerable processes (lowest alignment scores)
  - Smart next-step recommendations based on data state
- **Verdict: FULLY FUNCTIONAL — real cross-module dashboard pulling live data**

### Data Read
- `ProcessDefinition` (process stats)
- `ProcessRisk` (top risks, risk count)
- `MeetingSession` (next/active/recent sessions)
- `SimulationRun` (recent evaluations)
- `HumanRiskProfile` (evaluaciones aggregates via fetchHumanRiskDashboardData)

---

## 5. SCAN (Public Scan Tool)

### Screens
- **`/scan`** (public, no auth) — Same ScanPage component
- **`/scan/results/[shareToken]`** — Shared scan results

### What Actually Works

**Public scan pipeline (REAL):**
- 3-phase UI: Input → Analyzing (SSE progress) → Results
- InputPhase: URL input + Cloudflare Turnstile captcha
- AnalyzingPhase: Calls `POST /api/public/scan/analyze`, displays 4-step progress (connecting, reading, identifying, analyzing)
- ResultsPhase: Shows company name, industry, vulnerability score, process list, risk breakdown
- Backend: web-crawler.ts crawls site → analyze.ts sends to LLM (GLM/Claude) → returns ScanAnalysis
- Rate limiting by IP, Turnstile verification
- Creates scan session in DB for tracking
- Share functionality via `POST /api/public/scan/share`
- **Verdict: FULLY FUNCTIONAL — the lead generation / public demo tool**

### Types
- `ScanResult`: companyName, industry, vulnerabilityScore, summary, processes[], highestRiskProcess, sipoc?
- `ScanProcess`: id, name, description, riskLevel
- `ScanRisk`: title, severity, description

---

## 6. ONBOARDING

### Screens
- **`/onboarding`** — 4-step wizard (auth required, redirects if complete)

### What Actually Works

**Step 1: Account (REAL):**
- Name + avatar upload
- Calls `authClient.updateUser({ name })`
- **Verdict: WORKS — updates user profile**

**Step 2: Company (REAL):**
- Form: company name, industry (12 options), company size, evaluation target, concern process (optional)
- Calls `PUT /api/organization/profile` with all fields
- **Verdict: WORKS — saves org profile data**

**Step 3: First Value (REAL):**
- 3 action cards: Start AI Interview, Explore Dashboard, Document Process
- Each card navigates to the corresponding module
- **Verdict: WORKS — navigation/orientation step**

**Step 4: Setup Complete (REAL):**
- Calls `authClient.updateUser({ onboardingComplete: true })`
- Redirects to home
- **Verdict: WORKS — marks onboarding done**

### Data Written
- `User.name`, `User.onboardingComplete`
- Organization profile: companyName, industry, employeeCount, operationsProfile, notes

---

## 7. OTHER MODULES (Supporting)

### Settings
- Account settings: name, email, password, avatar, language, 2FA, passkeys, connected accounts, active sessions, danger zone (delete)
- Organization settings: general, members, billing, AI config, danger zone
- **Verdict: FULLY FUNCTIONAL — standard SaaS settings**

### Organizations
- Create organization, organization select, invitation handling
- **Verdict: FULLY FUNCTIONAL**

### Payments
- Stripe integration: pricing table, checkout, customer portal, trial, active plan, usage dashboard
- Credit-based system (session credits)
- **Verdict: FUNCTIONAL — Stripe/Lemonsqueezy integration present**

### Admin
- Platform overview, user list, organization list/detail, org AI config
- **Verdict: FUNCTIONAL — admin CRUD**

### Collaboration (F3-01)
- Process presence (who's viewing), locks (edit locking), comments, activity log
- Hooks: use-comments, use-lock, use-presence
- Backend: full CRUD procedures in `packages/api/modules/collaboration/`
- **Verdict: FULLY FUNCTIONAL — real collaborative editing**

### Notifications
- Bell dropdown, unread count, mark read/all-read, archive, preferences
- **Verdict: FUNCTIONAL**

---

## SUMMARY TABLE

| Module | Status | Functional Depth | UI Shell? |
|--------|--------|-----------------|-----------|
| Descubrir/Scan | REAL | Deep — crawl + LLM + SSE streaming | No |
| Descubrir/Interview | REAL | Deep — SIPOC-driven AI chat + BPMN generation | No |
| Descubrir/Live | REAL | Deep — video bot + transcript + 5 deliverables | No |
| Procesos | REAL | Very Deep — BPMN editor, RACI, risks, procedures, versions, collaboration | No |
| Evaluaciones | REAL | Deep — template catalog + simulation runner + analytics dashboard + progress | No |
| Panorama | REAL | Medium — cross-module dashboard with live data | No |
| Scan (Public) | REAL | Medium — lead gen scan pipeline | No |
| Onboarding | REAL | Light — 4-step wizard writing real data | No |
| Settings | REAL | Standard — full account/org settings | No |
| Payments | REAL | Standard — Stripe integration | No |
| Collaboration | REAL | Medium — presence, locks, comments | No |

### KEY FINDING: **Nothing is a shell.** Every module has real backend logic, real DB reads/writes, and real AI integrations. The app is genuinely functional end-to-end.

---

## API ENDPOINT INVENTORY (100+ routes)

### Sessions / Discovery
- `POST /api/sessions` — create session (live, AI_INTERVIEW, scan)
- `GET /api/sessions` — list sessions
- `POST /api/sessions/interview/[id]/chat` — AI interview chat
- `POST /api/sessions/interview/[id]/complete` — finish interview
- `GET /api/sessions/interview/[id]/status` — resume interview
- `POST /api/sessions/[id]/end` — end live session
- `GET /api/sessions/[id]/diagram` — get diagram
- `POST /api/sessions/[id]/nodes` — manage nodes
- `POST /api/sessions/[id]/export` — export session
- `POST /api/sessions/[id]/share` — share session
- `POST /api/sessions/prepare-invitation` — prepare invite
- `POST /api/sessions/send-invitation` — send invite

### Processes
- `GET/PATCH /api/processes/[id]` — process CRUD
- `GET/POST /api/processes/[id]/risks` — risk management
- `GET/POST /api/processes/[id]/raci` — RACI management
- `POST /api/processes/[id]/consolidate` — version consolidation
- `POST /api/processes/[id]/context-chat` — AI context chat
- `GET/POST /api/processes/[id]/intelligence` — process intelligence
- `POST /api/processes/[id]/procedures/generate` — generate procedures
- `POST /api/processes/[id]/repair` — repair BPMN
- `POST /api/processes/[id]/export-book` — full export
- `GET /api/processes/tree` — architecture tree

### Evaluaciones
- `POST /api/intake/evaluacion/[token]` — external evaluation
- Various run/respond/complete endpoints

### Public
- `POST /api/public/scan/analyze` — public scan (SSE)
- `POST /api/public/scan/share` — share scan result
- `GET /api/public/risks/[shareToken]` — shared risks view
- `GET /api/public/intelligence/[shareToken]` — shared intelligence

### Organization
- `PUT /api/organization/profile` — update org profile
- `GET /api/organization/risks` — org risks

### Other
- `POST /api/company-brain` — company AI chatbot
- `GET /api/company-brain/history` — chat history
- `POST /api/deliverables/[type]` — generate deliverables
- `POST /api/evaluation/export-report` — export eval report
- tRPC via `[[...rest]]` catch-all for processes, organizations, payments, notifications, collaboration, documents, AI, admin, users modules
