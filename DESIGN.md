# Design System — Auditora.ai

## Product Context
- **What this is:** AI-powered process elicitation platform that joins video calls, guides consultants with a teleprompter, and auto-diagrams business processes live during the meeting
- **Who it's for:** Independent BPM consultants and small consulting firms (1-5 people)
- **Space/industry:** Business process management, consulting tools, process mining
- **Project type:** Web app with real-time collaboration (3-panel meeting view)

## Aesthetic Direction
- **Direction:** Warm Luxury — function-first with premium craft details. The tool feels like it was designed by someone who respects the consulting profession.
- **Decoration level:** Intentional — subtle grain texture on warm dark surfaces, clean warm whites on light surfaces. No cold grays, no gradients-for-decoration.
- **Mood:** Precision instrument in a warm study. Think walnut and leather, not steel and glass. The product feels authoritative and serious, but the warmth keeps it from feeling clinical. Linear's engineering precision meets the authority of a McKinsey deliverable, wrapped in a private club aesthetic.
- **Key design insight:** Dual-temperature UI — warm dark chrome for the consultant's private view (teleprompter, transcript, controls), warm white canvas for the shared BPMN diagram. The diagram area must be pristine enough to screenshot and send to a Fortune 500 client. The warmth of both zones creates visual cohesion instead of a jarring cold contrast.
- **Dual accent system:** Blue (`#2563EB`) = action (buttons, links, interactive states). Amber (`#D97706`) = orientation (panel edges, section markers, status indicators in chrome). Each color has one job — never cross roles.

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
- **Approach:** Dual accent + warm neutrals. The BPMN diagram's node colors ARE the color in the product. Chrome uses warm stone tones with amber orientation accents. Canvas is warm white so diagrams feel premium and screenshot-ready.

### Warm Chrome (consultant panels: teleprompter, transcript, sidebar, status bar, top bar)
Warm stone palette with 4 surface levels for depth and hierarchy.
- **Base:** `#1C1917` (stone-900) — panel backgrounds, deepest surface
- **Raised:** `#292524` (stone-800) — cards, elevated surfaces, dropdown menus
- **Hover:** `#44403C` (stone-700) — hover states, active surfaces, pressed states
- **Subtle:** `#57534E` (stone-600) — muted backgrounds, secondary panels
- **Border:** `#44403C` (stone-700) — dividers, panel edges
- **Border subtle:** `#292524` (stone-800) — inner dividers, faint separator lines
- **Text primary:** `#FAFAF9` (stone-50) — headings, body text on chrome
- **Text secondary:** `#A8A29E` (stone-400) — labels, meta, secondary info
- **Text muted:** `#78716C` (stone-500) — timestamps, disabled text

### Warm Canvas (diagram area, shared client view, dashboard light mode)
Warm white palette — papel crema, not sterile white.
- **Background:** `#FFFBF5` — diagram canvas, warm white
- **Surface:** `#FAF9F7` — card backgrounds, input fields
- **Border:** `#E7E5E4` (stone-200) — dividers, panel borders
- **Text primary:** `#1C1917` (stone-900) — headings, body text
- **Text secondary:** `#78716C` (stone-500) — labels, placeholders, meta
- **Text muted:** `#A8A29E` (stone-400) — timestamps, disabled

### Accent Colors
Dual accent system — each color has one role.
- **Action (blue):** `#2563EB` — buttons, links, active states, primary actions
- **Action hover:** `#1D4ED8` — button/link hover
- **Action subtle:** `#EFF6FF` — selected backgrounds, highlights on light surfaces
- **Orientation (amber):** `#D97706` — panel edge accents, section icons, "LIVE" badge, dark chrome decorative highlights
- **Orientation subtle:** `#FEF3C7` — warm highlights on light surfaces
- **Orientation glow:** `rgba(217, 119, 6, 0.08)` — panel edge glow line (1px), subtle ambient warmth

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
- **Connection lines:** `#78716C` (stone-500, warmer than previous `#64748B`)

### Node Colors — State Overrides (override type colors when active)
State-based coloring takes priority over type-based colors via CSS markers.
- **Node forming:** `#EAB308` border (dashed) with `#FEF9C3` background, pulse animation
- **Node confirmed:** Uses type-based colors above (no override)
- **Node rejected:** `#DC2626` border (solid, fading) with `#FEF2F2` background
- **Node active (discussing now):** `#2563EB` border (3px solid) with `#DBEAFE` background — thicker border + darker fill than confirmed tasks for visual distinction

### Marketing Landing & Login Palette
Separate from the product UI. Darker, bolder, premium feel that differentiates from generic BPM tools (no corporate blue). Applied via `[data-landing]` override on marketing and hardcoded in login showcase.

- **Deep background:** `#0A1428` — hero sections, dark panels, navbar scroll bg, login showcase
- **Secondary background:** `#111827` — cards on dark surfaces, raised elements, feature pills
- **Accent (teal):** `#00E5C0` — primary accent across all marketing + login. Buttons, badges, icons, borders, timeline
- **Accent hover:** `#00C4A3` — button hover states
- **Main text (on dark):** `#F1F5F9` — headings, body text on dark sections
- **Secondary text:** `#94A3B8` — subtitles, descriptions on dark sections
- **Muted text:** `#64748B` — meta text, fine print
- **Heading text (on light):** `#0A1428` — headings on white/light sections
- **Risk/alert:** `#EF4444` — risk icons, alert accents (login risk feature)
- **Success:** `#10B981` — success indicators
- **Borders (dark surfaces):** `#1E293B` — dividers, pill borders on dark bg
- **Button text on teal:** `#0A1428` — dark text on `#00E5C0` buttons for contrast (not white)
- **Radial glow (teal):** `rgba(0, 229, 192, 0.06–0.15)` — gradient overlays on dark sections
- **Radial glow (risk):** `rgba(239, 68, 68, 0.04)` — subtle red glow on login showcase

**Design rationale:** The teal `#00E5C0` is brighter and more saturated than typical SaaS accents. Combined with the deep `#0A1428` background, it creates a premium, high-contrast look that signals innovation and sophistication. The palette avoids blue entirely to stand apart from competitors.

### Speaker Colors (transcript)
- **Consultant:** `#2563EB` — matches action accent, "you" are the brand
- **Client 1:** `#7C3AED` — purple, distinct from blue
- **Client 2:** `#059669` — teal, third voice
- **Client 3+:** `#D97706` — amber, additional speakers

## Panel Edge Transitions
The boundary between warm chrome and warm canvas should feel like a gentle bridge, not a cliff.
- **Edge line:** 1px border of `rgba(217, 119, 6, 0.08)` (amber glow) at left/right edges of center canvas where it meets dark panels
- **Inner shadow:** 4px soft `box-shadow` inset from dark panels toward canvas using `rgba(28, 25, 23, 0.15)` — creates depth without a hard line
- **Effect:** The warm amber glow at the boundary ties both temperature zones together. The transition feels intentional, not accidental.

## Canvas Grid Pattern
- **Background:** `#FFFBF5` (warm white)
- **Grid dots:** `#D6D3D1` (stone-300) at 0.5px radius on 20px spacing
- **Effect:** Warm, soft grid that provides spatial reference without competing with diagram nodes. Feels like quality paper, not a spreadsheet.

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
- **Primary:** `#2563EB` bg, white text, `sm` radius, medium weight (Geist Sans)
- **Secondary:** transparent bg, `#2563EB` text, `#E7E5E4` border
- **Ghost:** transparent bg, `#78716C` text, no border (hover: `#FAF9F7` bg on light, `#292524` bg on chrome)
- **Danger:** `#DC2626` bg, white text (only for destructive actions)
- **All buttons:** 44px min height (touch target), 16px horizontal padding

### Cards
- Canvas/light: `#FFFBF5` bg, `#E7E5E4` border, `md` radius, `lg` padding
- Chrome/dark: `#292524` bg, `#44403C` border, `md` radius, `lg` padding

### Inputs
- Light: `#FAF9F7` bg, `#E7E5E4` border, `sm` radius
- Focus: `#2563EB` border (2px), `#EFF6FF` bg
- Error: `#DC2626` border, `#FEF2F2` bg
- 44px height (touch target)

### Status Indicators
- Connected: `#16A34A` dot (8px, pulsing)
- Degraded: `#D97706` dot (static)
- Disconnected: `#DC2626` dot (static)
- Recording: `#DC2626` dot (pulsing) + "REC" label

## Warm Chrome / Warm Canvas Strategy
- **Not a full dark/light toggle.** The meeting view uses BOTH simultaneously:
  - Teleprompter panel: warm chrome (always)
  - BPMN diagram canvas: warm canvas (always)
  - Transcript panel: warm chrome (always)
  - Top bar: warm chrome (always)
  - Status bar: warm chrome (always)
  - Shared client view: warm canvas (always)
- **Dashboard/non-meeting pages:** follow system preference (prefers-color-scheme), using warm canvas tokens for light mode and warm chrome tokens for dark mode
- **Chrome surfaces:** 4 levels of depth (`#1C1917` → `#292524` → `#44403C` → `#57534E`) for visual hierarchy without relying on borders alone

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
