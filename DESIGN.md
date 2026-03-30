# Design System — Auditora.ai

## Product Context
- **What this is:** AI-powered process elicitation platform that joins video calls, guides consultants with a teleprompter, and auto-diagrams business processes live during the meeting
- **Who it's for:** Independent BPM consultants and small consulting firms (1-5 people)
- **Space/industry:** Business process management, consulting tools, process mining
- **Project type:** Web app with real-time collaboration (3-panel meeting view)

## Aesthetic Direction
- **Direction:** Cold Premium — function-first with high-contrast, tech-forward craft. Unified look from marketing to product interior.
- **Decoration level:** Intentional — deep navy surfaces, clean cool whites on light surfaces. No warm browns, no gradients-for-decoration.
- **Mood:** Precision instrument in a command center. Think steel and glass, not walnut and leather. The product feels authoritative and cutting-edge. Linear's engineering precision meets the sophistication of a Bloomberg terminal, wrapped in a premium SaaS aesthetic.
- **Key design insight:** Unified cold palette — the same deep navy (`#0A1428`) + teal (`#00E5C0`) palette flows from marketing landing page through login into the product interior. No jarring temperature shift when entering the app.
- **Accent system:** Teal (`#00E5C0`) = primary action (buttons, links, interactive states, accents). Used consistently across marketing and product.

## Typography
- **Display/Hero:** Instrument Serif — signals consulting authority. Serif in SaaS is a deliberate differentiator. Use for page titles, session names, panel headers, hero text. Italic variant for emphasis.
- **Body/UI:** Geist Sans — modern, excellent at all sizes, Vercel ecosystem alignment. All body copy, UI labels, navigation, buttons, form labels, transcript lines, teleprompter questions.
- **UI/Labels:** Geist Sans at 12-14px with medium weight for UI controls
- **Data/Tables:** Geist Sans with `font-variant-numeric: tabular-nums` — aligned numbers in analytics, timestamps, node counts
- **Code:** Geist Mono — for BPMN XML preview, technical identifiers
- **Loading:** Google Fonts for Instrument Serif, self-hosted for Geist Sans + Geist Mono (Vercel ecosystem)
- **Font stack display:** `font-family: 'Instrument Serif', Georgia, 'Times New Roman', serif`
- **Font stack body:** `font-family: 'Geist Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Font stack code:** `font-family: 'Geist Mono', 'SF Mono', 'Fira Code', monospace`
- **Scale:**
  - `3xl`: 48px / 3rem — page hero (session name on dashboard) — Instrument Serif
  - `2xl`: 36px / 2.25rem — section headings — Instrument Serif
  - `xl`: 24px / 1.5rem — teleprompter "Ask Now" question — Instrument Serif
  - `lg`: 20px / 1.25rem — card titles, panel headers — Geist Sans semibold
  - `md`: 16px / 1rem — body text, transcript lines — Geist Sans
  - `sm`: 14px / 0.875rem — UI labels, secondary text, table cells — Geist Sans
  - `xs`: 12px / 0.75rem — timestamps, status indicators, meta text — Geist Sans
  - `2xs`: 10px / 0.625rem — badges, tags, node labels in diagram — Geist Sans

## Color
- **Approach:** Unified cold palette. The marketing navy/teal palette is the source of truth for the entire product. Chrome uses deep navy tones with teal accents. Canvas is cool white for clean, professional diagrams.

### Cold Chrome (consultant panels: teleprompter, transcript, sidebar, status bar, top bar)
Deep navy/slate palette with 4 surface levels for depth and hierarchy.
- **Base:** `#0A1428` — panel backgrounds, deepest surface
- **Raised:** `#111827` — cards, elevated surfaces, dropdown menus
- **Hover:** `#1E293B` (slate-800) — hover states, active surfaces, pressed states
- **Subtle:** `#334155` (slate-700) — muted backgrounds, secondary panels
- **Border:** `#1E293B` (slate-800) — dividers, panel edges
- **Border subtle:** `#111827` — inner dividers, faint separator lines
- **Text primary:** `#F1F5F9` (slate-100) — headings, body text on chrome
- **Text secondary:** `#94A3B8` (slate-400) — labels, meta, secondary info
- **Text muted:** `#64748B` (slate-500) — timestamps, disabled text

### Cool Canvas (diagram area, shared client view, dashboard light mode)
Cool white palette — clean and professional.
- **Background:** `#F8FAFC` (slate-50) — diagram canvas, cool white
- **Surface:** `#F1F5F9` (slate-100) — card backgrounds, input fields
- **Border:** `#E2E8F0` (slate-200) — dividers, panel borders
- **Text primary:** `#0F172A` (slate-900) — headings, body text
- **Text secondary:** `#64748B` (slate-500) — labels, placeholders, meta
- **Text muted:** `#94A3B8` (slate-400) — timestamps, disabled

### Accent Colors
- **Action (teal):** `#00E5C0` — buttons, links, active states, primary actions (unified with marketing)
- **Action hover:** `#00C4A3` — button/link hover
- **Action subtle:** `#ECFDF5` — selected backgrounds, highlights on light surfaces
- **Orientation (amber):** `#D97706` — panel edge accents, section icons, "LIVE" badge, chrome decorative highlights
- **Orientation subtle:** `#FEF3C7` — highlights on light surfaces
- **Orientation glow:** `rgba(217, 119, 6, 0.08)` — panel edge glow line (1px)

### Semantic Colors (consistent across both zones)
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
- **Connection lines:** `#64748B` (slate-500)

### Node Colors — State Overrides (override type colors when active)
State-based coloring takes priority over type-based colors via CSS markers.
- **Node forming:** `#EAB308` border (dashed) with `#FEF9C3` background, pulse animation
- **Node confirmed:** Uses type-based colors above (no override)
- **Node rejected:** `#DC2626` border (solid, fading) with `#FEF2F2` background
- **Node active (discussing now):** `#2563EB` border (3px solid) with `#DBEAFE` background — thicker border + darker fill than confirmed tasks for visual distinction

### Marketing Landing & Login Palette
Same palette as the product — unified cold navy + teal. Marketing uses `[data-landing]` CSS override for landing-specific variables but the colors are identical to chrome tokens.

**Design rationale:** The teal `#00E5C0` is brighter and more saturated than typical SaaS accents. Combined with the deep `#0A1428` background, it creates a premium, high-contrast look that signals innovation and sophistication. The palette avoids blue entirely to stand apart from competitors. The user transitions seamlessly from marketing → login → product with zero visual jarring.

### Speaker Colors (transcript)
- **Consultant:** `#2563EB` — matches action accent, "you" are the brand
- **Client 1:** `#7C3AED` — purple, distinct from blue
- **Client 2:** `#059669` — teal, third voice
- **Client 3+:** `#D97706` — amber, additional speakers

## Panel Edge Transitions
The boundary between cold chrome and cool canvas should feel like a gentle bridge, not a cliff.
- **Edge line:** 1px border of `rgba(217, 119, 6, 0.08)` (amber glow) at left/right edges of center canvas where it meets dark panels
- **Inner shadow:** 4px soft `box-shadow` inset from dark panels toward canvas using `rgba(15, 23, 42, 0.15)` — creates depth without a hard line
- **Effect:** The subtle amber glow at the boundary ties both zones together. The transition feels intentional, not accidental.

## Canvas Grid Pattern
- **Background:** `#F8FAFC` (slate-50, cool white)
- **Grid dots:** `#CBD5E1` (slate-300) at 0.5px radius on 20px spacing
- **Effect:** Clean, soft grid that provides spatial reference without competing with diagram nodes.

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
  - `sm`: 6px — inputs, buttons, small cards
  - `md`: 8px — standard cards, dropdowns
  - `lg`: 12px — modals, large containers, panels
  - `xl`: 16px — hero cards, major containers
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
- **Primary:** `#00E5C0` bg, `#0A1428` text, `sm` radius, medium weight (Geist Sans)
- **Secondary:** transparent bg, `#00E5C0` text, `#E2E8F0` border
- **Ghost:** transparent bg, `#64748B` text, no border (hover: `#F1F5F9` bg on light, `#1E293B` bg on chrome)
- **Danger:** `#DC2626` bg, white text (only for destructive actions)
- **All buttons:** 44px min height (touch target), 16px horizontal padding

### Cards
- Canvas/light: `#F8FAFC` bg, `#E2E8F0` border, `md` radius, `lg` padding
- Chrome/dark: `#111827` bg, `#1E293B` border, `md` radius, `lg` padding

### Inputs
- Light: `#F1F5F9` bg, `#E2E8F0` border, `sm` radius
- Focus: `#00E5C0` border (2px), `#ECFDF5` bg
- Error: `#DC2626` border, `#FEF2F2` bg
- 44px height (touch target)

### Status Indicators
- Connected: `#16A34A` dot (8px, pulsing)
- Degraded: `#D97706` dot (static)
- Disconnected: `#DC2626` dot (static)
- Recording: `#DC2626` dot (pulsing) + "REC" label

## Cold Chrome / Cool Canvas Strategy
- **Not a full dark/light toggle.** The meeting view uses BOTH simultaneously:
  - Teleprompter panel: cold chrome (always)
  - BPMN diagram canvas: cool canvas (always)
  - Transcript panel: cold chrome (always)
  - Top bar: cold chrome (always)
  - Status bar: cold chrome (always)
  - Shared client view: cool canvas (always)
- **Dashboard/non-meeting pages:** follow system preference (prefers-color-scheme), using cool canvas tokens for light mode and cold chrome tokens for dark mode
- **Chrome surfaces:** 4 levels of depth (`#0A1428` → `#111827` → `#1E293B` → `#334155`) for visual hierarchy without relying on borders alone

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
| 2026-03-27 | Warm Luxury redesign | Cold slate (#0F172A) + Inter replaced with warm stone palette + Instrument Serif + Geist. Dual accent (blue=action, amber=orientation). Warm white canvas (#FFFBF5). Panel edge transitions with amber glow. The original typography decisions (Instrument Serif + Geist) are restored. |
| 2026-03-29 | Marketing & Login premium palette | New palette: deep `#0A1428` + bright teal `#00E5C0` replaces navy+muted teal (marketing) and stone+blue (login). Goal: differentiate from generic BPM tools, feel more potent and premium. Teal buttons use dark text for contrast. Unified accent across marketing and login. |
| 2026-03-29 | Unified cold palette across entire product | Eliminated warm stone/brown palette and warm whites from the SaaS app. Marketing's cold navy/slate + teal palette is now the single source of truth everywhere. No more jarring theme shift when entering the app. stone-* → slate-*, #FFFBF5 → #F8FAFC, #FAF9F7 → #F1F5F9. |
