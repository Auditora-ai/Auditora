# MODULE PERFECTION: PANORAMA (Command Center Dashboard)

**Module:** Panorama — Organization root dashboard  
**Route:** `/{organizationSlug}/` → `[organizationSlug]/page.tsx`  
**Component:** `@command-center/components/RiskDashboard`  
**Date:** 2026-04-03  
**PM Agent:** #03

---

## A) VISION CHECK — What PRODUCT_VISION.md Requires

From the sidebar structure definition:
```
VER
├── Panorama            (Dashboard consolidado)
│                       Score global, procesos vulnerables, próximos pasos
│                       Accionable: "clic para ver los detalles"
```

From the module mapping:
```
| Panorama | command-center/ | Refactor: simplificar a dashboard accionable |
```

### Vision Requirements:
1. **Score global clearly displayed** — A prominent organizational health score
2. **Procesos vulnerables highlighted** — At-risk processes visually flagged  
3. **Próximos pasos (Next Steps)** — AI-generated actionable recommendations
4. **Accionable: drill-down** — Every element clickable, links to detail views
5. **Consolidated view** — Single screen showing evaluation + process + risk data

### What EXISTS vs What's MISSING:

| Requirement | Status | Notes |
|---|---|---|
| KPI cards (org score, evals, members, completion rate) | ✅ Built | Lines 308-391 of RiskDashboard.tsx |
| Dimension progress bars (alignment, control, criterio) | ✅ Built | Lines 393-461 |
| Score trend sparkline | ✅ Built | Lines 429-459 |
| Maturity score ring | ✅ Built | Lines 154-192 |
| Top risks list | ✅ Built | Lines 226-291 |
| Next session card | ✅ Built | Lines 465-499 |
| Recent activity feed | ✅ Built | Lines 501-539 |
| Empty state | ✅ Built | Lines 131-147 |
| **Score global prominently displayed** | ⚠️ PARTIAL | Maturity ring exists but is small and buried. The org evaluation score only appears IF evaluaciones data exists. No hero-level score. |
| **Vulnerable processes highlighted** | ❌ MISSING | No section showing "your weakest processes" — only top risks (which are risk records, not process-level weakness) |
| **"Next steps" recommendations** | ❌ MISSING | No AI-generated recommendations like "Run evaluations on Compras" or "Your Procurement process needs attention" |
| **Every element clickable (drill-down)** | ⚠️ PARTIAL | Evaluaciones cards link to evaluaciones page ✅. Risk cards link to /deliverables/risks which REDIRECTS to /processes ⚠️. Quick actions also link to dead deliverables routes ⚠️ |
| **Descubrir in sidebar** | ❌ MISSING | NavBar has only 3 flow items (Procesos→Evaluaciones→Panorama). Descubrir section is completely absent from sidebar. |

---

## B) DESKTOP AUDIT — Component-by-Component

### File: `apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx`
- **Server component** — good. Fetches data in parallel with `Promise.all` ✅
- Maturity score calculation at lines 128-138 only considers `processDocumentation * 0.3 + riskCoverage * 0.3 = max 60%`. Missing evaluation weight (should be 40% from evaluations). Score will never exceed 60 even with full evaluation data.
- `formatRelativeDate` helper is hardcoded in Spanish ("Hoy", "Ayer", "Hace X días") — not using i18n ❌

### File: `apps/saas/modules/command-center/components/RiskDashboard.tsx` (558 lines)
- **"use client"** with `useRouter`, `useState`, `useTranslations` — needed for wizard toggle
- Header button "Nueva Sesión" has proper mobile touch target (`min-h-[44px]`) ✅
- Full-width on mobile (`w-full`) for CTA button ✅

**Layout Structure:**
```
Header (title + new session button)
└── if empty → EmptyState
└── if data:
    ├── 3-column grid (lg:grid-cols-3)
    │   ├── Left col (1/3): Maturity Ring + Quick Actions
    │   └── Right col (2/3): Top Risks
    ├── Evaluaciones Summary (4 KPI cards + dimension bars + sparkline)
    ├── Next Session card (conditional)
    └── Recent Activity feed (conditional)
```

**Issues Found:**

1. **Quick Actions link to dead routes:**
   - Line 197: `${basePath}/deliverables/risks` → REDIRECTS to /processes
   - Line 215: `${basePath}/deliverables` → REDIRECTS to /processes  
   - Line 242: Each risk card → `${basePath}/deliverables/risks` → REDIRECTS

2. **"View Deliverables" label is stale:**
   - Line 220: `{t("viewDeliverables")}` — translation says "Ver entregables" but deliverables no longer exist as a concept. Should be removed or repurposed.

3. **No glassmorphism cards** — all cards use plain `border border-border bg-background`. The marketing site uses glassmorphism with `backdrop-blur`, semi-transparent backgrounds. The SaaS dashboard feels flat by comparison.

4. **No "before/after" metrics visible on Panorama** — The `fetchProgressData` function exists in dashboard-queries.ts but is NOT used by the Panorama page. Progress data is only in the evaluaciones tab.

5. **Header CTA mismatch** — The "Nueva Sesión" button opens a SessionWizard for meeting sessions, which is a "Descubrir" action. On the Panorama (VER section), the primary CTA should be something like "Generate Evaluation" or "View Report", not "New Session."

6. **Activity feed is session-only** — Recent activity (lines 150-155 in page.tsx) only shows ended meeting sessions. Doesn't show evaluation completions, process updates, or risk changes.

### File: `apps/saas/modules/shared/components/RiskMaturityRing.tsx` (119 lines)
- Hardcoded `text-slate-*` colors instead of using semantic tokens — breaks light theme ❌
- Uses `text-slate-700` for background ring, `text-slate-500/600` for labels — should use `text-muted-foreground`, etc.

### File: `apps/saas/modules/shared/components/EmptyState.tsx` (104 lines)
- Clean component, uses semantic colors ✅
- Button variant types include "primary" but Shadcn UI typically uses "default" — may cause runtime warning

---

## C) MOBILE AUDIT

### Touch Targets
- Header "Nueva Sesión" button: `min-h-[44px]` ✅ Good
- Quick action links: `p-3` (~48px height) ✅ Good
- Risk cards: `p-4` ✅ Good
- Evaluaciones KPI cards: `p-4` ✅ Good
- "View details" button on Next Session: `px-3 py-1.5` → ~28px height ❌ TOO SMALL (needs min 44px)
- Activity feed items: `px-4 py-3` → ~44px ✅ Borderline acceptable

### Responsive Layout
- Main grid: `grid-cols-1 gap-6 lg:grid-cols-3` ✅ Collapses to single column
- Evaluaciones grid: `grid-cols-1 gap-4 md:grid-cols-4` ✅ Stacks on mobile
- Quick actions: `flex gap-2 overflow-x-auto pb-2 md:flex-col` ✅ Horizontal scroll on mobile

### Overflow Issues
- Main container: `overflow-auto p-4 pb-24 md:p-6 md:pb-6` ✅ Extra bottom padding for mobile bottom bar
- Quick actions: `overflow-x-auto` ✅ Handles overflow

### Mobile Bottom Bar
- Has 3 tabs: Procesos, Evaluaciones, Panorama ✅
- Touch targets: `py-2` + icon + text ≈ 48px ✅
- Missing Descubrir tab (matches desktop issue) ❌

### Missing: Mobile scroll indicator
- When evaluaciones data is long, there's no visual cue that content extends below. No gradient fade or scroll indicator.

---

## D) QUALITY AUDIT — Design Consistency

### Dark Theme Issues (CRITICAL)
The RiskDashboard has **6 hardcoded light-mode-only colors** that break in dark mode:

| Line | Current | Issue |
|------|---------|-------|
| 245 | `border-red-100` | Nearly white border in dark mode |
| 247 | `border-amber-100` | Nearly white border in dark mode |
| 258 | `bg-red-100 text-red-800` | Bright white blob for risk score badge |
| 261 | `bg-amber-100 text-amber-800` | Same — light bg on dark canvas |
| 262 | `bg-yellow-100 text-yellow-800` | Same |
| 469 | `bg-blue-50 text-blue-600` | MicIcon container — bright white in dark mode |

The RiskMaturityRing.tsx also has hardcoded `text-slate-500/600/700` that won't adapt to light theme.

### Animations
- Has entrance animations: `animate-in fade-in slide-in-from-bottom-2 duration-500` ✅
- Staggered delays: `delay-100`, `delay-150`, `delay-200`, `delay-300` ✅
- Dimension bars: `transition-all duration-1000 ease-out` ✅
- Missing: No hover animations on cards. No skeleton loading states. No shimmer effects.

### Glassmorphism / Visual Polish
- **Marketing site standard:** Uses glassmorphism cards with `backdrop-blur-xl`, `bg-white/5`, gradient borders
- **Panorama current:** Plain `border border-border bg-background` cards — looks generic, not "a su altura de una startup"
- **Missing:** No gradient accents, no glass effects, no subtle shadows, no card elevation hierarchy

### Typography
- Uses `font-display` for title only (header h1) ✅
- KPI numbers use `tabular-nums` ✅
- Some label text at `text-[10px]` and `text-[11px]` — may be too small on some mobile devices
- Score trend month labels at `text-[9px]` — definitely too small

### Color Consistency
- Brand teal `#00E5C0` is used in sidebar flow steps but NOT in Panorama cards at all
- Panorama uses a mix of `bg-primary/10` (teal), `bg-blue-500/10`, `bg-green-500/10`, `bg-amber-500/10` — inconsistent palette
- Risk score colors (red/amber/yellow) are reasonable but lack dark mode support

---

## E) FIX LIST — Prioritized

### Priority 1: Critical Bugs (Broken UX)

**Fix #1 — Dead Links in Quick Actions** [Effort: S]
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- **Line 197:** Change `${basePath}/deliverables/risks` → `${basePath}/processes` (risks are now in process workspace)
- **Line 215:** Remove the "View Deliverables" quick action entirely (deliverables module no longer exists as concept)
- **Line 242:** Change each risk card `href` from `${basePath}/deliverables/risks` → `${basePath}/processes` (or better: link to the specific process that owns the risk)
- **Translation:** Remove `viewDeliverables` key or repurpose. Add `viewEvaluaciones` key.
- **Replace the "View Deliverables" quick action with "View Evaluaciones"** linking to `${basePath}/evaluaciones`

**Fix #2 — Dark Mode Colors** [Effort: S]
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- Line 245: `border-red-100` → `border-red-100 dark:border-red-900/30`
- Line 247: `border-amber-100` → `border-amber-100 dark:border-amber-900/30`
- Line 258: `bg-red-100 text-red-800` → `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`
- Line 261: `bg-amber-100 text-amber-800` → `bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400`
- Line 262: `bg-yellow-100 text-yellow-800` → `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`
- Line 469: `bg-blue-50 text-blue-600` → `bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400`

**Fix #3 — Hardcoded Spanish in page.tsx** [Effort: S]
- **File:** `apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx`
- Lines 204-207: `formatRelativeDate` uses hardcoded "Hoy", "Ayer", "Hace X días"
- Move to translations: add keys `common.today`, `common.yesterday`, `common.daysAgo` 
- Or pass locale to `Intl.RelativeTimeFormat`

### Priority 2: Vision Gaps (Missing Features)

**Fix #4 — Add "Vulnerable Processes" Section** [Effort: M]
- **File:** `apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx`
- Add a new query: fetch processes with lowest evaluation scores from `fetchHumanRiskDashboardData` → use `processHeatmap` data (already queried but not passed to component)
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- Add new prop: `vulnerableProcesses: Array<{ name: string; avgScore: number; processId: string }>`
- Add new section between Top Risks and Evaluaciones: "Procesos Vulnerables" — cards showing the 3-5 processes with lowest alignment scores, each clickable to go to the process detail page
- Use heatmap color coding (red < 50, amber 50-70, green > 70)

**Fix #5 — Add "Next Steps" Recommendations** [Effort: M]
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- Add a new section after the evaluaciones summary: "Próximos Pasos Recomendados"
- Logic (computed server-side or client-side from existing data):
  - If `processCount === 0`: "Capture your first process — start a chat interview or schedule a live session"
  - If `processCount > 0 && evaluaciones === null`: "You have processes documented — create your first evaluation to test your team"
  - If `evaluaciones && evaluaciones.orgAvgScore < 60`: "Your team alignment is below 60%. Focus evaluations on [lowest scoring process]"
  - If `evaluaciones && evaluaciones.completionRate < 50`: "Only {rate}% of evaluations are completed. Send reminders to your team."
  - If everything healthy: "Your team is performing well. Consider adding new processes to evaluate."
- Each recommendation should be a clickable card leading to the relevant action
- **Translations:** Add `dashboard.riskDashboard.nextSteps.*` keys

**Fix #6 — Global Score Hero** [Effort: S]
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- The maturity ring at lines 154-192 should be elevated to a hero-level display
- Replace the current small ring + 3 stats mini layout with a larger, more prominent hero:
  - Center the score in a large radial display (use `size="lg"` — need to add this variant to RiskMaturityRing)
  - Below it: one-line summary like "Tu operación está en {score}% de madurez"
  - Then the 3 mini stats (risks, processes, coverage) below
- This makes the "Score global" the first thing the CEO sees

**Fix #7 — Maturity Score Calculation Fix** [Effort: S]
- **File:** `apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx`
- Lines 132-138: Current formula: `(processDocumentation * 0.3 + riskCoverage * 0.3) * 100` → max 60%
- Should include evaluation data: `(processDocumentation * 0.25 + riskCoverage * 0.25 + evaluationScore * 0.5) * 100`
- The evaluation score is the `evaluacionesData.orgAvgScore / 100` if available, else 0
- This gives a true 0-100 maturity that weights evaluations (the core product) at 50%

### Priority 3: UX Polish

**Fix #8 — Update Header CTA** [Effort: S]
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- Lines 118-126: Change from single "Nueva Sesión" button to a split action:
  - Primary: "Crear Evaluación" → links to `${basePath}/evaluaciones` (the money action)
  - Secondary (outline): "Nueva Sesión" → opens wizard (capture action)
- This aligns the Panorama CTA with the EVALUAR pillar, not CAPTURAR

**Fix #9 — Glassmorphism Card Upgrade** [Effort: M]
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- Replace plain `rounded-xl border border-border bg-background p-6` cards with:
  ```
  rounded-xl border border-white/10 bg-card/80 backdrop-blur-sm shadow-sm p-6
  dark:border-white/5 dark:bg-card/60 dark:backdrop-blur-xl
  ```
- Apply to: Maturity ring card, risk cards, evaluaciones cards, next session card, activity items
- Add subtle gradient accent to the hero maturity card:
  ```
  bg-gradient-to-br from-primary/5 to-transparent
  ```

**Fix #10 — Enrich Activity Feed** [Effort: M]
- **File:** `apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx`
- Lines 99-113: Currently only shows ended meeting sessions
- Add query for recent evaluation completions (SimulationRun with status COMPLETED, last 5)
- Add query for recently updated processes
- Merge and sort all activity types by date
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- Add new activity types: `evaluation_completed`, `process_updated`
- Show icons per type: clipboard for evaluations, workflow for processes, mic for sessions

**Fix #11 — "View Details" Touch Target** [Effort: S]
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- Line 493: `px-3 py-1.5` is ~28px tall — below 44px minimum
- Change to: `px-4 py-2.5 min-h-[44px]` or make the entire Next Session card clickable

**Fix #12 — Minimum Font Sizes** [Effort: S]
- **File:** `apps/saas/modules/command-center/components/RiskDashboard.tsx`
- Line 451-452: `text-[9px]` month labels → change to `text-[11px]`
- Lines 164, 172, 187-188: `text-[10px]` labels → change to `text-[11px]` (acceptable minimum)

**Fix #13 — RiskMaturityRing Light Theme Fix** [Effort: S]
- **File:** `apps/saas/modules/shared/components/RiskMaturityRing.tsx`
- Line 62: `className="text-slate-700"` → `className="text-muted-foreground/20"`  
- Line 83: `text-xs text-slate-500` → `text-xs text-muted-foreground`
- Line 84: `text-[10px] text-slate-600` → `text-[10px] text-muted-foreground`
- Line 89: `text-slate-500` → `text-muted-foreground`
- Line 96: `text-xs font-semibold tabular-nums` — keep inline style for score color ✅

### Priority 4: Sidebar Issue (Cross-Module)

**Fix #14 — Add Descubrir to NavBar** [Effort: M]
- **File:** `apps/saas/modules/shared/components/NavBar.tsx`
- **File:** `apps/saas/modules/shared/components/MobileBottomBar.tsx`
- The Vision requires 4 sidebar sections: Descubrir → Procesos → Evaluaciones → Panorama
- Currently only 3 items exist (Procesos, Evaluaciones, Panorama)
- Add Descubrir as flowStep 1:
  ```typescript
  {
    id: "descubrir",
    label: t("app.menu.sessions"), // or add new "app.menu.descubrir" key
    href: `${basePath}/sessions`,
    icon: SearchIcon, // or CompassIcon
    isActive: pathname.startsWith(`${basePath}/sessions`),
    hidden: !hasOrg,
    section: "flow",
    flowStep: 1,
    flowCompleted: hasArchitecture,
  }
  ```
- Update flowStep numbers: Descubrir=1, Procesos=2, Evaluaciones=3, Panorama=4
- Add translation key: `"descubrir": "Descubrir"` in es/saas.json, `"discover": "Discover"` in en/saas.json
- Add to MobileBottomBar primaryTabs (may need to show 4 tabs or restructure)
- **NOTE:** This is a cross-module fix that affects all pages. May warrant its own issue.

---

## F) EFFORT SUMMARY

| Fix # | Description | Effort | Priority |
|-------|-------------|--------|----------|
| #1 | Dead links in quick actions | S (30min) | P1 — Critical |
| #2 | Dark mode colors | S (30min) | P1 — Critical |
| #3 | Hardcoded Spanish | S (30min) | P1 — Critical |
| #4 | Vulnerable processes section | M (2h) | P2 — Vision |
| #5 | Next steps recommendations | M (2h) | P2 — Vision |
| #6 | Global score hero | S (30min) | P2 — Vision |
| #7 | Maturity score calculation | S (20min) | P2 — Vision |
| #8 | Update header CTA | S (30min) | P3 — Polish |
| #9 | Glassmorphism cards | M (2h) | P3 — Polish |
| #10 | Enrich activity feed | M (2h) | P3 — Polish |
| #11 | View Details touch target | S (10min) | P3 — Polish |
| #12 | Minimum font sizes | S (10min) | P3 — Polish |
| #13 | RiskMaturityRing theme fix | S (20min) | P3 — Polish |
| #14 | Add Descubrir to sidebar | M (2h) | P4 — Cross-module |

**Total estimated effort:** ~12 hours across all fixes

**Recommended batch for Developer Agent #04:**
- **Batch 1 (P1, ~1.5h):** Fixes #1, #2, #3 — critical bugs, ship immediately
- **Batch 2 (P2, ~5h):** Fixes #4, #5, #6, #7 — vision alignment, complete the dashboard
- **Batch 3 (P3, ~5h):** Fixes #8, #9, #10, #11, #12, #13 — polish to marketing-site quality
- **Batch 4 (P4, ~2h):** Fix #14 — sidebar restructure (coordinate with other module specs)

---

## Files Referenced

| File | Role |
|------|------|
| `apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx` | Server page — data fetching |
| `apps/saas/modules/command-center/components/RiskDashboard.tsx` | Main dashboard client component |
| `apps/saas/modules/shared/components/RiskMaturityRing.tsx` | Score ring widget |
| `apps/saas/modules/shared/components/EmptyState.tsx` | Empty state component |
| `apps/saas/modules/shared/components/NavBar.tsx` | Desktop sidebar navigation |
| `apps/saas/modules/shared/components/MobileBottomBar.tsx` | Mobile bottom tab bar |
| `apps/saas/modules/evaluaciones/lib/dashboard-queries.ts` | Dashboard data queries |
| `apps/saas/modules/command-center/components/SessionWizard.tsx` | Session creation wizard |
| `packages/i18n/translations/es/saas.json` | Spanish translations |
| `packages/i18n/translations/en/saas.json` | English translations |
| `tooling/tailwind/theme.css` | Design tokens / theme |
| `apps/saas/app/globals.css` | Global styles |
