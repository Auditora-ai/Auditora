# AUDITORA.AI — LANDING PAGE REDESIGN PLAN
## "From Generic SaaS Template to Conversion Machine"

---

## MARKET ANALYSIS

**Target Audience (Primary):**
- Management consultants at boutique/mid-size firms (1-50 consultants)
- Internal audit teams at mid-market companies (100-5000 employees)
- Operations directors / COOs seeking process optimization
- Risk & compliance officers
- Continuous improvement managers (Lean Six Sigma)

**Geographic Focus:** English + Spanish speaking markets (US, UK, Mexico, Spain, Colombia, LATAM)

**Buying Motivation (Jobs to Be Done):**
1. "I need to deliver a process audit faster than my competitors" — SPEED
2. "I need to prove my team can handle operational risks" — CREDIBILITY
3. "I need to evaluate if my people make the right decisions under pressure" — SIMULATIONS (unique)
4. "I need to standardize procedures without spending months writing SOPs" — PROCEDURES
5. "I need a single platform instead of Visio + Excel + Word + SharePoint" — CONSOLIDATION

**Competitive Landscape:**
- Process mining tools (Celonis, Minit) — require event logs, technical setup
- BPM tools (Bizagi, Signavio) — diagramming only, no AI intelligence
- AI chat tools (ChatGPT, Claude) — no methodology, no structure
- Consulting frameworks (manual) — weeks of work, inconsistent output
- **Auditora's unique position:** AI-powered + methodology-grounded + full engagement lifecycle

---

## PROPOSITION ARCHITECTURE

### Current (Weak):
"Process discovery and analysis with proven methodology" — feature-focused, generic, no urgency

### New (Strong):
**Headline:** "Turn any organization into a living process map — in minutes, not months"
**Subtitle:** "AI-powered discovery, risk analysis, Harvard-style simulations, and procedure generation. The complete consulting engagement platform."

### Value Pillars (the 6-step flow, reframed as outcomes):
1. **DISCOVER** → "Scan a company website. Get a SIPOC map and risk assessment in 2 minutes."
2. **MAP** → "Transform conversations into interactive BPMN 2.0 diagrams in real time."
3. **ASSESS** → "FMEA matrix, heat maps, and risk registers — automated, not spreadsheet-driven."
4. **DOCUMENT** → "Generate versioned SOPs from your process documentation. AI writes, you approve."
5. **SIMULATE** → "Test your team's decision-making with AI-generated Harvard-style scenarios."
6. **EVALUATE** → "Measure human risk across your organization with scored simulations."

---

## PAGE STRUCTURE (New Architecture)

```
┌─────────────────────────────────────────────┐
│ NAVBAR (transparent on dark, glass on scroll)│
├─────────────────────────────────────────────┤
│ HERO                                        │
│ - Outcome headline with animated typing      │
│ - Live URL input (functional free scan)     │
│ - Product screenshot / animated mockup      │
│ - Social proof micro-bar (user count badge) │
├─────────────────────────────────────────────┤
│ LOGOS / TRUST BAR                           │
│ - Framework badges: SIPOC, BPMN 2.0, FMEA  │
│ - "Built on recognized standards"           │
├─────────────────────────────────────────────┤
│ THE PROBLEM (Why now)                       │
│ - 3 pain points with stats/impact           │
│ - Animated counter: "$X billion lost to     │
│   undocumented processes annually"          │
├─────────────────────────────────────────────┤
│ PRODUCT DEMO (Interactive/Visual)           │
│ - Animated walkthrough of the 6-step flow   │
│ - Each step reveals on scroll               │
│ - Step 5 (Simulations) is the STAR moment   │
├─────────────────────────────────────────────┤
│ DIFFERENTIATOR: SIMULATIONS (The Wow)       │
│ - "Test your team before a crisis tests you"│
│ - Visual: decision scenario card animation  │
│ - Score dashboard preview                   │
│ - This is what NO competitor has            │
├─────────────────────────────────────────────┤
│ FEATURES BENTO GRID                         │
│ - 6 cards with icons, one per module        │
│ - Hover reveals detail                      │
├─────────────────────────────────────────────┤
│ HOW IT WORKS (3 steps)                      │
│ - 1. Enter URL → 2. AI analyzes → 3. Get   │
│   SIPOC + risks + BPMN                      │
│ - Repeatable, no-signup free tool           │
├─────────────────────────────────────────────┤
│ USE CASES (Who it's for)                    │
│ - 3 tabs: Consultant, Auditor, COO          │
│ - Each with specific workflow description   │
├─────────────────────────────────────────────┤
│ PRICING (4 tiers, existing)                 │
├─────────────────────────────────────────────┤
│ FAQ                                         │
├─────────────────────────────────────────────┤
│ FINAL CTA                                   │
│ - "Start your first process scan free"      │
│ - URL input again + "No signup required"    │
├─────────────────────────────────────────────┤
│ FOOTER                                      │
└─────────────────────────────────────────────┘
```

---

## DESIGN DIRECTION

**Vibe:** Dark, premium, authoritative. Think Vercel × Linear × Stripe — not generic SaaS template.

**Color Strategy:**
- Background: Deep navy (#0A1428) → slate-900 gradient
- Primary accent: Teal (#00E5C0) — used sparingly for CTAs and key highlights
- Text: White hierarchy (100 → 80 → 60 opacity)
- Cards: Glass morphism (white/5, white/10 borders, backdrop-blur)
- Risk/danger moments: Amber (#D97706) for urgency
- Success: Green (#16A34A) for positive outcomes

**Typography:**
- Display: Inter 700-800, -0.02em tracking (already configured)
- Body: Geist 300-400
- Headlines: Large (48-72px mobile, 64-96px desktop)

**Animation Philosophy (GSAP):**
- Scroll-triggered reveals (sections fade up on scroll)
- Staggered element entrances (0.1s between items)
- Product mockup parallax on hero
- Counter animations for stats
- Smooth, professional — no bouncy/cartoon effects
- Each section has ONE signature animation moment

---

## IMPLEMENTATION PLAN

### Phase 1: Core Structure (Components to create/rewrite)
1. `HeroSection.tsx` — Complete rewrite with new copy, working URL input, animated mockup
2. `TrustBar.tsx` — Framework badges (SIPOC, BPMN 2.0, FMEA, ISO 31000)
3. `ProblemSection.tsx` — Rewrite with stronger pain points and animated stats
4. `ProductFlow.tsx` — NEW: Animated 6-step product walkthrough
5. `SimulationShowcase.tsx` — NEW: The differentiator section (star moment)
6. `FeaturesBento.tsx` — Rewrite bento grid with 6 modules
7. `HowItWorks.tsx` — Rewrite as 3-step free scan walkthrough
8. `UseCases.tsx` — NEW: Tabbed use cases (Consultant/Auditor/COO)
9. `PricingSection.tsx` — Keep existing, minor copy updates
10. `FaqSection.tsx` — Update with new questions about simulations, procedures
11. `FinalCta.tsx` — Rewrite with stronger CTA
12. `page.tsx` — Reorder sections

### Phase 2: i18n
- Update `packages/i18n/translations/en/marketing.json`
- Update `packages/i18n/translations/es/marketing.json`
- Keep de/fr for now (minor updates only)

### Phase 3: Polish
- GSAP animations for each section
- Mobile responsiveness
- Performance optimization
- Deploy and test

---

## KEY COPY (English)

**Hero:**
- Badge: "The AI-powered consulting platform"
- Headline: "Turn any organization into a living process map"
- Subtitle: "Discover processes, assess risks, generate procedures, and simulate decisions — all powered by AI and grounded in proven methodology."
- CTA: "Scan any company free" (with URL input)
- Subtext: "No signup required. Enter a URL and get a SIPOC map + risk assessment in 2 minutes."

**Simulation Showcase:**
- Headline: "Test your team before a crisis tests them"
- Subtitle: "AI generates Harvard-style decision scenarios from your actual processes and risks. Your people make decisions. You measure their readiness."
- Card examples: "A supplier delivers contaminated raw material. As the COO, do you: A) Stop the production line immediately, B) Quarantine the batch and switch to backup supplier, C) ..."

**Problem:**
- "73% of organizations lack documented processes for critical operations" (Gartner)
- "Consultants spend 40% of engagement time on process discovery alone"
- "Manual process mapping takes 3-6 weeks. Auditora does it in minutes."

---

## FILES TO MODIFY/CREATE

### Create:
- `apps/marketing/modules/home/components/TrustBar.tsx`
- `apps/marketing/modules/home/components/ProductFlow.tsx`
- `apps/marketing/modules/home/components/SimulationShowcase.tsx`
- `apps/marketing/modules/home/components/UseCases.tsx`
- `apps/marketing/modules/home/components/HowItWorks.tsx`
- `apps/marketing/modules/home/components/FinalCta.tsx`

### Rewrite:
- `apps/marketing/modules/home/components/HeroSection.tsx`
- `apps/marketing/modules/home/components/ProblemSection.tsx`
- `apps/marketing/app/[locale]/(home)/page.tsx`

### Keep (minor updates):
- `apps/marketing/modules/home/components/SolutionSection.tsx`
- `apps/marketing/modules/home/components/CredibilitySection.tsx`
- `apps/marketing/modules/home/components/PricingSection.tsx`
- `apps/marketing/modules/home/components/FaqSection.tsx`
- `apps/marketing/modules/home/components/SocialProofSection.tsx`

### Delete (no longer needed):
- `apps/marketing/modules/home/components/LogoBar.tsx`
- `apps/marketing/modules/home/components/MetricsSection.tsx`
- `apps/marketing/modules/home/components/ProductShowcaseSection.tsx`
- `apps/marketing/modules/home/components/WorkflowSection.tsx`
- `apps/marketing/modules/home/components/BentoFeatureSection.tsx`
- `apps/marketing/modules/home/components/DeepDiveSection.tsx`
- `apps/marketing/modules/home/components/CtaSection.tsx`

### Update i18n:
- `packages/i18n/translations/en/marketing.json`
- `packages/i18n/translations/es/marketing.json`
