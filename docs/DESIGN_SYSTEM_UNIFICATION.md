# Design System Unification Plan

## Problem
Every screen looks like a different app. Inconsistent radius, typography, spacing, and colors.

## Unified Design Tokens (Mobile)

### Border Radius
- Cards: `rounded-2xl` (ALL cards, everywhere)
- Buttons: default from shadcn (rounded-md via luma preset)
- Badges: `rounded-full`
- Inputs: `rounded-xl`
- FAB: `rounded-full`

### Typography Hierarchy
- Page title: `text-xl font-semibold text-foreground` (only 1 per page)
- Section header: `text-sm font-semibold text-foreground uppercase tracking-wide`
- Card title: `text-base font-semibold text-foreground`
- Body: `text-sm text-foreground`
- Secondary: `text-sm text-muted-foreground`
- Caption: `text-xs text-muted-foreground`
- Micro: `text-[10px] text-muted-foreground`

### Spacing
- Page container: `flex flex-col gap-5 pb-24` (pb-24 for bottom bar)
- Between sections: `gap-5`
- Between cards in section: `gap-3`
- Card internal padding: `p-4`
- Section header margin: `mb-3`

### Card Style (unified)
```
rounded-2xl border border-border bg-card p-4 transition-all
hover:shadow-sm active:scale-[0.98]
```

### Section Header (unified)
```
<h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
```

### Score Colors (unified)
- ≥80: `text-green-600 dark:text-green-400`
- ≥60: `text-amber-600 dark:text-amber-400`  
- <60: `text-destructive`

### Status Badge Colors
- DRAFT: `bg-muted text-muted-foreground`
- CAPTURED: `bg-amber-500/10 text-amber-600 dark:text-amber-400`
- DOCUMENTED: `bg-primary/10 text-primary`
- EVALUATED good: `bg-green-500/10 text-green-600 dark:text-green-400`
- EVALUATED bad: `bg-destructive/10 text-destructive`

## Screens to Unify

### 1. HOME (/)
Entry point. Process map + score + quick actions.

### 2. DESCUBRIR (/descubrir)  
3 channel cards + past sessions list.

### 3. INTERVIEW (/descubrir/interview)
Full-screen SIPOC chat with phase indicator.

### 4. PROCESO (/procesos/[id])
Tabs: Resumen | Contexto | SOPs | RACI | Riesgos | Evaluación | Sesiones

### 5. EVALUACIONES (/evaluaciones)
Tabs: Catálogo | Dashboard | Progreso

### 6. PANORAMA (/panorama)
Score + KPIs + alerts + actions + trend.

## Flow Connection (Vision v3)
HOME → tap process → PROCESO (with "Evaluar" CTA)
HOME → FAB "+" → DESCUBRIR → channel → INTERVIEW
HOME → bottom tab → EVALUACIONES
HOME → bottom tab → PANORAMA
PROCESO → "Evaluar equipo" → EVALUACIONES scoped to that process
