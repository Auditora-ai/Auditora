# Design System — Prozea

## Product Context
- **What this is:** AI-powered process elicitation platform that joins video calls, guides consultants with a teleprompter, and auto-diagrams business processes live during the meeting
- **Who it's for:** Independent BPM consultants and small consulting firms (1-5 people)
- **Space/industry:** Business process management, consulting tools, process mining
- **Project type:** Web app with real-time collaboration (3-panel meeting view)

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian meets Luxury/Refined — function-first with premium craft details
- **Decoration level:** Intentional — subtle grain texture on dark surfaces, clean flat on light surfaces. No gradients, no shadows-for-decoration.
- **Mood:** Precision instrument. The product feels like a tool built by someone who understands the craft of process consulting — serious, authoritative, but with enough warmth that it doesn't feel clinical. Think Linear's engineering precision meets the authority of a consulting deliverable.
- **Key design insight:** Dual-temperature UI — dark chrome for the consultant's private view (teleprompter, transcript, controls), light canvas for the shared BPMN diagram. The diagram area must be pristine enough to screenshot and send to a Fortune 500 client.

## Typography
- **Display/Hero:** Instrument Serif — distinctive, refined identity. Serif says "consulting, precision, authority" without feeling corporate. Use for page titles, session names, hero text.
- **Body:** Geist — Vercel's font, excellent at small sizes, clean and contemporary. All body copy, UI labels, navigation, form labels.
- **UI/Labels:** Geist (same as body) — at 12-14px with medium weight for UI controls
- **Data/Tables:** Geist with `font-variant-numeric: tabular-nums` — aligned numbers in analytics, timestamps, node counts
- **Code:** Geist Mono — for BPMN XML preview, technical identifiers
- **Loading:** Google Fonts for Instrument Serif, self-hosted or CDN for Geist (via Vercel)
- **Scale:**
  - `3xl`: 48px / 3rem — page hero (session name on dashboard)
  - `2xl`: 36px / 2.25rem — section headings
  - `xl`: 24px / 1.5rem — teleprompter "Ask Now" question
  - `lg`: 20px / 1.25rem — card titles, panel headers
  - `md`: 16px / 1rem — body text, transcript lines
  - `sm`: 14px / 0.875rem — UI labels, secondary text, table cells
  - `xs`: 12px / 0.75rem — timestamps, status indicators, meta text
  - `2xs`: 10px / 0.625rem — badges, tags, node labels in diagram

## Color
- **Approach:** Restrained — 1 accent + neutrals. Color is rare and meaningful. The BPMN diagram's node colors ARE the color in the product; everything else steps back.

### Light Mode (diagram canvas, shared client view)
- **Primary:** `#2563EB` — confident deep blue. Links, active states, primary buttons
- **Primary hover:** `#1D4ED8`
- **Primary subtle:** `#EFF6FF` — light blue for selected states, highlights
- **Background:** `#FFFFFF` — diagram canvas
- **Surface:** `#F8FAFC` — card backgrounds, input fields
- **Border:** `#E2E8F0` — dividers, panel borders
- **Text primary:** `#0F172A` — headings, body text
- **Text secondary:** `#64748B` — labels, placeholders, meta
- **Text muted:** `#94A3B8` — timestamps, disabled

### Dark Mode (consultant chrome: teleprompter, transcript, sidebar, status bar)
- **Background:** `#0F172A` — deep slate, not pure black
- **Surface:** `#1E293B` — elevated surfaces, cards in dark areas
- **Surface hover:** `#334155`
- **Border:** `#334155` — subtle dividers
- **Text primary:** `#F1F5F9` — high contrast text
- **Text secondary:** `#94A3B8` — labels, meta
- **Text muted:** `#64748B` — timestamps, disabled

### Semantic Colors (consistent across both modes)
- **Success:** `#16A34A` — confirmed nodes, connected status, positive indicators
- **Warning:** `#D97706` — forming nodes, degraded state, pending actions
- **Error:** `#DC2626` — rejected nodes, disconnected, critical alerts
- **Info:** `#0EA5E9` — informational banners, tips, help text

### Node Colors — Type-Based (BPMN diagram, confirmed state)
Bizagi-inspired warm palette. Type-based coloring makes diagrams instantly readable and screenshot-worthy.
- **Start Event:** `#16A34A` border, `#F0FDF4` fill (green circle)
- **Task:** `#3B82F6` border (2px solid), `#EFF6FF` fill (soft blue)
- **Exclusive Gateway:** `#EAB308` border, `#FEF9C3` fill (yellow diamond)
- **Parallel Gateway:** `#7C3AED` border, `#F5F3FF` fill (purple diamond)
- **Intermediate Event:** `#A16207` border, `#FEF3C7` fill (warm brown circle)
- **Boundary Event:** `#A16207` border, `#FEF3C7` fill (warm brown)
- **End Event:** `#DC2626` border, `#FEF2F2` fill (red circle)
- **Sub-Process:** `#7C3AED` border, `#F5F3FF` fill (purple)
- **Connection lines:** `#64748B`

### Node Colors — State Overrides (override type colors when active)
State-based coloring takes priority over type-based colors via CSS markers.
- **Node forming:** `#EAB308` border (dashed) with `#FEF9C3` background, pulse animation
- **Node confirmed:** Uses type-based colors above (no override)
- **Node rejected:** `#DC2626` border (solid, fading) with `#FEF2F2` background
- **Node active (discussing now):** `#2563EB` border (3px solid) with `#DBEAFE` background — thicker border + darker fill than confirmed tasks for visual distinction

### Speaker Colors (transcript)
- **Consultant:** `#2563EB` — matches primary, "you" are the brand
- **Client 1:** `#7C3AED` — purple, distinct from blue
- **Client 2:** `#059669` — teal, third voice
- **Client 3+:** `#D97706` — amber, additional speakers

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — consulting tools need room to breathe
- **Scale:**
  - `2xs`: 2px — hairline gaps, icon padding
  - `xs`: 4px — tight internal padding, between icon and label
  - `sm`: 8px — standard internal padding, list item gap
  - `md`: 16px — standard component padding, section gap
  - `lg`: 24px — panel padding, card content area
  - `xl`: 32px — section spacing, major layout gaps
  - `2xl`: 48px — page-level spacing
  - `3xl`: 64px — hero spacing, major section breaks

## Layout
- **Approach:** Grid-disciplined — strict columns, predictable alignment
- **Grid:** 12-column at 1440px+, 8-column at 1024px, single column at mobile
- **Max content width:** 1440px for dashboard, full viewport for meeting view
- **Meeting view panels:**
  - Balanced: 22% / 50% / 28% (teleprompter / diagram / transcript)
  - Diagram Focus: 15% / 70% / 15%
  - Transcript Focus: 20% / 40% / 40%
  - Presets toggled via status bar buttons
- **Border radius:**
  - `sm`: 4px — inputs, buttons, small cards
  - `md`: 6px — standard cards, dropdowns
  - `lg`: 8px — modals, large containers
  - `full`: 9999px — badges, pills, avatar circles

## Motion
- **Approach:** Minimal-functional — transitions that aid comprehension, nothing decorative
- **Easing:**
  - Enter: `cubic-bezier(0, 0, 0.2, 1)` (ease-out — things arriving)
  - Exit: `cubic-bezier(0.4, 0, 1, 1)` (ease-in — things leaving)
  - Move: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out — things repositioning)
- **Duration:**
  - Micro: 75ms — hover states, button press
  - Short: 150ms — dropdown open, tooltip appear
  - Medium: 300ms — node state transition (forming → confirmed), panel switch
  - Long: 500ms — page transitions, modal open/close
- **Special animations:**
  - Node forming: dashed border with subtle breathing pulse (opacity 0.7→1.0, 2s cycle)
  - Node confirmed: dashed → solid border transition (300ms), subtle scale 1.02→1.0
  - Node rejected: fade + slide out (300ms), children cascade to forming
  - Transcript auto-scroll: smooth scroll to bottom, 150ms
  - Status banner: slide down from top, 300ms

## Component Patterns

### Buttons
- **Primary:** `#2563EB` bg, white text, `sm` radius, medium weight
- **Secondary:** transparent bg, `#2563EB` text, `#E2E8F0` border
- **Ghost:** transparent bg, `#64748B` text, no border (hover: `#F1F5F9` bg)
- **Danger:** `#DC2626` bg, white text (only for destructive actions)
- **All buttons:** 44px min height (touch target), 16px horizontal padding

### Cards
- Light mode: `#FFFFFF` bg, `#E2E8F0` border, `md` radius, `lg` padding
- Dark mode: `#1E293B` bg, `#334155` border, `md` radius, `lg` padding

### Inputs
- Light: `#F8FAFC` bg, `#E2E8F0` border, `sm` radius
- Focus: `#2563EB` border (2px), `#EFF6FF` bg
- Error: `#DC2626` border, `#FEF2F2` bg
- 44px height (touch target)

### Status Indicators
- Connected: `#16A34A` dot (8px, pulsing)
- Degraded: `#D97706` dot (static)
- Disconnected: `#DC2626` dot (static)
- Recording: `#DC2626` dot (pulsing) + "REC" label

## Dark/Light Mode Strategy
- **Not a full toggle.** The meeting view uses BOTH simultaneously:
  - Teleprompter panel: always dark
  - BPMN diagram canvas: always light
  - Transcript panel: always dark
  - Status bar: always dark
  - Shared client view: always light
- **Dashboard/non-meeting pages:** follow system preference (prefers-color-scheme)
- **Dark mode surfaces:** reduce color saturation by 10-15%, increase contrast

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-22 | Initial design system created | Created by /design-consultation based on product context + competitive research (Linear, Lucidchart, Miro) |
| 2026-03-22 | Dual-temperature UI | EUREKA: Diagram canvas (light) must be screenshot-ready for enterprise clients. Consultant chrome (dark) creates premium tool feel. |
| 2026-03-22 | Instrument Serif for display | Serif in SaaS is a deliberate risk — signals authority and consulting expertise. Differentiates from geometric-sans-serif competition. |
| 2026-03-22 | Restrained color | BPMN node states (forming/confirmed/rejected) ARE the color in the product. Chrome is almost monochrome so diagram colors pop. |
| 2026-03-22 | Geist for body/UI | Modern, excellent at small sizes, pairs with Instrument Serif. Vercel ecosystem alignment (Next.js project). |
| 2026-03-22 | Type-based node colors | Confirmed nodes use type-based colors (tasks=blue, gateways=amber, events=green/red) instead of monochrome. State overrides type (forming=amber dashed, active=thicker blue). Makes diagrams Bizagi-level readable. |
| 2026-03-22 | Dark chrome toolbar | Professional BPMN toolbar with edit/view/export sections. Dark (#0F172A) to match consultant chrome. Light canvas preserved for screenshot-ready diagrams. |
| 2026-03-22 | Bizagi-inspired warm palette | Updated from cool blue/amber to warm palette: tasks=soft blue (#3B82F6), gateways=true yellow (#EAB308), intermediate events=warm brown (#A16207). More professional, screenshot-ready for client deliverables. |
| 2026-03-22 | bpmn.io watermark styling | Cannot legally remove watermark. Styled to blend: 30% opacity + grayscale. License-compliant, visually unobtrusive. |
