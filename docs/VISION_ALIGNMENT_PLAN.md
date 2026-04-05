# Vision Alignment Refactor — Master Plan

## Objetivo
Alinear el SaaS al PRODUCT_VISION.md. No inventar features nuevos. Usar SOLO componentes shadcn/luma existentes. Mobile es un componente, web es otro.

## Referencia: Lo que dice la visión

### Navegación (5 tabs mobile):
```
HOME (/)           → Mapa de procesos con estados de madurez
DISCOVERY          → Discovery organizacional (Fase 0) + Captura SIPOC (Fase 1)
PROCESOS           → NO ES TAB — es drill-down desde Home (/process/[id])
EVALUACIONES       → Lanzar + Tomar + Resultados (/evaluate/[processId])
PANORAMA           → Dashboard ejecutivo (/panorama)
```

### Rutas que dice la visión:
```
[orgSlug]/                      → HOME: mapa de procesos
[orgSlug]/discovery             → Discovery organizacional
[orgSlug]/capture/new           → Nuevo proceso
[orgSlug]/capture/[processId]   → Entrevista SIPOC
[orgSlug]/process/[processId]   → Documento vivo
[orgSlug]/evaluate/[processId]  → Evaluaciones
[orgSlug]/panorama              → Dashboard ejecutivo
```

### Ciclo de vida de procesos (visión):
DRAFT (gris) → CAPTURED (amarillo) → DOCUMENTED (azul) → EVALUATED (verde/rojo)

---

## BATCH 1: Navegación + Home + Limpieza de rutas

### Task 1A: MobileBottomBar — Alinear navegación
- Cambiar tabs a: Inicio, Descubrir, Evaluaciones, Panorama, Más
  (nota: "Procesos" NO es tab — se accede desde Home)
- Descubrir apunta a /discovery (no /descubrir)
- Evaluaciones apunta a /evaluaciones (mantener)
- Panorama apunta a /panorama (mantener)

### Task 1B: HOME — Reescribir como mapa de procesos
La visión dice: "Lista de procesos de la organización con su estado de madurez y score. Agrupados por tipo (estratégico/operativo/soporte). El CEO abre la app, ve su operación en 10 segundos."

Mobile: Card list de procesos agrupados por categoría, cada uno con:
- Nombre, categoría badge, estado (DRAFT/CAPTURED/DOCUMENTED/EVALUATED)
- Score de madurez si evaluado
- Color por estado
- FAB "+" para capturar nuevo proceso → /capture/new

Desktop: Grid/table más amplio con más columnas

Empty state: Onboarding que guía a /discovery primero

### Task 1C: Limpieza de rutas duplicadas
Eliminar rutas obsoletas que NO están en la visión:
- /descubrir/* → redirect a /discovery y /capture/*
- /processes/* → redirect a /process/*
- /procesos/* → redirect a /process/*
- /evaluation → eliminar
- /analytics → eliminar
- /deliverables/* → eliminar
- /procedures/* → eliminar
- /risks → eliminar
- /sessions/* → integrar en /capture/*

---

## BATCH 2: Discovery + Capture

### Task 2A: Discovery organizacional (/discovery)
Fase 0 de la visión. La IA entrevista sobre la empresa:
- Industria, producto/servicio, cliente, cadena de valor, estructura
- Produce: cadena de valor Porter, arquitectura de procesos sugerida
- El usuario valida, prioriza, marca críticos
- Mobile: chat flow → resultados con cards de procesos sugeridos
- Desktop: split view chat + resultados

### Task 2B: Capture refactor (/capture/new, /capture/[processId])
- /capture/new: selector de método (Entrevista SIPOC, Subir Documento, Sesión Live)
- /capture/[processId]: entrevista SIPOC (ya existe como interview, reubicar)
- Mover lo útil de /descubrir/interview a /capture/
- Mobile: full-screen chat experience
- Desktop: chat + preview panel

---

## BATCH 3: Evaluaciones + Panorama

### Task 3A: Evaluaciones — Alinear a visión
La visión dice 3 modos: Lanzar (manager), Tomar (evaluee), Resultados
- Ruta: /evaluate/[processId] (por proceso, no por template)
- Lanzar: seleccionar personas, ver riesgos FMEA base, generar
- Resultados: por persona + por proceso + comparativa
- Dashboard de riesgo humano dentro de evaluaciones
- Mobile: card-based, un escenario a la vez para tomar
- Desktop: tabla + charts para resultados

### Task 3B: Panorama — Verificar alineación
Ya está bastante alineado. Verificar:
- Score global + tendencia ✓
- Alertas (procesos vulnerables) ✓
- Acciones concretas accionables ✓
- Responde las 3 preguntas de la visión

---

## Componentes shadcn/luma disponibles:
Card, Badge, Button, Tabs, Sheet, Dialog, Alert, Avatar, Progress, Table, Skeleton, Select, Input, Textarea, Form, DropdownMenu, Tooltip, Accordion, AlertDialog, Spinner

## Reglas:
1. Mobile es componente separado, Desktop es componente separado
2. SOLO shadcn/luma components — nada custom que replique lo que ya existe
3. Colores semánticos (text-primary, bg-card, border-border) — CERO hex inline
4. Touch targets min 48px en mobile
5. El page.tsx es server component que pasa data, los views son client
