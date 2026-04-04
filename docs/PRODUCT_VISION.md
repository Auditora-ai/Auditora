# Auditora.ai — Product Vision v3

**Version:** 3.0
**Fecha:** 2026-04-04
**Status:** Active — fuente de verdad

---

## La Tesis

Las empresas de 50 a 1000 empleados tienen un problema que nadie resuelve bien:

**Sus procesos existen, pero nadie los sigue.**

No porque sean malos empleados. Porque la capacitación no funciona — es aburrida, genérica, y no se mide. Cuando el gerente de compras se enfrenta a una decisión real ("el proveedor principal no entregó y el cliente exige mañana — qué hago?"), nadie sabe si va a seguir el procedimiento o improvisar.

Auditora resuelve esto poniendo los procesos de la empresa a prueba. Generas escenarios reales basados en SUS procesos y SUS procedimientos, y evalúas si el equipo toma las decisiones correctas. No es un examen. Es un caso Harvard con el contexto exacto de tu negocio.

**El dueño no compra "documentación de procesos". Compra "quiero saber dónde va a fallar mi operación mañana".**

---

## El Flujo — Un ciclo, no módulos sueltos

La app sigue un ciclo natural de BPM profesional. Cada fase alimenta la siguiente. No hay features desconectadas ni callejones sin salida.

```
ENTENDER → CAPTURAR → DOCUMENTAR → EVALUAR → ACTUAR → (repetir)
```

### Fase 0: ENTENDER — Discovery Organizacional

**Antes de capturar un solo proceso, hay que entender la empresa.**

Un consultor BPM no llega y dice "dime un proceso". Primero entiende el negocio: qué hace la empresa, cómo genera valor, cuáles son sus procesos críticos. Auditora replica esto con IA.

**Qué hace:**
La IA actúa como consultor BPM senior y entrevista al usuario sobre su empresa:
- ¿A qué se dedica tu empresa? (industria, producto/servicio)
- ¿Quién es tu cliente?
- ¿Cómo le llega tu producto al cliente? (cadena de valor)
- ¿Cuántos empleados? ¿Qué áreas/departamentos?
- ¿Tienen certificaciones? (ISO, IATF, etc.)

**Qué produce:**
- **Cadena de valor** (modelo Porter): actividades primarias y de soporte
- **Arquitectura de procesos sugerida**: procesos estratégicos, operativos y de soporte — generados por IA según industria, tamaño y contexto
- **Priorización**: el usuario valida, elimina, marca como críticos

**Por qué es esencial:**
- El consultor que llega con un nuevo cliente no sabe los nombres de los procesos — necesita entender la configuración de valor primero
- El CEO que se registra solo no sabe por dónde empezar — la IA le da el mapa
- Sin arquitectura de procesos, el usuario captura procesos al azar sin estrategia
- Con arquitectura, cada proceso capturado tiene contexto: tipo (estratégico/operativo/soporte), relación con otros procesos, prioridad

**Valor para el consultor:** En 20 minutos de chat con la IA tiene la cadena de valor y arquitectura de procesos de su nuevo cliente. Eso le tomaría 2-3 sesiones de levantamiento manual.

**Datos:** CompanyBrain, OrgContext (misión, visión, industria, estructura), ValueChainActivity, ProcessArchitecture, ProcessDefinition (generados en bloque con category y prioridad).

**Ruta:** `/discovery`

---

### Fase 1: CAPTURAR — Cómo los procesos entran al sistema

Los procesos existen en la cabeza de la gente. La ÚNICA forma real de capturar un proceso es hablar con quien lo ejecuta. En BPM esto se llama "process elicitation".

**3 métodos de captura — 3 formas de hacer lo mismo:**

**a) Entrevista SIPOC por Chat (método principal)**
La IA entrevista al process owner siguiendo el framework SIPOC:
- **Suppliers:** "¿Quién te da los insumos para arrancar?"
- **Inputs:** "¿Qué necesitas para empezar? ¿Documentos? ¿Materiales? ¿Aprobaciones?"
- **Process:** "Cuéntame paso a paso qué haces" — para cada paso pregunta: ¿Quién lo ejecuta? ¿Cuánto tarda? ¿Qué puede salir mal? ¿Qué haces cuando falla? ¿Quién aprueba?
- **Outputs:** "¿Qué produce este proceso al final?"
- **Customers:** "¿Quién recibe lo que este proceso produce?"

La IA ya conoce el contexto de la empresa (de la Fase 0), así que las preguntas son contextuales, no genéricas. Si sabe que es una manufactura automotriz, pregunta diferente que a una empresa de logística.

**b) Subir Documento Existente**
El usuario sube un PDF, Word, o manual interno que ya describe el proceso. La IA lo parsea y estructura en SIPOC/BPMN. Para empresas que ya tienen documentación pero quieren ponerla a prueba.

**c) Sesión en Vivo (premium)**
Bot se une a videollamada (Recall.ai), escucha, extrae la estructura SIPOC del diálogo natural. Feature premium de alto impacto en demos.

**Resultado de los 3 métodos:** Borrador del proceso que pasa automáticamente a documentación.

**Nota sobre el Scan de URL:** El scan de URL pública NO es captura de proceso — es una herramienta de marketing/lead-gen que muestra análisis superficial de la empresa. Vive en el funnel de adquisición (landing → scan → registro), no en el flujo core de la app. No produce procesos reales porque no tiene acceso a información interna. Su valor es impresionar al prospecto para que se registre.

**Ruta:** `/capture/[processId]` o `/capture/new`

---

### Fase 2: DOCUMENTAR — Donde viven los procesos

Una vez capturado, el proceso se documenta automáticamente. La documentación no es el producto — es el prerequisito para evaluar. Documentamos para poder poner a prueba.

Cada proceso documentado tiene:
- **Flujo visual** — diagrama paso a paso (vertical en mobile, BPMN exportable para técnicos)
- **Procedimiento (SOP)** — instrucción paso a paso, editable, versionado
- **RACI** — quién es Responsable, Aprobador, Consultado, Informado en cada paso
- **Riesgos (FMEA)** — por cada paso: qué puede fallar, Severidad × Frecuencia × Detectabilidad = RPN (Risk Priority Number). Esto ES la metodología FMEA aplicada, no un label
- **Historial** — versiones, cambios, quién editó qué

**La documentación es viva, no un PDF muerto:**
- El process owner puede editar cualquier paso
- La IA sugiere mejoras: "¿Qué pasa si el proveedor no tiene stock? No mencionaste ese caso"
- Se enriquece con resultados de evaluaciones: "el 60% del equipo falla en el paso 7 — considerar agregar checklist"

**Ciclo de vida del proceso:**
- `DRAFT` (gris) — existe en la arquitectura pero no se ha capturado
- `CAPTURED` (amarillo) — se hizo elicitation pero no está validado
- `DOCUMENTED` (azul) — validado por el process owner, listo para evaluar
- `EVALUATED` (verde/rojo) — tiene resultados de evaluación, score visible

**Ruta:** `/process/[processId]`

---

### Fase 3: EVALUAR — El producto que se vende

Aquí está el dinero. Las evaluaciones son la unidad de valor de Auditora.

**Cómo se generan los escenarios:**
La IA toma los riesgos del FMEA y los puntos de decisión del BPMN para generar escenarios Harvard-case. No son preguntas genéricas — salen del PROCESO REAL documentado de esa empresa.

Ejemplo: Si el paso 7 del proceso de Compras dice "Si el material no pasa inspección, rechazar y documentar" y el FMEA dice "Riesgo alto: frecuentemente se acepta material fuera de spec por presión de producción"...

→ **Escenario:** "Eres supervisor de calidad. Llega un lote del proveedor X. Tu medición muestra que está 2% fuera de especificación. El gerente de producción te llama y dice que la línea está parada y necesitan ese material HOY. ¿Qué haces?"
- Opción A: "Acepto el material para no parar la línea" → Incorrecto. Viola paso 7.
- Opción B: "Rechazo y documento según procedimiento" → Correcto. Alineado con SOP.
- Opción C: "Acepto condicionalmente y notifico a calidad" → Parcial. No está en el procedimiento actual.

**3 modos de la pantalla de Evaluación:**

**Modo Lanzar (manager):**
- Selecciona proceso → selecciona personas → ve los riesgos FMEA que serán base de escenarios
- "Generar y enviar evaluación" → IA crea escenarios, envía links
- Ve progreso: "3/8 personas han completado"

**Modo Tomar (evaluee):**
- Recibe link, abre en celular
- Pantalla completa, inmersivo, un escenario a la vez
- Contexto → "¿Qué haces?" → 3 opciones → Feedback con explicación → Siguiente
- 10-15 minutos máximo
- Score final con gaps específicos vinculados a pasos del proceso

**Modo Resultados (manager):**
- Por persona: score + gaps específicos ("María falla en pasos 7-9: manejo de material fuera de spec")
- Por proceso: % alineación del equipo, pasos más débiles, pasos más fuertes
- Comparativa antes/después entre evaluaciones
- Drill-down: decisiones exactas de cada persona vs respuesta correcta

**Ruta:** `/evaluate/[processId]` (lanzar/resultados) + `/intake/evaluacion/[token]` (tomar, público)

---

### Fase 4: ACTUAR — Mejora continua

Después de evaluar, la app no deja al usuario solo con un número. Le dice qué hacer.

**El HOME de la app es el estado de la operación:**
Lista de procesos de la organización con su estado de madurez y score. Agrupados por tipo (estratégico/operativo/soporte). El CEO abre la app, ve su operación en 10 segundos.

**El Panorama (dashboard ejecutivo) responde 3 preguntas:**
1. "¿Qué tan preparada está mi operación?" → Score global con tendencia
2. "¿Dónde están los huecos?" → Alertas: procesos vulnerables, riesgos sin mitigar, personas en riesgo
3. "¿Qué hago ahora?" → Acciones concretas: "Evalúa Compras", "Documenta Logística", "Re-evalúa Producción"

**El ciclo se cierra:**
Capturaste → Documentaste → Evaluaste → Identificaste gaps → Mejoraste procedimiento → Re-evaluaste → Mediste mejora

**Rutas:** `/` (home/mapa de procesos) + `/panorama` (dashboard ejecutivo)

---

## Navegación (Mobile-first)

La app tiene 4 secciones principales + configuración. En mobile, la navegación es bottom tabs o sidebar colapsada.

```
HOME (/)
├── Mapa de procesos con estados de madurez
├── FAB "+" para capturar nuevo proceso
│
DESCUBRIR (/discovery)
├── Discovery organizacional (primera vez)
├── Entrevista SIPOC (/capture/[id])
│
PROCESOS (/process/[id])
├── Flujo | Procedimiento | Riesgos | RACI | Historial
├── CTA "Evaluar equipo"
│
EVALUACIONES (/evaluate/[id])
├── Lanzar evaluación
├── Tomar evaluación (/intake/evaluacion/[token])
├── Resultados por persona y proceso
│
PANORAMA (/panorama)
├── Score global + tendencia
├── Alertas + acciones accionables
│
CONFIGURACIÓN (bottom)
├── Org, miembros, facturación
```

### Lo que desaparece como módulo independiente:

| Módulo viejo | Destino |
|---|---|
| Sessions | Canal dentro de Captura (sesión en vivo) |
| Riesgos | Propiedad de cada proceso (tab FMEA) |
| Procedimientos | Tab dentro de cada proceso |
| Simulations | Renombrado a Evaluaciones |
| Evaluation | Dashboard dentro de Evaluaciones |
| Deliverables | Exportar dentro de Procesos y Evaluaciones |
| Discovery (chat viejo) | Reemplazado por Discovery Organizacional + Entrevista SIPOC |
| Documents | Eliminado — documentos viven dentro de procesos |
| Assistant | Eliminado — la IA está integrada en cada fase |
| Scan (dentro de app) | Movido a funnel de marketing (público, sin auth) |

---

## Propuesta de Valor por Perfil

**Dueño / CEO:**
"Quiero saber si mi equipo está listo para la próxima crisis. Auditora me dice exactamente quién y dónde va a fallar, basado en mis propios procesos."

**Gerente de Operaciones:**
"Quiero que mis procesos sean más que un PDF que nadie lee. Auditora los convierte en escenarios de prueba que mi equipo puede practicar."

**Responsable de RH / Capacitación:**
"La capacitación genérica no funciona. Auditora genera evaluaciones personalizadas con los casos reales de cada departamento. Puedo medir quién necesita ayuda y en qué."

**Consultor BPM:**
"Auditora me ayuda a entender el negocio de mi cliente en 20 minutos (Discovery), capturar procesos más rápido (SIPOC por chat), y demostrar valor con datos concretos de evaluación. Lo que me tomaba 2 semanas de levantamiento lo hago en 2 días."

---

## Metodologías Aplicadas (no solo mencionadas)

| Metodología | Dónde se aplica | Cómo se materializa en la app |
|---|---|---|
| **SIPOC** (Six Sigma) | Fase 1: Captura | Framework de la entrevista IA — las preguntas siguen S-I-P-O-C con indicador visual de fase |
| **BPMN 2.0** (OMG) | Fase 2: Documentación | Diagrama de flujo generado automáticamente, exportable a XML, editable |
| **FMEA** (ISO/TS 16949) | Fase 2: Tab Riesgos | Severidad × Frecuencia × Detectabilidad = RPN por cada paso del proceso |
| **Caso Harvard** | Fase 3: Evaluación | Escenarios de decisión situacional generados del FMEA + BPMN del proceso real |
| **RACI** | Fase 2: Tab RACI | Matriz Responsable/Aprobador/Consultado/Informado por paso |
| **Cadena de Valor (Porter)** | Fase 0: Discovery | Mapeo de actividades primarias y de soporte de la empresa |
| **Arquitectura de Procesos** | Fase 0: Discovery | Clasificación estratégico/operativo/soporte con priorización |

Cada metodología tiene implementación real en el código, no es solo un label en la landing.

---

## Métricas de Impacto

| Métrica | Antes | Después | Cómo se mide |
|---|---|---|---|
| Alineación procedimental | ? | 72% → 89% | Score promedio en evaluaciones |
| Tiempo de onboarding | 3 semanas | 1 semana | Evaluación de nuevo empleado vs benchmark |
| Errores operacionales | 12/mes | 3/mes | Trackeo antes/después de evaluaciones |
| Tiempo de decisión en crisis | Desconocido | 4.2 min promedio | Tiempo de respuesta en evaluaciones |
| Costo de no-compliance | ? | -$200K/año | Riesgos mitigados por persona capacitada |

---

## Modelo de Negocio

### Unidad de valor: Evaluaciones completadas.

La empresa paga por evaluar a su gente. La documentación de procesos es el prerequisite — necesitas procesos documentados para generar evaluaciones relevantes. Pero el dinero está en las evaluaciones.

#### Funnel de Adquisición

```
LANDING (marketing)
  ↓
SCAN GRATIS (público, sin registro)
  "Pega tu URL y ve qué tan expuesta está tu operación"
  → Impresionar al prospecto (herramienta de marketing, no de captura)
  ↓
REGISTRO
  → Discovery organizacional: la IA entiende el negocio y genera arquitectura de procesos
  ↓
PRUEBA GRATIS (14 días)
  - Capturar hasta 3 procesos (via SIPOC chat o documento)
  - Generar hasta 10 evaluaciones
  - Ver resultados y dashboard de riesgo humano
  ↓
CONVERSIÓN
  "Tu equipo tiene 62% de alineación. Upgrade para evaluar a todos."
```

#### Planes

| | Starter | Growth | Scale | Enterprise |
|---|---|---|---|---|
| **Para quién** | Empieza con 1 proceso clave | Cubre un área completa | Toda la operación | Custom |
| **Precio** | $49/mes | $199/mes | $499/mes | Custom |
| **Procesos** | 3 | 15 | Ilimitados | Ilimitados |
| **Evaluaciones/mes** | 10 | 50 | 250 | Ilimitadas |
| **Evaluadores** | 5 personas | 30 personas | 150 personas | Ilimitados |
| **Sesiones IA** | 3/mes | 10/mes | Ilimitadas | Ilimitadas |
| **Reportes** | 1/mes | 10/mes | Ilimitados | Ilimitados |
| **Usuarios admin** | 2 | 5 | 15 | Ilimitados |
| **Export** | PDF básico | PDF + PPTX + Excel | Todo + API | Todo + API + SSO |

**Lógica:**
- Evaluaciones son consumibles naturales (se agotan, se renuevan mensualmente)
- Procesos documentados son sunk cost (high switching cost — no te vas a ir y empezar de cero)
- El valor es medible: "pasamos de 45% a 82% de alineación en 3 meses"

---

## Estructura de Código

### Rutas del SaaS

```
[orgSlug]/                      → HOME: mapa de procesos con madurez
[orgSlug]/discovery             → Discovery organizacional (Fase 0)
[orgSlug]/capture/new           → Nuevo proceso + selección de método
[orgSlug]/capture/[processId]   → Entrevista SIPOC (Fase 1)
[orgSlug]/process/[processId]   → Documento vivo con tabs (Fase 2)
[orgSlug]/evaluate/[processId]  → Lanzar + resultados (Fase 3)
[orgSlug]/panorama              → Dashboard ejecutivo (Fase 4)
/intake/evaluacion/[token]      → Tomar evaluación (público, sin auth)
/scan                           → Scan público (marketing funnel)
```

### Módulos del SaaS

```
modules/
├── home/           → Mapa de procesos (HOME)
├── discovery/      → Discovery organizacional (Fase 0)
├── capture/        → Entrevista SIPOC + método selector (Fase 1)
├── process/        → Documento vivo: flujo, SOP, FMEA, RACI (Fase 2)
├── evaluate/       → Evaluaciones Harvard-case (Fase 3)
├── panorama/       → Dashboard ejecutivo (Fase 4)
├── auth/           → Autenticación
├── organizations/  → Gestión de org
├── settings/       → Configuración
├── payments/       → Facturación
├── onboarding/     → Wizard de registro
├── shared/         → Componentes compartidos
└── i18n/           → Internacionalización
```

### Modelos de Datos (Prisma)

| Fase | Modelos |
|---|---|
| Discovery | CompanyBrain, OrgContext, ValueChainActivity, ProcessArchitecture |
| Captura | ProcessDefinition, DiscoveryThread, DiscoveryMessage |
| Documentación | ProcessDefinition (bpmnXml), Procedure, RaciEntry, ProcessRisk |
| Evaluación | SimulationTemplate, SimulationScenario, Decision, DecisionResponse, SimulationRun |
| Mejora | HumanRiskProfile, ProcessVersion, ProcessActivityLog |

---

## Roadmap

### Fase 1 — Fundamentos (actual)
- ✅ Discovery organizacional (cadena de valor + arquitectura de procesos)
- ✅ HOME como mapa de procesos con estados de madurez
- ✅ Captura SIPOC por chat con indicador de fase
- ✅ Proceso como documento vivo (flujo + SOP + FMEA + RACI)
- ✅ Evaluaciones Harvard-case (lanzar + tomar + resultados)
- ✅ Panorama ejecutivo con alertas y acciones
- [ ] Conectar frontend a backend real (mock → API)
- [ ] Rediseñar onboarding: cuenta → empresa → Discovery → primer proceso
- [ ] Actualizar modelo de negocio en payments (evaluaciones como unidad)

### Fase 2 — El Producto que se Vende
- Generación automática de escenarios desde FMEA + BPMN
- Dashboard de riesgo humano por persona y por proceso
- Before/after metrics (alineación procedimental)
- Reportes exportables para junta directiva (PDF + PPTX)
- Scan free tier como herramienta de marketing (público, impactante, CTA registro)

### Fase 3 — Crecimiento
- Colaboración multi-usuario en procesos
- Notificaciones y gestión del cambio
- Integraciones (Slack, Teams, Google Workspace)
- Programa de certificación ("Tu equipo está certificado en Proceso de Compras")
- API pública para enterprise
