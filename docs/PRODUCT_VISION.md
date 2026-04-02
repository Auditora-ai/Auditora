# Auditora.ai — Product Vision v2

**Version:** 2.0
**Fecha:** 2026-04-02
**Status:** Active — fuente de verdad

---

## La Tesis

Las empresas de 50 a 1000 empleados tienen un problema que nadie resuelve bien:

**Sus procesos existen, pero nadie los sigue.**

No porque sean malos empleados. Porque la capacitación no funciona — es aburrida, genérica, y no se mide. Cuando el gerente de compras se enfrenta a una decisión real ("el proveedor principal no entregó y el cliente exige mañana — qué hago?"), nadie sabe si va a seguir el procedimiento o improvisar.

Auditora resuelve esto poniendo los procesos de la empresa a prueba. Generas escenarios reales basados en SUS procesos y SUS procedimientos, y evalúas si el equipo toma las decisiones correctas. No es un examen. Es un caso Harvard con el contexto exacto de tu negocio.

**El dueño no compra "documentación de procesos". Compra "quiero saber dónde va a fallar mi operación mañana".**

---

## Los 3 Pilares

### 1. CAPTURAR — Cómo los procesos entran al sistema

Los procesos existen en la cabeza de la gente, en correos, en archivos sueltos. Auditora tiene 3 canales para capturarlos:

**a) Scan Automático (free tier — cero fricción)**
El prospecto pega una URL y en 60 segundos ve algo impresionante: "detectamos que eres una empresa de manufactura, estos son tus 5 procesos críticos, y tu proceso de Compras tiene 3 riesgos potenciales". No necesita registrarse. No necesita pagar. El objetivo NO es ser preciso — es que el director perciba el potencial: "si esto lo hace con solo una URL, imagínate cuando le demos datos reales".

El scan actual tiene el concepto correcto pero la ejecución fallida: hace crawling de marketing copy y genera inferencias que parecen inventadas. Necesita rebuild completo:

- El output debe ser visualmente impactante (theatrical reveal, no tabla aburrida)
- Debe terminar con un CTA claro: "esto es una vista previa. Regístrate para el diagnóstico real"
- Los datos deben sentirse específicos al negocio, no genéricos ("empresa de manufactura")
- Debe generar un link compartible para que el director lo envíe a su equipo
- No debe prometer más de lo que puede entregar (el disclaimer es parte del UX)

Este es el funnel de adquisición: Scan free → Registro → Entrevista por chat → Procesos reales → Evaluaciones de valor.

**b) Entrevista por Chat (captura profunda)**
Un asistente de IA entrevista al responsable del proceso por chat (no por llamada). Pregunta estructuradas adaptativas tipo SIPOC: "qué entra", "quién lo hace", "qué pasa si falla", "quién aprueba". Genera el diagrama BPMN y el procedimiento. Más rápido que una llamada, más barato, el usuario puede hacerlo a su ritmo, y funciona en español con acentos.

**c) Sesión en Vivo (demo wow)**
Un bot se une a la videollamada (Recall.ai), escucha la conversación, y genera el diagrama BPMN en tiempo real. Es impresionante en demo. Es el feature que hace que el prospecto diga "wow, quiero esto". Pero es secundario como input channel — más costoso, más complejo, más fricción. Se usa para demos y para clientes premium que quieren la experiencia completa.

**Resultado de los 3 canales:** Proceso documentado con BPMN + procedimiento + riesgos identificados.

---

### 2. DOCUMENTAR — Donde viven los procesos

Una vez capturado, el proceso vive en la librería. Pero aquí está el cambio de mindset: no documentamos por documentar. Documentamos para poder evaluar.

Cada proceso tiene:
- **Diagrama BPMN** — la versión técnica (para el consultor/analista)
- **Mapa visual** — la versión humana (para el CEO, el gerente, cualquier persona)
- **Procedimiento (SOP)** — generado por IA a partir del proceso, editable, versionado
- **RACI** — quién es responsable de cada paso
- **Riesgos** — no como módulo separado, como propiedad del proceso. "Este paso tiene riesgo alto porque si falla se para la línea."

La documentación no es estática. Se enriquece con las evaluaciones: "el 60% de los evaluados falló en este paso del proceso de compras — necesitamos revisar el procedimiento aquí."

---

### 3. EVALUAR — El producto que se vende

Aquí está el dinero.

Generas evaluaciones tipo caso Harvard:
- Seleccionas un proceso (ej: Compras)
- La IA genera escenarios basados en EL procedimiento REAL de esa empresa
- El empleado enfrenta decisiones concretas: "Llegó una orden de $500K que cumple todos los criterios excepto que el proveedor no está en el listado aprobado. Qué haces?"
- Opciones A, B, C — cada una con consecuencias
- El sistema evalúa si la decisión alinea con el procedimiento

**Lo que el CEO ve:**
- "Tu equipo de compras tiene un 72% de alineación procedimental"
- "El punto más débil: aprobación de proveedores nuevos — 3 de 5 evaluados tomaron la decisión incorrecta"
- "María García (gerente) score 91% — excelente. Carlos López (analista) score 45% — necesita reentrenamiento urgente"
- "Antes de la evaluación: el proceso de compras tenía 3 errores críticos/mes. Después del reentrenamiento: 0."

**Esto es tangible. Esto se puede medir. Esto es lo que el dueño le muestra a su junta directiva.**

---

## Sidebar Restructure

De 6 módulos lineales a 4 secciones con propósito claro:

```
CAPTURAR
├── Descubrir          (Scan + Entrevista + Sesión en Vivo)
│                       3 canales de entrada al mismo destino
│
DOCUMENTAR
├── Procesos            (BPMN + mapa visual + procedimientos + RACI + riesgos)
│                       Todo en un solo workspace por proceso
│
EVALUAR
├── Evaluaciones        (Stress tests — antes "Simulaciones")
│                       Escenarios de decisión basados en procesos reales
│                       Dashboard de riesgo humano por persona y por proceso
│
VER
├── Panorama            (Dashboard consolidado)
│                       Score global, procesos vulnerables, próximos pasos
│                       Accionable: "clic para ver los detalles"
│
CONFIGURAR (bottom)
├── Configuración       (Org, miembros, facturación)
```

### Lo que desaparece como módulo independiente:

| Módulo viejo | Destino |
|---|---|
| Sessions | Se absorbe como canal dentro de "Descubrir" |
| Riesgos | Propiedad de cada proceso, no módulo separado |
| Procedimientos | Se integra dentro del workspace de Procesos |
| Simulations | Se renombra a "Evaluaciones" — es el módulo principal |
| Evaluation | Se fusiona con Evaluaciones (es el dashboard del mismo módulo) |
| Deliverables | Se absorbe en Procesos (exportar) y Evaluaciones (reportes) |
| Discovery (chat) | Se absorbe como canal dentro de "Descubrir" |
| Documents | Se elimina — los documentos viven dentro de procesos |
| Assistant | Se elimina como módulo — la IA está integrada en cada módulo |

---

## Propuesta de Valor por Perfil

**Dueño / CEO:**
"Quiero saber si mi equipo está listo para la próxima crisis. Auditora me dice exactamente quién y dónde va a fallar, basado en mis propios procesos."

**Gerente de Operaciones:**
"Quiero que mis procesos sean más que un PDF que nadie lee. Auditora los convierte en escenarios de prueba que mi equipo puede practicar."

**Responsable de RH / Capacitación:**
"La capacitación genérica no funciona. Auditora genera evaluaciones personalizadas con los casos reales de cada departamento. Puedo medir quién necesita ayuda y en qué."

**Consultor BPM (usuario indirecto):**
"Auditora me ayuda a capturar procesos más rápido y a demostrar valor a mis clientes con datos concretos de evaluación."

---

## Métricas de Impacto (lo que hace el producto tangible)

| Métrica | Antes | Después | Cómo se mide |
|---|---|---|---|
| Alineación procedimental | ? | 72% → 89% | Score promedio en evaluaciones |
| Tiempo de onboarding | 3 semanas | 1 semana | Evaluación de nuevo empleado vs benchmark |
| Errores operacionales | 12/mes | 3/mes | Trackeo antes/después de evaluaciones |
| Tiempo de decisión en crisis | Desconocido | 4.2 min promedio | Tiempo de respuesta en evaluaciones |
| Costo de no-compliance | ? | -$200K/año | Riesgos mitigados por persona capacitada |

---

## Módulos de Código — Nuevo Mapping

| Sección | Módulo actual | Acción |
|---|---|---|
| Descubrir | `radiografia/` | Refactor: extraer diagramador como shared lib |
| Descubrir | `meeting/` | Split: diagramador → shared, call → plugin |
| Descubrir | `ai-interview/` | Integrar como canal de entrevista por chat |
| Descubrir | `discovery/` | Fusionar en Descubrir (chat de captura) |
| Procesos | `process-library/` | Expandir: absorber procedimientos y riesgos |
| Procesos | `procedures/` | Fusionar en process-library |
| Procesos | `risk/` | Propiedad de procesos, no módulo independiente |
| Evaluaciones | `simulations/` | Renombrar y reposicionar como módulo principal |
| Evaluaciones | (evaluation page) | Fusionar como dashboard dentro de simulaciones |
| Panorama | `command-center/` | Refactor: simplificar a dashboard accionable |
| Entregables | `deliverables/` | Absorber en Procesos (export) y Evaluaciones (reportes) |
| Eliminar | `documents/` | Borrar |
| Eliminar | `discovery/` (como standalone) | Fusionar |
| Shared | nuevo `modules/process-engine/` | Extraer diagramador BPMN de meeting/ como lib compartida |

---

---

## Modelo de Negocio

### Problema del modelo actual

El modelo de negocio está diseñado para "levantamiento de procesos" — vende sesiones IA. Esto no tiene sentido con el producto actual por varias razones:

1. **Las sesiones no son el producto.** Vender "10 sesiones IA al mes" es como vender "10 llamadas con tu doctor al mes". La llamada no es el valor — el diagnóstico es. El dueño de empresa no piensa en "cuántas sesiones necesito", piensa en "quiero saber si mi equipo está listo".

2. **El onboarding es débil.** Un solo step (OnboardingAccountStep) que solo pide datos de cuenta. No pide industria, no pide tamaño de empresa, no guía al usuario a su primer proceso. El usuario se registra y se queda mirando un dashboard vacío.

3. **El scan free tier no tiene funnel.** Existen rutas públicas (`/api/public/scan/*`) pero no hay un flujo claro de "scan gratis → impresionar → registrar → convertir". El scan está dentro de la app autenticada — debería ser público y sin registro.

4. **Los límites miden lo equivocado.** Sessions: 10/40/100. Processes: 5/unlimited/unlimited. Usuarios: 1/5/15. Nada de esto mide lo que el cliente valora. El cliente valora: "cuántos de mis empleados evalué", "cuántos riesgos identifiqué", "cuántos procedimientos tengo publicados".

5. **No hay unidad de valor que escale naturalmente.** El consultor independiente que levanta 5 procesos es un cliente chico con poco upsell. La empresa de 500 empleados que quiere evaluar a 200 personas en 8 procesos distintos es el cliente grande — y el modelo actual no está diseñado para eso.

### Nuevo Modelo de Negocio

**Unidad de valor: Evaluaciones completadas.**

La empresa paga por evaluar a su gente. La documentación de procesos es el prerequisite — necesitas procesos documentados para generar evaluaciones relevantes. Pero el dinero está en las evaluaciones.

#### Funnel de Adquisición

```
LANDING (marketing)
  ↓
SCAN GRATIS (publico, sin registro)
  "Pega tu URL y en 60 segundos ve qué tan expuesta está tu operación"
  ↓ salida: "Regístrate para el diagnóstico completo"
  ↓
REGISTRO
  Onboarding inteligente: nombre empresa, industria, tamaño, ¿cuántos empleados evaluarías?
  ↓ auto-genera: primera org, primer scan real
  ↓
PRUEBA GRATIS (14 días, full access)
  - Documentar hasta 3 procesos (via chat o session)
  - Generar hasta 10 evaluaciones
  - Ver resultados y dashboard de riesgo humano
  - Exportar 1 reporte
  ↓ salida: "Tu equipo tiene 62% de alineación. Upgrade para evaluar a todos."
  ↓
CONVERSIÓN
```

#### Planes

| | Starter | Growth | Scale | Enterprise |
|---|---|---|---|---|
| **Para quién** | La empresa que empieza, 1 proceso clave | El equipo que quiere cubrir un área completa | La empresa que quiere evaluar toda su operación | Custom |
| **Precio** | $49/mes | $199/mes | $499/mes | Custom |
| **Procesos** | 3 | 15 | Ilimitados | Ilimitados |
| **Evaluaciones/mes** | 10 | 50 | 250 | Ilimitadas |
| **Evaluadores** | 5 personas | 30 personas | 150 personas | Ilimitados |
| **Sesiones IA** | 3/mes | 10/mes | Ilimitadas | Ilimitadas |
| **Reportes** | 1/mes | 10/mes | Ilimitados | Ilimitados |
| **Usuarios admin** | 2 | 5 | 15 | Ilimitados |
| **Export** | PDF básico | PDF + PPTX + Excel | Todo + API | Todo + API + SSO |

**Lógica de precios:**
- Starter = "prueba Auditora en tu proceso más crítico". Barato enough para decidir.
- Growth = "cubrir un departamento completo". El sweet spot para empresas de 50-200.
- Scale = "transformación operacional completa". Para empresas de 200-1000.
- Enterprise = custom por número de evaluadores, SSO, integraciones, SLA.

**Por qué funciona:**
- Las evaluaciones son consumibles naturales. Se agotan, se renuevan. Igual que los créditos de OpenAI.
- Los procesos documentados son "sunk cost" — una vez que el cliente documentó 15 procesos, no se va a ir a la competencia y empezar de cero. High switching cost.
- El valor es medible: "pasamos de 45% a 82% de alineación procedimental en 3 meses". Eso se presenta en junta directiva.
- El seat model (evaluadores) escala con el tamaño de la empresa. Más empleados = más evaluaciones = más ingresos.

#### Límites que importan

| Métrica | Por qué importa | Cómo se mide |
|---|---|---|
| Evaluaciones completadas/mes | Unidad de valor principal | SimulationRun.count por mes por org |
| Evaluadores únicos/mes | Escala con tamaño de empresa | SimulationRun.userId distinct por mes |
| Procesos documentados | Sunk cost / switching cost | ProcessDefinition.count por org |
| Sesiones IA/mes | Costo real para nosotros (API calls) | Session.count por mes por org |
| Reportes exportados/mes | Deliverable tangible | Export.count por mes por org |

#### Onboarding Rediseñado

El onboarding actual es un solo step que pide datos de cuenta. Necesita ser un wizard que guíe al valor:

**Step 1 — Cuenta** (ya existe, OnboardingAccountStep)
- Nombre, email, contraseña

**Step 2 — Tu Empresa**
- Nombre de la empresa
- Industria (dropdown con las industries del scan)
- Tamaño de empresa (rangos: 10-50, 51-200, 201-500, 501-1000)
- ¿Cuántas personas te gustaría evaluar? (5, 10-30, 31-100, 100+)
- ¿Cuál es el proceso que más te preocupa? (texto libre)

**Step 3 — Primer Valor**
- "Basado en lo que nos contaste, te recomendamos empezar con [proceso inferido]"
- Opción A: "Iniciar entrevista por chat" (va al chat de captura de procesos)
- Opción B: "Agendar una sesión en vivo" (va a crear session)
- Opción C: "Explorar el dashboard" (skip, va al panorama)

**Step 4 — Setup Completo**
- Invitar miembros (opcional)
- "Tu organización está lista. Te recomendamos documentar tu primer proceso antes de crear evaluaciones."

#### Cambios al Código Existente

| Archivo | Cambio |
|---|---|
| `packages/payments/config.ts` | Nuevos planes, nuevos límites (evaluaciones, evaluadores, procesos) |
| `packages/payments/types.ts` | PlanLimits: reemplazar sessions/processes/users por evaluations/evaluators/processes/sessions/reports |
| `apps/saas/modules/payments/components/UsageDashboard.tsx` | Mostrar evaluaciones usadas, no sesiones |
| `apps/saas/modules/payments/components/PricingTable.tsx` | Actualizar features por plan |
| `packages/i18n/translations/*/shared.json` | Reescribir sección `pricing` completa |
| `apps/saas/modules/onboarding/components/OnboardingForm.tsx` | Agregar Steps 2-4 (empresa, primer valor, setup) |
| `apps/saas/app/(authenticated)/choose-plan/page.tsx` | Actualizar copy para nuevo modelo |

---

## Roadmap Sugerido (no es orden definitivo)

### Fase 1 — Fundamentos
- Consolidar diagramador BPMN como lib compartida (sale de meeting/, se usa en scan + sessions + procesos)
- Mergear procedimientos y riesgos dentro de process-library
- Renombrar simulaciones → evaluaciones
- Limpiar módulos muertos (documents, discovery standalone, assistant)
- Rediseñar modelo de negocio: planes, límites, onboarding

### Fase 2 — El Producto que se Vende
- Evaluaciones como módulo estrella: generación automática de escenarios desde procedimientos
- Dashboard de riesgo humano por persona y por proceso
- Before/after metrics (alineación procedimental)
- Reportes exportables para junta directiva
- Scan free tier rebuild (público, sin registro, theatrical reveal, CTA registro)

### Fase 3 — Crecimiento
- Colaboración multi-usuario en procesos
- Notificaciones y gestión del cambio ("el procedimiento X cambió, 3 de 5 responsables no lo han confirmado")
- Integraciones (Slack, Teams, Google Workspace)
- Módulo de onboarding basado en evaluaciones
- Programa de certificación ("Tu equipo está certificado en Proceso de Compras")
