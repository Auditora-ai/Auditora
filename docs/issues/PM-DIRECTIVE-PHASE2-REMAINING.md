# PM Directive: Phase 2 Remaining Work (#17, #18)

**Created:** 2026-04-03
**PM:** Agent #03
**For:** Developer Agent #04
**Priority:** Ship these two to complete Phase 2

---

## ISSUE #17 — Before/After Metrics ("Progress" View)

### What Exists
- `ScoreTrendChart.tsx` — area chart showing score trend over time (monthly)
- `HeroScoreCard.tsx` — single score ring display
- `dashboard-queries.ts` — has `scoreTrend` data (monthly scores)
- Panorama dashboard with 4 KPI cards already integrated

### What to Build
A **"Progress" tab or section** in the Evaluaciones hub (`/evaluaciones`) that shows evaluation impact over time.

### Implementation Steps

1. **Create `ProgressView.tsx`** in `apps/saas/modules/evaluaciones/components/`
   ```
   - Comparison cards per process: "First Score → Latest Score" with delta indicator
   - Color: green if improved (↑), red if declined (↓), gray if no change
   - Sort by biggest improvement first (celebrate wins)
   ```

2. **Create `progress-queries.ts`** in `apps/saas/modules/evaluaciones/lib/`
   ```typescript
   // Query: for each process in org, get first and latest evaluation scores
   // Returns: { processId, processName, firstScore, firstDate, latestScore, latestDate, delta }
   // Uses SimulationTemplate + related scores from DB
   ```

3. **Add "Progress" tab** to EvaluacionesTabs (already has Catalog | Risk Dashboard)
   - New tab: `Progreso` / `Progress`
   - Route: `/evaluaciones?tab=progress`

4. **Summary stats at top:**
   - "Average improvement: +X%"
   - "Processes evaluated: N"
   - "Team members assessed: N"

5. **i18n:** Add keys to `saas.json` for en/es/fr/de under `evaluaciones.progress.*`

### Acceptance Criteria
- [ ] Progress tab visible in evaluaciones
- [ ] Shows first vs latest score comparison per process
- [ ] Delta indicators with color coding
- [ ] Works with 0 evaluations (empty state)
- [ ] i18n for all 4 locales

---

## ISSUE #18 — Exportable Reports (PDF)

### What Exists
- `lib/export/human-risk-report-generator.ts` — generates HTML report for Human Risk Dashboard
- `lib/export/pdf-generator.ts` — generates HTML report for process documentation (BPMN, RACI)
- `app/api/evaluation/export-report/route.ts` — API endpoint returning HTML report
- `ExportReportButton` references exist in codebase

### What to Build
**Branded PDF export** for evaluation results — suitable for board presentations.

### Implementation Steps

1. **Enhance `human-risk-report-generator.ts`** or create `evaluation-report-generator.ts`:
   ```
   - Auditora.ai branding (logo, colors)
   - Executive summary section (org score, trend, top risks)
   - Per-process breakdown (score, evaluated members, risk alignment)
   - Before/after comparison (if #17 data available)
   - Generated date, org name, confidential watermark
   ```

2. **Use html-to-pdf approach** (puppeteer/playwright or @react-pdf/renderer):
   - Option A: Server-side HTML → PDF using existing HTML generator + puppeteer
   - Option B: Use `@react-pdf/renderer` for direct PDF generation (cleaner, no browser dependency)
   - **Recommend Option A** since HTML generators already exist — just add `Content-Type: application/pdf` endpoint

3. **Create/update API route** at `app/api/evaluation/export-report/route.ts`:
   ```
   - GET ?format=html (existing)
   - GET ?format=pdf (new — renders HTML then converts to PDF)
   ```

4. **Wire button in UI:**
   - Add "Export PDF" button to Panorama dashboard (RiskDashboard)
   - Add "Export PDF" button to Progress view (from #17)
   - Use existing ExportReportButton component pattern

5. **i18n:** Add export-related keys if not present

### Acceptance Criteria
- [ ] PDF downloads from dashboard with one click
- [ ] PDF includes Auditora.ai branding
- [ ] PDF includes executive summary + per-process scores
- [ ] Works when org has evaluation data
- [ ] Graceful handling when no data (disabled button or empty state)

---

## Priority Order
1. **#17 first** — it's simpler and provides data for #18
2. **#18 second** — builds on #17's progress data

## Notes
- BUG-022 and BUG-023 (TS errors) have been FIXED by PM Agent #03 (commit 59cf83a)
- All Phase 2 issues #15, #14, #41 verified as genuinely complete
- No blocking TS errors remain in app code (only node_modules noise)
