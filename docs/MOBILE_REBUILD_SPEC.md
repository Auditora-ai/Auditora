# Mobile-First BPM Rebuild Spec

## Architecture: 5 pantallas, 1 flujo

### Route Structure (CLEAN)
```
[orgSlug]/                    → HOME (mapa de procesos)
[orgSlug]/discovery           → FASE 0: Discovery organizacional
[orgSlug]/capture/[processId] → FASE 1: Elicitation SIPOC
[orgSlug]/process/[processId] → FASE 2: Proceso documentado
[orgSlug]/evaluate/[processId]→ FASE 3: Evaluación Harvard-case
[orgSlug]/panorama            → FASE 4: Vista ejecutiva
```

Old routes to redirect: descubrir/, procesos/, evaluaciones/, processes/, procedures/, deliverables/, risks/, sessions/

---

## PANTALLA 0: DISCOVERY ORGANIZACIONAL
Route: `[orgSlug]/discovery`
Trigger: First time org has no CompanyBrain/OrgContext populated

### UX Flow (mobile-first chat):
1. Full-screen chat interface, one message at a time
2. AI acts as BPM consultant asking about the business:
   - "¿A qué se dedica tu empresa?" → industry, product/service
   - "¿Cuál es tu producto o servicio principal?" → value proposition
   - "¿Quién es tu cliente?" → customer segments
   - "¿Cómo le llega tu producto al cliente?" → value chain
   - "¿Cuántos empleados tienen?" → company size
   - "¿Qué áreas/departamentos?" → org structure
   - "¿Tienen certificaciones?" → ISO, etc.
3. After ~8-12 questions, AI generates:
   - Value chain (Porter model)
   - Suggested process architecture (strategic/core/support)
4. User sees generated architecture as cards, can:
   - ✅ Confirm / ❌ Remove / ⭐ Mark as critical / ✏️ Edit name
5. On confirm → creates ProcessArchitecture + ProcessDefinitions in DB

### Backend: 
- Uses existing CompanyBrain + OrgContext + ValueChainActivity models
- Uses existing ProcessArchitecture + ProcessDefinition models
- AI: streaming chat via Vercel AI SDK (existing pattern from interview module)
- New procedure: `discovery.generateArchitecture` → takes chat context, returns suggested processes

### Mobile Design:
- Chat bubbles, full-width, bottom-anchored input
- Generated architecture: vertical cards, swipeable
- Each card: process name, category badge (strategic/core/support), AI confidence
- Bottom sticky: "Confirmar arquitectura" button
- Progress indicator: "Entendiendo tu negocio... 5/8 preguntas"

---

## PANTALLA 1: HOME (Mapa de Procesos)
Route: `[orgSlug]/` (org landing page)

### UX:
- Header: org name + industry badge
- Maturity summary: "12 procesos · 5 documentados · 3 evaluados"
- Process list grouped by category:
  
  **ESTRATÉGICOS** (collapsible)
  - Planeación estratégica [SIN CAPTURAR] (gray)
  - Gestión de calidad [DOCUMENTADO] (blue) — 78% alineación
  
  **OPERATIVOS** (expanded by default)
  - Compras MP [EVALUADO] ███████░░ 78% — 3 en riesgo
  - Producción [DOCUMENTADO] (blue) — sin evaluar
  - Logística [CAPTURADO] (yellow) — pendiente documentar
  - Ventas [SIN CAPTURAR] (gray)
  
  **SOPORTE**
  - RRHH [EVALUADO] ███░░░░░ 45% — URGENTE
  - Nómina [EVALUADO] █████████ 88%

### States per process:
- `DRAFT` (gray) → Sin capturar. Tap → go to capture
- `CAPTURED` (yellow) → Tiene data cruda. Tap → go to process doc for review
- `DOCUMENTED` (blue) → Validado. Tap → process detail. CTA "Evaluar equipo"
- `EVALUATED` (green/red by score) → Has results. Shows % + risk count

### FAB button: "Capturar proceso" → goes to capture flow

### Backend:
- Query: ProcessDefinition[] with aggregated eval scores
- Group by category field
- Count: risks, evaluations, alignment scores

---

## PANTALLA 2: CAPTURE (Elicitation SIPOC)
Route: `[orgSlug]/capture/[processId]`

### Entry: 
- From HOME tapping a DRAFT process, or FAB "+"
- If new: ask process name + area first, then start chat

### UX Flow:
1. Process context header: "Capturando: Compras de Materia Prima · Operativo"
2. Method selection (if first time):
   - 💬 "Quiero platicarlo" → SIPOC Interview chat
   - 📄 "Tengo un documento" → Upload PDF/Word
   - 🎥 "Grabarlo en junta" → Live session (premium badge)
3. SIPOC Interview (main flow):
   - AI introduces itself as BPM consultant
   - Follows SIPOC framework adaptively:
     - SUPPLIERS: "¿Quién o qué departamento te manda lo que necesitas para arrancar este proceso?"
     - INPUTS: "¿Qué recibes para empezar? ¿Documentos? ¿Materiales? ¿Aprobaciones?"
     - PROCESS: "Cuéntame paso a paso qué haces desde que recibes [input]"
       - For each step: "¿Quién lo ejecuta?" "¿Cuánto tarda?" "¿Qué puede salir mal?" "¿Qué haces cuando falla?"
     - OUTPUTS: "¿Qué produce este proceso al final?"
     - CUSTOMERS: "¿Quién recibe lo que este proceso produce?"
   - AI knows the org context (from CompanyBrain) so questions are contextual
4. After sufficient info gathered:
   - AI says "Tengo suficiente información. Generando tu proceso..."
   - Shows loading state with progress
   - Generates: BPMN draft + SOP draft + RACI draft + Risk list (FMEA)
   - Redirects to Process detail view

### Backend:
- Uses existing DiscoveryThread + DiscoveryMessage models
- AI system prompt includes OrgContext + ValueChainActivity for contextual questions
- On completion: creates/updates ProcessDefinition with bpmnXml, creates Procedure, creates ProcessRisk entries, creates RaciEntry entries
- Status update: DRAFT → CAPTURED → DOCUMENTED (after validation)

### Mobile Design:
- Full-screen chat, no sidebar
- Bottom input with mic icon (future: voice)
- AI messages: full-width cards with structured content
- When AI asks about steps: numbered list building in real-time
- Method selection: 3 large tap cards, not a dropdown

---

## PANTALLA 3: PROCESS (Documento Vivo)
Route: `[orgSlug]/process/[processId]`

### UX:
- Header: process name + status badge + maturity score
- Tab bar (horizontal scroll on mobile):
  - FLUJO | PROCEDIMIENTO | RIESGOS | RACI | HISTORIAL

**FLUJO tab:**
- Vertical flow diagram (NOT horizontal BPMN editor)
- Each step is a card:
  - Step number + name
  - Who executes (role badge)
  - Duration estimate
  - Risk indicator (red/yellow/green dot)
  - Tap to expand: full detail + what can go wrong
- Decision points shown as diamond cards with branches
- Scroll vertically, natural mobile UX

**PROCEDIMIENTO tab:**
- SOP as readable document
- Each step is a section with:
  - What to do (instruction)
  - Who does it
  - What you need (inputs)
  - What you produce (outputs)
  - Important: warning callouts for risk steps
- Editable: tap any field to edit inline

**RIESGOS tab (FMEA):**
- List of risks sorted by RPN (Risk Priority Number)
- Each risk card:
  - Risk description
  - Which step it affects
  - Severity × Frequency × Detection = RPN score
  - Color coding: red (>200), yellow (100-200), green (<100)
  - Mitigations listed
- This IS the FMEA — not called FMEA, but it IS FMEA methodology

**RACI tab:**
- Matrix as cards on mobile:
  - Per step: R: [name], A: [name], C: [names], I: [names]
  - Color coded by role type

**HISTORIAL tab:**
- Version timeline
- Each entry: who changed what, when
- Tap to see diff

### Bottom CTA: "Evaluar equipo en este proceso" (only if DOCUMENTED status)

---

## PANTALLA 4: EVALUATE
Route: `[orgSlug]/evaluate/[processId]`

### Two modes:

**MODE A: LAUNCH (manager/admin view)**
1. Shows process summary: "Compras MP · 14 pasos · 4 riesgos críticos"
2. "¿A quién evalúas?"
   - List of team members with role badges
   - Select individuals or "Todo el equipo"
3. "La IA generará escenarios basados en:"
   - 4 riesgos FMEA del proceso (shown as cards)
   - 3 puntos de decisión del BPMN
4. Tap "Generar y enviar evaluación"
5. AI generates SimulationTemplate + Scenarios from process data
6. Sends links to selected people
7. Shows progress: "3/8 personas han completado"

**MODE B: TAKE (evaluee view)**
Route: `/intake/evaluacion/[token]`

1. Welcome screen: 
   - "Evaluación: Compras de Materia Prima"
   - "Rol asignado: Supervisor de Calidad"
   - "8 escenarios · ~15 min"
   - "Iniciar"
2. Each scenario (one per screen):
   - Context paragraph (2-3 lines, scenario setup)
   - "¿Qué haces?" 
   - Option A / Option B / Option C (large touch buttons, min 56px)
   - Each option is a realistic action, not obvious right/wrong
3. After selecting: 
   - Brief feedback: "Según el procedimiento, la respuesta correcta es B"
   - Why: links to specific step in the SOP
   - Next scenario →
4. Results screen:
   - Score: 6/8 correctas (75%)
   - Gaps: "Fallaste en manejo de material fuera de spec (pasos 7-9)"
   - "Tu resultado fue enviado a tu supervisor"

**MODE C: RESULTS (manager view)**
- Per person: score + specific gaps by process step
- Per process: team alignment %, weakest steps, strongest steps
- Comparison: if re-evaluation, shows before/after
- Drill-down: tap a person → see their exact decisions vs correct answers

---

## PANTALLA 5: PANORAMA
Route: `[orgSlug]/panorama`

### UX:
- **Score card**: "Tu operación: 67% bajo control" with trend arrow
- **Breakdown**: 
  - Documentación: 8/12 procesos (67%)
  - Evaluación: 3/12 procesos evaluados
  - Alineación promedio: 72%
- **Alertas** (red cards):
  - "RRHH Onboarding: 45% alineación — 2 personas en riesgo"
  - "Producción: 4 riesgos FMEA sin mitigar"
- **Acciones** (blue cards):
  - "Evalúa Compras → nadie ha sido evaluado"
  - "Documenta Logística → solo capturado"
  - "Re-evalúa Producción → último score: 55%, meta: 80%"
- **Tendencia**: simple line chart (last 4 evaluations)

---

## Design System

### Colors (from theme.css):
- Background: var(--palette-cool-white) #F8FAFC
- Cards: white with subtle border
- Primary action: var(--palette-action) #3B8FE8
- Status colors:
  - Draft/Gray: var(--palette-slate-400)
  - Captured/Yellow: var(--palette-orientation) #D97706
  - Documented/Blue: var(--palette-action) #3B8FE8
  - Evaluated-good/Green: var(--palette-success) #16A34A
  - Evaluated-bad/Red: var(--palette-destructive) #DC2626
- Risk FMEA:
  - Critical (RPN>200): destructive
  - Medium (100-200): warning/orientation
  - Low (<100): success

### Typography:
- Geist Sans (--font-sans) for everything
- Oxanium (--font-brand) for logo/brand only
- Hierarchy: text-2xl font-semibold → text-lg font-semibold → text-sm

### Mobile patterns:
- Full-width cards with 16px padding
- Bottom-anchored inputs for chat
- Sticky headers for context
- Large touch targets: min-h-[48px]
- Safe area respect: pb-safe
- No horizontal scroll except tab bars
- Vertical card layouts, never tables on mobile

### Components to use from packages/ui:
- Button, Card, Badge, Input, Textarea
- Tabs (horizontal scroll)
- Sheet (bottom sheet for mobile actions)
- Dialog (confirmations)
- Progress (bars)
- Avatar (team members)
- Skeleton (loading states)
