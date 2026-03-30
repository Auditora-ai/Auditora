# AUDITORA.AI — DIAGNÓSTICO COMPLETO, REDISEÑO Y PROMPT MAESTRO

**Versión:** 1.0  
**Fecha:** 29 de marzo de 2026  
**Clasificación:** Documento interno — Roadmap de producto

---

## PARTE 1: DIAGNÓSTICO GENERAL

### Veredicto brutal

La aplicación actual de Auditora.ai opera a un nivel 4/10 en términos de calidad enterprise. La landing page transmite autoridad y sofisticación, pero al entrar a `app.auditora.ai` el usuario experimenta una disonancia inmediata: módulos incompletos, copy genérico que parece placeholder, flujos rotos, ausencia de estados vacíos profesionales, cero micro-interacciones, tipografía inconsistente, y una navegación que no distingue entre los dos perfiles críticos de usuario (CEO/Director y BPM Modeler). En su estado actual, la aplicación no sobreviviría una demo con un Director de Auditoría Interna de una empresa mediana. No transmite la precisión técnica ni la confiabilidad que exige este mercado.

### Problemas sistémicos transversales

1. **Branding roto entre landing y app.** La landing usa la paleta `#0A1428` / `#00E5C0` con tipografía premium. La app usa grises genéricos, azules de librería, y fuentes por defecto.
2. **Copy amateur.** Títulos como "Bienvenido a tu Dashboard" o "Crear nuevo análisis" son genéricos. Un producto enterprise para auditores no habla así. Debe usar terminología técnica precisa: "Centro de Control Operativo", "Iniciar Evaluación de Proceso", etc.
3. **Cero estados vacíos.** Cuando un módulo no tiene datos, muestra un vacío blanco o un "No hay datos" sin contexto, sin ilustración, sin call-to-action.
4. **Navegación plana.** No existe distinción entre el flujo del CEO (que necesita visión ejecutiva, KPIs, reportes y autoservicio rápido) y el BPM Modeler (que necesita herramientas técnicas: editor BPMN, matrices FMEA, simulación de procesos).
5. **Sin responsive real.** Los módulos se rompen en tablet y móvil.
6. **Sin animaciones.** La app se siente estática y muerta. Cero transiciones, cero feedback visual.
7. **Accesibilidad inexistente.** Sin focus states, sin aria-labels, sin contraste verificado.
8. **Sin onboarding.** El usuario nuevo llega a un Dashboard vacío sin saber qué hacer.

---

## PARTE 2: ARQUITECTURA DE NAVEGACIÓN POR ROLES

### Filosofía de navegación

La sidebar izquierda es el centro nervioso. Debe adaptarse al rol del usuario logueado. Ambos roles comparten la misma app, pero ven menús diferentes con módulos compartidos donde aplique.

---

### ROL 1: CEO / Director / Gerente de Mejora Continua

**Perfil:** Necesita visión ejecutiva, autoservicio rápido para iniciar análisis, y acceso a reportes sin depender del equipo técnico.

```
SIDEBAR — CEO / Director
─────────────────────────────────
🏠  Centro de Control              (Dashboard ejecutivo)
📊  Análisis Rápido                (Autoservicio: iniciar evaluación)
    ├── Nuevo Análisis de Proceso
    ├── Evaluación de Riesgos
    └── Auditoría Express
📈  Reportes & Hallazgos           (Reportes generados, exportación)
    ├── Reportes Activos
    ├── Hallazgos Críticos
    └── Exportar a PDF/PPTX
🎯  Panel de Riesgos               (Vista consolidada de riesgos)
📋  Planes de Acción               (Seguimiento de mejoras)
📂  Historial de Proyectos         (Archivo de análisis completados)
⚙️  Configuración
    ├── Mi Organización
    ├── Usuarios & Permisos
    ├── Integraciones
    ├── Facturación
    └── API & Webhooks
─────────────────────────────────
👤  Mi Cuenta                      (Perfil, preferencias)
❓  Centro de Ayuda                (Docs, soporte, onboarding)
```

---

### ROL 2: BPM Modeler / Analista de Procesos / Auditor Técnico

**Perfil:** Necesita herramientas técnicas profundas para modelar procesos, construir matrices de riesgo, ejecutar simulaciones y documentar hallazgos.

```
SIDEBAR — BPM Modeler / Analista
─────────────────────────────────
🏠  Centro de Trabajo              (Dashboard técnico: mis tareas)
🔧  Modelado de Procesos
    ├── Editor BPMN 2.0
    ├── Biblioteca de Procesos
    └── Plantillas de Flujo
🧮  Matrices de Evaluación
    ├── Matriz FMEA
    ├── Matriz de Riesgos
    └── Análisis de Controles
📐  Simulación & Mining
    ├── Simulador de Procesos
    ├── Process Mining (importar logs)
    └── Análisis de Cuellos de Botella
📊  Análisis & Evaluaciones
    ├── Nuevo Análisis
    ├── Evaluaciones en Curso
    └── Mis Hallazgos
📈  Reportes Técnicos
    ├── Generar Reporte
    ├── Plantillas de Reporte
    └── Exportación Avanzada
📂  Mis Proyectos                  (Workspace personal)
⚙️  Configuración
    ├── Mi Perfil
    ├── Preferencias de Editor
    └── Notificaciones
─────────────────────────────────
❓  Documentación Técnica          (API docs, guías BPMN)
```

---

### MÓDULOS COMPARTIDOS (visibles para ambos roles)

- Historial de Proyectos / Mis Proyectos
- Reportes (con diferente nivel de detalle según rol)
- Configuración (CEO ve facturación y org; Modeler ve perfil y preferencias)
- Centro de Ayuda

---

## PARTE 3: DIAGNÓSTICO Y REDISEÑO — MÓDULO POR MÓDULO

---

### MÓDULO 1: DASHBOARD (Centro de Control / Centro de Trabajo)

**Diagnóstico actual:**  
El Dashboard actual es una pantalla casi vacía con un saludo genérico ("Bienvenido, [nombre]"), dos o tres cards con números sin contexto, y ningún flujo de acción. No hay KPIs reales, no hay gráficos de tendencia, no hay alertas, no hay accesos rápidos funcionales. Para un CEO es inútil porque no puede tomar decisiones con lo que ve. Para un Modeler es inútil porque no muestra sus tareas pendientes ni el estado de sus proyectos. Los cards no tienen tooltips, no hay drill-down, y el diseño parece un template de admin panel de Bootstrap.

**Cambios y estándares a aplicar:**

1. Separar en dos versiones: Dashboard CEO (Centro de Control Operativo) y Dashboard Modeler (Centro de Trabajo).
2. CEO Dashboard: 4-6 KPI cards con sparklines, gráfico de tendencia de riesgos (30/60/90 días), tabla de hallazgos críticos recientes, acceso rápido a "Iniciar Análisis Rápido".
3. Modeler Dashboard: lista de tareas asignadas, procesos en edición, evaluaciones pendientes de revisión, actividad reciente del equipo.
4. Aplicar paleta exacta: fondo `#0A1428`, cards con `#111827`, bordes `rgba(0, 229, 192, 0.1)`, texto principal `#F1F5F9`, secundario `#64748B`.
5. Todos los números deben tener contexto: "12 hallazgos críticos" con indicador ▲ o ▼ vs. período anterior.
6. Animaciones: fade-up escalonado en cards (GSAP, stagger 0.1s), hover scale 1.02 con sombra `0 8px 32px rgba(0, 229, 192, 0.08)`.
7. Estado vacío profesional: ilustración SVG minimalista + texto "Aún no hay datos de análisis. Inicia tu primera evaluación para visualizar métricas operativas." + botón CTA.
8. Responsive: stack vertical en tablet, cards de ancho completo en móvil.

**Rediseño propuesto — CEO Dashboard:**

```
LAYOUT:
┌─────────────────────────────────────────────────────┐
│  Centro de Control Operativo                        │
│  Visión consolidada del estado de tus procesos      │
│  y evaluaciones activas.                            │
├──────────┬──────────┬──────────┬───────────────────│
│ PROCESOS │ RIESGOS  │HALLAZGOS │ EVALUACIONES      │
│ ACTIVOS  │ CRÍTICOS │ ABIERTOS │ EN CURSO          │
│   24     │    7 ▲2  │   18 ▼3  │    5              │
│ sparkline│ sparkline│ sparkline│ sparkline         │
├──────────┴──────────┴──────────┴───────────────────│
│                                                     │
│  ┌─────────────────────┐ ┌────────────────────────┐│
│  │ Tendencia de Riesgos│ │ Hallazgos Recientes   ││
│  │ [Gráfico área 90d]  │ │ [Tabla: 5 últimos]    ││
│  │                     │ │ Severidad | Proceso   ││
│  │                     │ │ Fecha     | Estado    ││
│  └─────────────────────┘ └────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ Acciones Rápidas                                ││
│  │ [Iniciar Análisis] [Ver Reportes] [Panel Riesg]││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Copy exacto:**

- Título: `Centro de Control Operativo`
- Subtítulo: `Visión consolidada del estado de tus procesos y evaluaciones activas.`
- KPI labels: `Procesos Activos` · `Riesgos Críticos` · `Hallazgos Abiertos` · `Evaluaciones en Curso`
- Sección gráfico: `Tendencia de Riesgos — Últimos 90 días`
- Sección tabla: `Hallazgos Recientes`
- Columnas tabla: `Severidad` · `Proceso Afectado` · `Fecha de Detección` · `Estado`
- Botones acciones: `Iniciar Análisis Rápido` · `Ver Reportes` · `Panel de Riesgos`
- Estado vacío: `Aún no hay datos de análisis. Inicia tu primera evaluación para visualizar métricas operativas.`
- Botón estado vacío: `Iniciar Primera Evaluación →`

---

### MÓDULO 2: NUEVO ANÁLISIS / ANÁLISIS RÁPIDO

**Diagnóstico actual:**  
El flujo de "Nuevo Análisis" es un formulario básico con campos genéricos (nombre, descripción, un dropdown). No guía al usuario por un proceso estructurado. No hay wizard multi-step. No hay selección de tipo de análisis (proceso, riesgo, auditoría). No hay templates predefinidos. No hay preview de lo que se va a generar. El CEO que llega aquí no sabe qué llenar ni qué esperar como resultado. El copy es tipo "Ingresa el nombre del análisis" — completamente genérico.

**Cambios y estándares a aplicar:**

1. Convertir en wizard de 4 pasos con progress bar horizontal.
2. Paso 1: Selección de tipo de evaluación (cards visuales: Análisis de Proceso, Evaluación de Riesgos, Auditoría Express).
3. Paso 2: Configuración del alcance (seleccionar proceso, área, responsable, periodo).
4. Paso 3: Parámetros de evaluación (criterios, framework a usar: ISO 31000, COSO, personalizado).
5. Paso 4: Revisión y confirmación con preview del análisis configurado.
6. Templates predefinidos: "Auditoría de Proceso de Compras", "Evaluación de Riesgo Operativo", "Análisis de Ciclo de Ingresos", etc.
7. Autoguardado en cada paso.
8. Animaciones: slide-in horizontal entre pasos, fade-up en cards de selección.

**Rediseño propuesto:**

```
LAYOUT — PASO 1:
┌─────────────────────────────────────────────────────┐
│  Iniciar Evaluación                                 │
│  Selecciona el tipo de evaluación que deseas        │
│  realizar sobre tus procesos.                       │
│                                                     │
│  ● ─ ─ ─ ○ ─ ─ ─ ○ ─ ─ ─ ○                        │
│  Tipo    Alcance  Parámetros Confirmar              │
│                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │ ◈            │ │ ⚠            │ │ ✓            ││
│  │ Análisis de  │ │ Evaluación   │ │ Auditoría    ││
│  │ Proceso      │ │ de Riesgos   │ │ Express      ││
│  │              │ │              │ │              ││
│  │ Evaluación   │ │ Identifica y │ │ Revisión     ││
│  │ integral de  │ │ clasifica    │ │ rápida con   ││
│  │ flujos opera-│ │ riesgos con  │ │ checklist    ││
│  │ tivos con    │ │ metodología  │ │ predefinido  ││
│  │ detección de │ │ cuantitativa │ │ y resultado  ││
│  │ ineficiencias│ │ y cualitativa│ │ en 15 min    ││
│  └──────────────┘ └──────────────┘ └──────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ Usar plantilla predefinida ▾                    ││
│  │ • Auditoría de Proceso de Compras               ││
│  │ • Evaluación de Riesgo Operativo                ││
│  │ • Análisis de Ciclo de Ingresos                 ││
│  │ • Revisión de Controles SOX                     ││
│  └─────────────────────────────────────────────────┘│
│                                         [Siguiente →]│
└─────────────────────────────────────────────────────┘
```

**Copy exacto:**

- Título: `Iniciar Evaluación`
- Subtítulo: `Selecciona el tipo de evaluación que deseas realizar sobre tus procesos.`
- Steps: `Tipo de Evaluación` → `Alcance y Contexto` → `Parámetros` → `Confirmar y Ejecutar`
- Card 1 título: `Análisis de Proceso`
- Card 1 desc: `Evaluación integral de flujos operativos con detección automatizada de ineficiencias, cuellos de botella y desviaciones.`
- Card 2 título: `Evaluación de Riesgos`
- Card 2 desc: `Identificación y clasificación de riesgos con metodología cuantitativa y cualitativa alineada a ISO 31000.`
- Card 3 título: `Auditoría Express`
- Card 3 desc: `Revisión rápida basada en checklist predefinido con resultado ejecutivo en menos de 15 minutos.`
- Dropdown: `Usar plantilla predefinida`
- Botón: `Siguiente →`
- Paso 2 título: `Definir Alcance y Contexto`
- Paso 2 subtítulo: `Especifica el proceso, área organizacional y período que abarcará esta evaluación.`
- Campos paso 2: `Proceso a evaluar` · `Área / Departamento` · `Responsable de proceso` · `Período de evaluación` · `Alcance geográfico (opcional)`
- Paso 3 título: `Configurar Parámetros de Evaluación`
- Paso 3 subtítulo: `Define los criterios y el framework metodológico para esta evaluación.`
- Campos paso 3: `Framework de referencia` (dropdown: ISO 31000, COSO ERM, Personalizado) · `Nivel de profundidad` (Estratégico, Táctico, Operativo) · `Criterios de evaluación` (multi-select chips) · `Umbral de materialidad`
- Paso 4 título: `Revisión y Confirmación`
- Paso 4 subtítulo: `Verifica la configuración antes de iniciar la evaluación.`
- Botón final: `Iniciar Evaluación →`
- Loading state: `Configurando evaluación...` con progress indicator.

---

### MÓDULO 3: EDITOR BPMN 2.0

**Diagnóstico actual:**  
El editor BPMN actual es una implementación básica (probablemente bpmn.js sin customización) con la toolbar por defecto, sin la paleta de colores de la app, sin plantillas, sin integración con el módulo de riesgos, y sin capacidad de anotar o vincular hallazgos directamente sobre el diagrama. La experiencia es la de un editor genérico embebido, no la de una herramienta integrada a un ecosistema de auditoría. No hay auto-save, no hay versionado, no hay colaboración, no hay export profesional.

**Cambios y estándares a aplicar:**

1. Re-skinning completo de bpmn.js con la paleta de Auditora.ai (fondo `#0A1428`, nodos con bordes `#00E5C0`, selección con glow teal).
2. Panel lateral derecho: propiedades del elemento seleccionado + pestaña de riesgos vinculados + pestaña de controles asociados.
3. Toolbar superior rediseñada: agrupar herramientas por categoría (Elementos, Conectores, Anotaciones, Vista, Exportar).
4. Biblioteca de plantillas BPMN precargadas (Proceso de compras, Onboarding, Cierre contable, etc.).
5. Anotaciones de riesgo directamente sobre los nodos (indicador visual de nivel de riesgo: verde/amarillo/rojo).
6. Auto-save cada 30 segundos con indicador visual sutil.
7. Versionado: historial de versiones con diff visual.
8. Exportación: PNG HD, SVG, PDF, BPMN XML.
9. Zoom controls, minimap, breadcrumb de navegación.
10. Shortcuts de teclado profesionales.

**Rediseño propuesto:**

```
LAYOUT:
┌──────────────────────────────────────────────────────────┐
│ ← Biblioteca    Proceso: Ciclo de Compras v2.3          │
│                  Último guardado: hace 2 min ✓           │
├──────────────────────────────────────────────────────────┤
│ TOOLBAR                                                  │
│ [Elementos ▾] [Conectores ▾] [Anotaciones ▾] [Vista ▾] │
│ [Deshacer] [Rehacer] | [Zoom -] 100% [Zoom +] [Ajustar]│
│ [Exportar ▾] [Versiones] [Compartir]                    │
├────────────────────────────────────────────┬─────────────┤
│                                            │ PANEL       │
│                                            │ LATERAL     │
│         CANVAS BPMN                        │             │
│         (fondo: #0A1428)                   │ Propiedades │
│                                            │ ──────────  │
│   ┌─────┐    ┌─────┐    ┌─────┐           │ Nombre:     │
│   │Start│───→│Task │───→│ End │           │ [input]     │
│   │  ●  │    │  ⚠  │    │  ●  │           │ Tipo:       │
│   └─────┘    └─────┘    └─────┘           │ [dropdown]  │
│              riesgo:alto                   │             │
│                                            │ Riesgos     │
│                                            │ ──────────  │
│                                            │ 2 riesgos   │
│                                            │ vinculados  │
│                                            │ [+ Vincular]│
│  ┌────────────────┐                        │             │
│  │ MINIMAP        │                        │ Controles   │
│  │                │                        │ ──────────  │
│  └────────────────┘                        │ 1 control   │
├────────────────────────────────────────────┴─────────────┤
│  Atajos: Space+Drag=Pan | Ctrl+Z=Deshacer | Del=Borrar  │
└──────────────────────────────────────────────────────────┘
```

**Copy exacto:**

- Header: `← Biblioteca de Procesos` (breadcrumb)
- Título dinámico: `[Nombre del proceso] v[versión]`
- Indicador: `Último guardado: hace [X] min ✓` / `Guardando...` / `Sin conexión — cambios locales`
- Toolbar groups: `Elementos` · `Conectores` · `Anotaciones` · `Vista` · `Exportar`
- Panel lateral tabs: `Propiedades` · `Riesgos Vinculados` · `Controles Asociados` · `Historial`
- Campos propiedades: `Nombre del Elemento` · `Tipo` · `Responsable` · `Descripción` · `Documentación`
- Botón riesgos: `+ Vincular Riesgo`
- Botón controles: `+ Asociar Control`
- Exportar opciones: `Exportar como PNG (alta resolución)` · `Exportar como SVG` · `Exportar como PDF` · `Descargar BPMN XML`
- Versiones: `Historial de Versiones` · `Comparar con versión anterior`
- Estado vacío canvas: `Arrastra elementos desde la barra de herramientas o selecciona una plantilla para comenzar.`
- Footer atajos: `Space + Arrastrar = Pan` · `Ctrl + Z = Deshacer` · `Ctrl + S = Guardar` · `Del = Eliminar Elemento`

---

### MÓDULO 4: MATRIZ FMEA (Failure Mode and Effects Analysis)

**Diagnóstico actual:**  
La matriz FMEA actual es una tabla HTML básica con inputs editables, sin cálculo automático de RPN (Risk Priority Number), sin código de colores por severidad, sin filtros, sin exportación, sin guía metodológica, y sin integración con los procesos BPMN. Es básicamente una spreadsheet dentro de la app. No hay validación de datos, no hay escalas predefinidas de severidad/ocurrencia/detección, y los headers de columna usan terminología incorrecta o incompleta.

**Cambios y estándares a aplicar:**

1. Tabla profesional con columnas correctas FMEA: Modo de Falla, Efecto, Severidad (1-10), Causa Potencial, Ocurrencia (1-10), Control Actual, Detección (1-10), RPN (auto-calculado), Acción Recomendada, Responsable, Fecha Límite, Estado.
2. RPN auto-calculado = Severidad × Ocurrencia × Detección. Color coding: ≤50 verde, 51-200 amarillo, 201-500 naranja, >500 rojo.
3. Escalas predefinidas con tooltips explicativos para cada nivel de S, O y D.
4. Filtros por severidad, por proceso vinculado, por responsable, por estado.
5. Ordenamiento por RPN descendente (mayor riesgo primero).
6. Integración: vincular cada modo de falla a un nodo BPMN específico.
7. Exportación: Excel con formato, PDF con branding.
8. Vista de heatmap: visualización matricial de Severidad vs. Ocurrencia.
9. Historial de cambios por celda.
10. Guía metodológica inline: tooltip en cada header de columna explicando el criterio.

**Rediseño propuesto:**

```
LAYOUT:
┌─────────────────────────────────────────────────────────┐
│  Matriz FMEA — Análisis de Modos de Falla y Efectos    │
│  Proceso: Ciclo de Compras | 14 modos de falla         │
│                                                         │
│  [Filtrar ▾] [Ordenar por RPN ▾] [Vista: Tabla|Heatmap]│
│  [+ Agregar Modo de Falla]  [Exportar ▾]               │
├─────────────────────────────────────────────────────────┤
│ #  │ Modo de │ Efecto │ SEV│Causa  │ OCC│Control│ DET│ RPN │
│    │ Falla   │        │ ⓘ │       │ ⓘ │Actual │ ⓘ │     │
├────┼─────────┼────────┼────┼───────┼────┼───────┼────┼─────┤
│ 1  │ Orden   │ Retraso│  8 │ Falta │  6 │ Revi- │  7 │ 336 │
│    │ de comp-│ en pro-│    │ de va-│    │ sión  │    │ ███ │
│    │ ra sin  │ ducción│    │ lida- │    │ manual│    │naranja
│    │ aprob.  │        │    │ ción  │    │ semanal    │     │
├────┼─────────┼────────┼────┼───────┼────┼───────┼────┼─────┤
│ 2  │ Provee- │ Sobre- │  6 │ Base  │  4 │ Comp. │  5 │ 120 │
│    │ dor no  │ costo  │    │ datos │    │ trim. │    │ ███ │
│    │ evalua- │ +15%   │    │ desac-│    │       │    │amarillo
│    │ do      │        │    │ tualiz│    │       │    │     │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  Resumen: RPN Promedio: 187 | Críticos (>200): 5        │
│  Distribución: ██ Alto 36% | ██ Medio 43% | ██ Bajo 21%│
└─────────────────────────────────────────────────────────┘
```

**Copy exacto:**

- Título: `Matriz FMEA — Análisis de Modos de Falla y Efectos`
- Subtítulo: `Proceso: [Nombre del proceso] | [N] modos de falla registrados`
- Columnas: `#` · `Modo de Falla` · `Efecto Potencial` · `SEV` · `Causa Potencial` · `OCC` · `Control Actual` · `DET` · `RPN` · `Acción Recomendada` · `Responsable` · `Fecha Límite` · `Estado`
- Tooltip SEV: `Severidad (1-10): Impacto del efecto en el cliente o proceso. 1 = Imperceptible, 10 = Peligroso sin aviso.`
- Tooltip OCC: `Ocurrencia (1-10): Frecuencia estimada de la causa. 1 = Improbable, 10 = Casi inevitable.`
- Tooltip DET: `Detección (1-10): Capacidad del control actual para detectar la falla. 1 = Detección casi segura, 10 = Sin capacidad de detección.`
- RPN formula display: `RPN = Severidad × Ocurrencia × Detección`
- Color legend: `■ Bajo (≤50)` · `■ Moderado (51-200)` · `■ Alto (201-500)` · `■ Crítico (>500)`
- Botón agregar: `+ Agregar Modo de Falla`
- Exportar opciones: `Exportar a Excel` · `Exportar a PDF` · `Generar Reporte FMEA`
- Vista toggle: `Tabla` · `Heatmap` · `Pareto`
- Filtros: `Filtrar por Severidad` · `Filtrar por Proceso` · `Filtrar por Responsable` · `Filtrar por Estado`
- Resumen footer: `RPN Promedio: [N]` · `Modos Críticos (RPN > 200): [N]` · `Distribución de Riesgo`
- Estado vacío: `No se han registrado modos de falla. Agrega el primer modo de falla para comenzar el análisis FMEA.`

---

### MÓDULO 5: REPORTES & HALLAZGOS

**Diagnóstico actual:**  
El módulo de reportes muestra una lista plana de "reportes" que son básicamente PDFs generados con formato mínimo, sin branding, sin estructura ejecutiva, sin gráficos incrustados, y sin la posibilidad de personalizar secciones. No hay distinción entre reporte ejecutivo (para CEO) y reporte técnico (para auditor). No hay plantillas. No hay preview antes de generar. El copy es genérico: "Descargar reporte", "Ver reporte".

**Cambios y estándares a aplicar:**

1. Generador de reportes con wizard: seleccionar tipo → personalizar secciones → preview → exportar.
2. Tipos de reporte: Ejecutivo (resumen, KPIs, hallazgos top, recomendaciones), Técnico (detalle completo, evidencia, matrices), Auditoría (formato estándar IIA).
3. Preview en tiempo real del reporte antes de exportar.
4. Exportación: PDF con branding de Auditora.ai, PPTX para presentaciones, DOCX editable.
5. Sección de hallazgos con clasificación por severidad, estado, y proceso.
6. Tabla de hallazgos con: ID, Descripción, Severidad, Proceso Afectado, Evidencia, Recomendación, Responsable, Fecha Compromiso, Estado.
7. Dashboard de hallazgos: conteo por severidad, aging de hallazgos abiertos, gráfico de resolución.

**Rediseño propuesto:**

```
LAYOUT:
┌─────────────────────────────────────────────────────────┐
│  Reportes & Hallazgos                                   │
│  Genera reportes profesionales y gestiona hallazgos     │
│  de tus evaluaciones activas.                           │
│                                                         │
│  [Reportes] [Hallazgos] [Plantillas]    ← tabs          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TAB: REPORTES                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [+ Generar Nuevo Reporte]           [Buscar...]    ││
│  │                                                     ││
│  │ ┌─────────┬──────────┬────────┬────────┬─────────┐ ││
│  │ │ Nombre  │ Tipo     │ Fecha  │ Estado │ Acciones│ ││
│  │ ├─────────┼──────────┼────────┼────────┼─────────┤ ││
│  │ │ Reporte │Ejecutivo │ 15/03  │ Final  │ ⬇ 👁 ✏ │ ││
│  │ │ Q1 2026 │          │        │        │         │ ││
│  │ ├─────────┼──────────┼────────┼────────┼─────────┤ ││
│  │ │ Auditoría│Técnico  │ 02/03  │Borrador│ ⬇ 👁 ✏ │ ││
│  │ │ Compras │          │        │        │         │ ││
│  │ └─────────┴──────────┴────────┴────────┴─────────┘ ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  TAB: HALLAZGOS                                         │
│  ┌────────┬────────┬────────┬────────┐                  │
│  │Críticos│ Altos  │ Medios │ Bajos  │  ← severity     │
│  │   3    │   8    │   12   │   5    │     cards        │
│  └────────┴────────┴────────┴────────┘                  │
│  [tabla de hallazgos con filtros]                        │
└─────────────────────────────────────────────────────────┘
```

**Copy exacto:**

- Título: `Reportes & Hallazgos`
- Subtítulo: `Genera reportes profesionales y gestiona los hallazgos de tus evaluaciones activas.`
- Tabs: `Reportes Generados` · `Hallazgos` · `Plantillas de Reporte`
- Botón: `+ Generar Nuevo Reporte`
- Columnas reportes: `Nombre del Reporte` · `Tipo` · `Fecha de Generación` · `Estado` · `Acciones`
- Estados reporte: `Borrador` · `En Revisión` · `Final` · `Archivado`
- Tipos reporte: `Ejecutivo` · `Técnico Detallado` · `Auditoría IIA` · `Personalizado`
- Acciones: `Descargar` · `Vista Previa` · `Editar` · `Duplicar` · `Archivar`
- Hallazgos severity cards: `Críticos` · `Altos` · `Medios` · `Bajos`
- Columnas hallazgos: `ID` · `Descripción del Hallazgo` · `Severidad` · `Proceso Afectado` · `Evidencia` · `Recomendación` · `Responsable` · `Fecha Compromiso` · `Estado`
- Estados hallazgo: `Abierto` · `En Remediación` · `Pendiente de Verificación` · `Cerrado` · `Aceptado (Riesgo Residual)`
- Estado vacío reportes: `No se han generado reportes. Ejecuta una evaluación o genera un reporte desde tus datos existentes.`
- Estado vacío hallazgos: `No hay hallazgos registrados. Los hallazgos se generan automáticamente al completar evaluaciones.`

---

### MÓDULO 6: PANEL DE RIESGOS

**Diagnóstico actual:**  
No existe como módulo independiente. Los riesgos aparecen dispersos (si es que aparecen) dentro de la FMEA o dentro de reportes, pero no hay una vista consolidada de todos los riesgos de la organización. Un CEO no puede ver su perfil de riesgo de un vistazo.

**Cambios y estándares a aplicar:**

1. Vista consolidada de TODOS los riesgos identificados en TODAS las evaluaciones.
2. Heat map interactivo de Impacto vs. Probabilidad (matriz 5×5).
3. Tabla de riesgos con filtros avanzados.
4. Trend line: evolución del perfil de riesgo en el tiempo.
5. Drill-down: click en un riesgo → ver proceso BPMN asociado, FMEA vinculada, controles existentes.
6. Indicadores: Riesgo Inherente, Riesgo Residual, Efectividad del Control.
7. Exportación del Risk Register completo.

**Rediseño propuesto:**

```
LAYOUT:
┌─────────────────────────────────────────────────────────┐
│  Panel de Riesgos                                       │
│  Vista consolidada del perfil de riesgo organizacional. │
│                                                         │
│  Riesgos Totales: 47 | Críticos: 5 | Sin Control: 8    │
├───────────────────────────┬─────────────────────────────┤
│                           │                             │
│  MAPA DE CALOR            │  TOP 5 RIESGOS CRÍTICOS    │
│  Impacto vs Probabilidad  │                             │
│                           │  1. Fuga de datos clientes  │
│  5 │ ○  ○  ●  ●● │       │     Impacto: 5 | Prob: 4   │
│  4 │ ○  ○  ●  ○  │       │     Sin control asignado    │
│  3 │ ○  ●  ○  ○  │       │                             │
│  2 │ ○  ○  ○     │       │  2. Incumplimiento regulat. │
│  1 │ ○  ○        │       │     Impacto: 5 | Prob: 3    │
│    └──────────────        │     Control parcial         │
│    1  2  3  4  5          │                             │
│    Probabilidad →         │  [Ver todos →]              │
│                           │                             │
├───────────────────────────┴─────────────────────────────┤
│  Evolución del Perfil de Riesgo — Últimos 12 meses     │
│  [gráfico de línea: riesgos críticos vs controlados]    │
├─────────────────────────────────────────────────────────┤
│  Registro de Riesgos Completo                           │
│  [tabla con filtros, ordenamiento, búsqueda]            │
└─────────────────────────────────────────────────────────┘
```

**Copy exacto:**

- Título: `Panel de Riesgos`
- Subtítulo: `Vista consolidada del perfil de riesgo organizacional.`
- KPIs: `Riesgos Totales` · `Riesgos Críticos` · `Riesgos Sin Control Asignado` · `Controles Efectivos`
- Heatmap título: `Mapa de Calor — Impacto vs. Probabilidad`
- Ejes: `Impacto ↑` · `Probabilidad →`
- Sección: `Top 5 Riesgos Críticos`
- Cada riesgo: `[Nombre]` · `Impacto: [1-5]` · `Probabilidad: [1-5]` · `Estado del control: [Sin control / Parcial / Completo]`
- Trend: `Evolución del Perfil de Riesgo — Últimos 12 Meses`
- Tabla: `Registro de Riesgos Completo`
- Columnas: `ID` · `Riesgo` · `Categoría` · `Impacto` · `Probabilidad` · `Nivel de Riesgo` · `Control` · `Responsable` · `Estado`
- Estado vacío: `No se han identificado riesgos. Ejecuta una evaluación de procesos para detectar y clasificar riesgos automáticamente.`

---

### MÓDULO 7: PLANES DE ACCIÓN

**Diagnóstico actual:**  
No existe. Los hallazgos no tienen seguimiento. No hay forma de crear, asignar ni trackear acciones correctivas. Esto es un gap crítico para cualquier herramienta de auditoría.

**Cambios y estándares a aplicar:**

1. CRUD completo de planes de acción vinculados a hallazgos.
2. Cada acción: descripción, responsable, fecha compromiso, prioridad, evidencia de cierre, estado.
3. Vista Kanban (Pendiente → En Progreso → Verificación → Cerrado).
4. Vista de tabla con filtros.
5. Dashboard de cumplimiento: % acciones cerradas a tiempo, aging de acciones abiertas.
6. Notificaciones automáticas: vencimiento próximo, vencido, cambio de estado.
7. Vinculación bidireccional: desde un hallazgo → crear acción; desde una acción → ver hallazgo origen.

**Copy exacto:**

- Título: `Planes de Acción`
- Subtítulo: `Seguimiento y gestión de acciones correctivas derivadas de hallazgos de auditoría.`
- KPIs: `Acciones Totales` · `Cerradas a Tiempo` · `Vencidas` · `% Cumplimiento`
- Kanban columns: `Pendiente` · `En Progreso` · `Verificación` · `Cerrado`
- Botón: `+ Nueva Acción Correctiva`
- Campos: `Descripción de la Acción` · `Hallazgo Origen` · `Responsable` · `Fecha Compromiso` · `Prioridad` (Crítica/Alta/Media/Baja) · `Evidencia de Cierre` · `Estado`
- Estados: `Pendiente` · `En Progreso` · `En Verificación` · `Cerrada` · `Cerrada con Retraso` · `Cancelada`
- Alerta: `⚠ [N] acciones correctivas vencidas requieren atención inmediata.`
- Estado vacío: `No hay acciones correctivas registradas. Las acciones se crean a partir de hallazgos identificados en tus evaluaciones.`

---

### MÓDULO 8: HISTORIAL DE PROYECTOS

**Diagnóstico actual:**  
El historial muestra una lista básica de análisis anteriores con fecha y nombre. Sin filtros, sin búsqueda, sin categorización, sin posibilidad de comparar evaluaciones entre períodos, sin indicadores de resultado. Es un listado muerto.

**Cambios y estándares a aplicar:**

1. Cards por proyecto con preview visual (thumbnail del proceso BPMN o score de la evaluación).
2. Filtros: por tipo de evaluación, por período, por proceso, por resultado, por estado.
3. Búsqueda full-text.
4. Comparación lado a lado entre dos evaluaciones del mismo proceso.
5. Timeline visual: línea de tiempo de todas las evaluaciones.
6. Archivado con tags.
7. Métricas por proyecto: duración, hallazgos, RPN promedio, estado de acciones.

**Copy exacto:**

- Título: `Historial de Proyectos`
- Subtítulo: `Archivo completo de evaluaciones y análisis realizados.`
- Filtros: `Tipo de Evaluación` · `Período` · `Proceso` · `Estado` · `Resultado`
- Search placeholder: `Buscar por nombre, proceso o responsable...`
- Card info: `[Nombre]` · `[Tipo]` · `[Fecha]` · `Hallazgos: [N]` · `RPN Promedio: [N]` · `Estado: [Completo/Archivado]`
- Botón comparar: `Comparar Evaluaciones`
- Vista toggle: `Cards` · `Lista` · `Timeline`
- Estado vacío: `No hay evaluaciones en el historial. Tus análisis completados aparecerán aquí automáticamente.`

---

### MÓDULO 9: CONFIGURACIÓN

**Diagnóstico actual:**  
Configuración genérica con campos de perfil básicos. No hay gestión de organización, no hay roles y permisos, no hay integraciones, no hay branding personalizado, no hay configuración de frameworks o escalas de riesgo personalizadas. Falta completamente la sección de facturación/suscripción.

**Cambios y estándares a aplicar:**

1. Sub-secciones con navegación lateral: Mi Perfil, Mi Organización, Usuarios y Permisos, Frameworks y Escalas, Integraciones, Facturación, API y Webhooks, Notificaciones.
2. Gestión de organización: logo, nombre, industria, tamaño, sedes.
3. Roles predefinidos: Administrador, Director, Auditor Senior, Auditor, Analista, Visor.
4. Personalización de escalas de riesgo (impacto, probabilidad, severidad) con labels y colores.
5. Integraciones: ERP (SAP, Oracle), BI (Power BI, Tableau), GRC (ServiceNow, Archer), correo.
6. API keys management con scopes.
7. Facturación: plan actual, uso, historial de pagos, upgrade.

**Copy exacto — sub-secciones:**

- Navegación: `Mi Perfil` · `Mi Organización` · `Usuarios & Permisos` · `Frameworks & Escalas` · `Integraciones` · `Facturación` · `API & Webhooks` · `Notificaciones`
- Mi Perfil campos: `Nombre completo` · `Correo electrónico` · `Rol` · `Idioma` · `Zona horaria` · `Foto de perfil`
- Mi Organización: `Nombre de la organización` · `Industria` · `Tamaño` (1-50 / 51-200 / 201-1000 / 1000+) · `Logo` · `País` · `Sedes`
- Usuarios: `Gestión de Usuarios & Permisos` · `Invitar usuarios a tu organización y asignar roles de acceso.`
- Roles: `Administrador` (acceso total) · `Director` (lectura total + creación de evaluaciones) · `Auditor Senior` (crear + editar evaluaciones y reportes) · `Auditor` (crear evaluaciones, lectura de reportes) · `Analista` (editar procesos BPMN, matrices) · `Visor` (solo lectura)
- Frameworks: `Frameworks & Escalas de Evaluación` · `Configura los frameworks metodológicos y las escalas de riesgo que utilizará tu organización.`
- Integraciones título: `Integraciones` · `Conecta Auditora.ai con tus herramientas existentes.`
- API: `API & Webhooks` · `Gestiona tus claves de acceso a la API y configura webhooks para automatizaciones.`
- Facturación: `Facturación & Suscripción` · `Gestiona tu plan, método de pago y consulta el historial de facturación.`

---

### MÓDULO 10: SIMULACIÓN Y PROCESS MINING (Solo BPM Modeler)

**Diagnóstico actual:**  
No existe. Una herramienta que compite con Celonis y Signavio NECESITA al menos un módulo básico de simulación de procesos y capacidad de importar event logs para process mining.

**Cambios y estándares a aplicar:**

1. Importación de event logs (CSV, XES) para discovery automático de procesos.
2. Visualización del proceso descubierto con frecuencias y tiempos.
3. Detección automática de cuellos de botella, loops, y desviaciones.
4. Simulador what-if: modificar parámetros (tiempos, recursos, volumen) y ver impacto.
5. Conformance checking: comparar proceso BPMN modelado vs. proceso real (event log).
6. Dashboards de performance: tiempos de ciclo, throughput, wait times, rework rates.

**Copy exacto:**

- Título: `Process Mining & Simulación`
- Subtítulo: `Descubre, analiza y optimiza procesos a partir de datos reales de ejecución.`
- Tabs: `Discovery` · `Conformance` · `Simulación` · `Performance`
- Discovery: `Importar Event Log` · `Formatos soportados: CSV, XES, XLSX`
- Upload CTA: `Arrastra tu archivo de event log aquí o haz clic para seleccionar`
- Campos requeridos: `Case ID` · `Activity` · `Timestamp` · `Resource (opcional)`
- Conformance: `Análisis de Conformidad` · `Compara el proceso modelado con la ejecución real para identificar desviaciones.`
- Simulación: `Simulador What-If` · `Modifica parámetros del proceso y simula el impacto en tiempos, costos y recursos.`
- Performance: `Dashboard de Performance` · `Métricas de rendimiento del proceso basadas en datos de ejecución.`
- Métricas: `Tiempo de Ciclo Promedio` · `Throughput` · `Tiempo de Espera` · `Tasa de Retrabajo` · `Costo por Caso`

---

### MÓDULO 11: BIBLIOTECA DE PROCESOS (Solo BPM Modeler)

**Diagnóstico actual:**  
No existe como módulo formal. Los procesos BPMN se listan en alguna parte pero sin organización, sin categorización, sin versionado, sin estados de aprobación.

**Cambios y estándares a aplicar:**

1. Catálogo organizado por área/departamento con carpetas.
2. Cada proceso: nombre, owner, versión, estado (Borrador / En Revisión / Aprobado / Obsoleto), último update.
3. Versionado con diff visual.
4. Workflow de aprobación: Modeler → Reviewer → Approver.
5. Búsqueda y filtros avanzados.
6. Tags y categorías personalizables.
7. Plantillas de proceso predefinidas por industria.

**Copy exacto:**

- Título: `Biblioteca de Procesos`
- Subtítulo: `Repositorio centralizado de todos los procesos documentados de la organización.`
- Filtros: `Área / Departamento` · `Estado` · `Propietario` · `Categoría` · `Fecha`
- Estados: `Borrador` · `En Revisión` · `Aprobado` · `Obsoleto`
- Search: `Buscar proceso por nombre, área o etiqueta...`
- Botón: `+ Nuevo Proceso`
- Card info: `[Nombre]` · `Versión [X.Y]` · `Propietario: [Nombre]` · `Estado: [Estado]` · `Última actualización: [Fecha]`
- Dropdown acciones: `Abrir en Editor BPMN` · `Ver Historial de Versiones` · `Duplicar` · `Exportar` · `Archivar`
- Estado vacío: `No hay procesos documentados. Crea tu primer proceso desde el Editor BPMN o importa un archivo BPMN XML.`

---

### MÓDULO 12: ANÁLISIS DE CONTROLES (Solo BPM Modeler)

**Diagnóstico actual:**  
No existe. Los controles aparecen vagamente en la FMEA pero no hay un módulo dedicado a documentar, evaluar y monitorear la efectividad de controles internos.

**Cambios y estándares a aplicar:**

1. Registro de controles internos con: nombre, tipo (preventivo/detectivo/correctivo), proceso vinculado, riesgo que mitiga, frecuencia, responsable, evidencia, efectividad.
2. Evaluación de efectividad: escala 1-5 con criterios definidos.
3. Matriz de cobertura: riesgos vs. controles (gap analysis).
4. Dashboard: controles efectivos vs. deficientes, cobertura de riesgos.
5. Vinculación bidireccional con Panel de Riesgos y FMEA.

**Copy exacto:**

- Título: `Análisis de Controles Internos`
- Subtítulo: `Documenta, evalúa y monitorea la efectividad de los controles que mitigan riesgos identificados.`
- Tipos: `Preventivo` · `Detectivo` · `Correctivo`
- Campos: `Nombre del Control` · `Tipo` · `Descripción` · `Proceso Vinculado` · `Riesgo que Mitiga` · `Frecuencia de Ejecución` · `Responsable` · `Última Evaluación` · `Efectividad` (1-5) · `Evidencia`
- Efectividad escala: `1 - Inexistente` · `2 - Deficiente` · `3 - Parcial` · `4 - Adecuado` · `5 - Óptimo`
- Matriz: `Matriz de Cobertura — Riesgos vs. Controles`
- Dashboard KPIs: `Controles Documentados` · `Efectividad Promedio` · `Riesgos Sin Control` · `Controles Deficientes`

---

## PARTE 4: PRIORIDAD DE IMPLEMENTACIÓN

### Fase 1 — Crítica (Semanas 1-3)
1. **Dashboard CEO** — Es la primera impresión post-login. Debe ser impecable.
2. **Navegación/Sidebar** — Implementar menú adaptativo por rol.
3. **Sistema de diseño** — Aplicar paleta, tipografía y componentes base a TODA la app.
4. **Estados vacíos** — Profesionalizar todos los empty states.

### Fase 2 — Core funcional (Semanas 4-6)
5. **Nuevo Análisis (Wizard)** — El flujo principal de la app debe ser perfecto.
6. **Editor BPMN reskinned** — Integrar con la paleta y el panel lateral de riesgos.
7. **Matriz FMEA mejorada** — Cálculo RPN, color coding, tooltips, exportación.

### Fase 3 — Diferenciación (Semanas 7-10)
8. **Panel de Riesgos** — Vista consolidada con heatmap.
9. **Reportes & Hallazgos** — Generador con plantillas y preview.
10. **Planes de Acción** — CRUD + Kanban + dashboard de cumplimiento.

### Fase 4 — Enterprise (Semanas 11-14)
11. **Configuración completa** — Org, roles, integraciones, API, facturación.
12. **Historial de Proyectos** — Con comparación y timeline.
13. **Biblioteca de Procesos** — Con versionado y workflow de aprobación.

### Fase 5 — Diferenciador competitivo (Semanas 15-20)
14. **Process Mining & Simulación** — Importar event logs, discovery, conformance.
15. **Análisis de Controles** — Registro y evaluación de controles.
16. **Dashboard BPM Modeler** — Centro de Trabajo técnico.

---

## PARTE 5: MÓDULOS QUE FALTAN Y DEBEN EXISTIR

1. **Onboarding / Setup Wizard** — Guía de configuración inicial para nuevos usuarios.
2. **Centro de Notificaciones** — Alertas de vencimientos, cambios, asignaciones.
3. **Audit Trail / Log de Actividad** — Quién hizo qué y cuándo (compliance).
4. **Colaboración y Comentarios** — Comentarios contextuales en hallazgos, procesos, reportes.
5. **Benchmark / Comparación Sectorial** — Comparar métricas con promedios de industria.
6. **Checklist de Cumplimiento** — Checklists precargados (SOX, ISO 9001, ISO 27001, GDPR).
7. **Calendario de Auditoría** — Planificación del universo de auditoría con fechas y responsables.
8. **Workspace Colaborativo** — Espacio para equipos con chat contextual.
9. **Mobile App / PWA** — Acceso en campo para auditores.
10. **Documentación Técnica / Knowledge Base** — Guías de uso, glosario, tutoriales.

---

## PARTE 6: RECOMENDACIONES TÉCNICAS

### Componentes y sistema de diseño
- Implementar design system con Storybook.
- Componentes base: Button, Input, Select, Table, Card, Modal, Toast, Badge, Tooltip, Tabs, Dropdown, Progress, Avatar, Sidebar, Breadcrumb, EmptyState, KPICard, StatusBadge.
- Usar Radix UI o shadcn/ui como base, re-skinned con la paleta de Auditora.ai.
- Tipografía: Inter (body) + JetBrains Mono (datos técnicos, códigos, métricas).

### Paleta de colores (tokens CSS)
```css
--color-bg-primary: #0A1428;
--color-bg-secondary: #111827;
--color-bg-card: #1A2332;
--color-bg-card-hover: #1E2A3A;
--color-accent: #00E5C0;
--color-accent-hover: #00CCB0;
--color-accent-muted: rgba(0, 229, 192, 0.1);
--color-accent-border: rgba(0, 229, 192, 0.2);
--color-text-primary: #F1F5F9;
--color-text-secondary: #64748B;
--color-text-muted: #475569;
--color-danger: #EF4444;
--color-warning: #F59E0B;
--color-success: #10B981;
--color-info: #3B82F6;
--color-border: rgba(255, 255, 255, 0.06);
--color-border-hover: rgba(255, 255, 255, 0.12);
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.2);
--shadow-card-hover: 0 8px 32px rgba(0, 229, 192, 0.08);
```

### Animaciones (GSAP / Framer Motion)
```
- Page transitions: fade-up 0.4s ease-out
- Card entrance: stagger 0.08s, y: 20 → 0, opacity: 0 → 1
- Hover cards: scale(1.02), shadow transition 0.2s
- Button hover: translateY(-1px), shadow grow
- Focus states: ring 2px #00E5C0 offset 2px
- Tab switch: slide-in from direction, 0.3s
- Modal: scale 0.95 → 1.0, backdrop blur 0.2s
- Toast: slide-in from right, auto-dismiss 5s
- Number counters: count-up animation on dashboard load
- Progress bars: width animation 0.8s ease-out
- Skeleton loading: pulse animation on data fetch
```

### Accesibilidad (WCAG 2.1 AA)
- Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande.
- Focus visible en TODOS los elementos interactivos (ring `#00E5C0`).
- `aria-label` en todos los botones de solo icono.
- `aria-live` regions para notificaciones y actualizaciones en tiempo real.
- Navegación completa por teclado.
- Skip links.
- Roles ARIA correctos en tablas, tabs, modales, formularios.

### Dark mode
- La app YA es dark-first (fondo `#0A1428`). Considerar un light mode opcional para entornos con mucha luz.
- Los tokens CSS deben estar en variables para permitir theme switching.

### Responsive
- Breakpoints: 640px (mobile), 768px (tablet), 1024px (desktop), 1280px (wide), 1536px (ultrawide).
- Sidebar: colapsable a iconos en tablet, drawer en móvil.
- Tablas: scroll horizontal con columnas fijas en móvil.
- Charts: re-flow a vertical en móvil.
- Editor BPMN: full-screen mode en tablet, no disponible en móvil (mostrar mensaje).

---

## PARTE 7: PROMPT MAESTRO — LISTO PARA USAR

A continuación, el prompt completo y definitivo que define toda la identidad, estructura y estándares de la aplicación:

---

```
Eres un Senior Product Designer + UX Engineer + Frontend Architect especializado en SaaS B2B enterprise para herramientas de process mining, BPM (Business Process Management) y gestión de riesgos empresariales. Tu nivel de referencia son Celonis, Signavio, UiPath Process Mining, Bizagi Modeler y SAP Signavio.

═══════════════════════════════════════════════════════════
PRODUCTO: AUDITORA.AI
═══════════════════════════════════════════════════════════

Auditora.ai es una plataforma profesional enterprise para consultores de procesos, auditores internos, gerentes de mejora continua y analistas BPM. La aplicación vive en app.auditora.ai.

POSICIONAMIENTO: Herramienta de precisión técnica. NO es casual, NO es de juguete, NO es un MVP genérico. Transmite autoridad, rigor metodológico y calidad enterprise en cada píxel y cada palabra.

═══════════════════════════════════════════════════════════
USUARIOS PRINCIPALES
═══════════════════════════════════════════════════════════

ROL 1: CEO / Director / Gerente de Mejora Continua
─────────────────────────────────────────────────────────
- Necesita visión ejecutiva instantánea (KPIs, tendencias, alertas).
- Usa el AUTOSERVICIO para iniciar análisis rápidos sin depender del equipo técnico.
- Consume reportes ejecutivos y toma decisiones basadas en el perfil de riesgo.
- No modela procesos BPMN. No edita matrices técnicas.
- Quiere: dashboard con métricas, iniciar evaluación en 3 clicks, ver hallazgos críticos, exportar reporte para su junta directiva.

ROL 2: BPM Modeler / Analista de Procesos / Auditor Técnico
─────────────────────────────────────────────────────────
- Usa herramientas técnicas profundas: Editor BPMN 2.0, Matrices FMEA, Simulación.
- Modela, documenta y versiona procesos de negocio.
- Construye matrices de riesgo, evalúa controles, ejecuta análisis de conformidad.
- Importa event logs para process mining.
- Genera reportes técnicos detallados con evidencia.
- Quiere: editor BPMN profesional, matrices con cálculos automáticos, versionado, biblioteca de procesos.

═══════════════════════════════════════════════════════════
NAVEGACIÓN — SIDEBAR ADAPTATIVA POR ROL
═══════════════════════════════════════════════════════════

SIDEBAR CEO / Director:
├── 🏠 Centro de Control Operativo          (Dashboard ejecutivo)
├── 📊 Análisis Rápido                       (Autoservicio)
│   ├── Nuevo Análisis de Proceso
│   ├── Evaluación de Riesgos
│   └── Auditoría Express
├── 📈 Reportes & Hallazgos
│   ├── Reportes Activos
│   ├── Hallazgos Críticos
│   └── Exportar a PDF / PPTX
├── 🎯 Panel de Riesgos                     (Consolidado)
├── 📋 Planes de Acción                     (Seguimiento)
├── 📂 Historial de Proyectos               (Archivo)
├── ⚙️ Configuración
│   ├── Mi Organización
│   ├── Usuarios & Permisos
│   ├── Integraciones
│   ├── Facturación
│   └── API & Webhooks
├── 👤 Mi Cuenta
└── ❓ Centro de Ayuda

SIDEBAR BPM Modeler / Analista:
├── 🏠 Centro de Trabajo                    (Dashboard técnico)
├── 🔧 Modelado de Procesos
│   ├── Editor BPMN 2.0
│   ├── Biblioteca de Procesos
│   └── Plantillas de Flujo
├── 🧮 Matrices de Evaluación
│   ├── Matriz FMEA
│   ├── Matriz de Riesgos
│   └── Análisis de Controles
├── 📐 Simulación & Mining
│   ├── Simulador de Procesos
│   ├── Process Mining (importar logs)
│   └── Análisis de Cuellos de Botella
├── 📊 Análisis & Evaluaciones
│   ├── Nuevo Análisis
│   ├── Evaluaciones en Curso
│   └── Mis Hallazgos
├── 📈 Reportes Técnicos
│   ├── Generar Reporte
│   ├── Plantillas de Reporte
│   └── Exportación Avanzada
├── 📂 Mis Proyectos
├── ⚙️ Configuración
│   ├── Mi Perfil
│   ├── Preferencias de Editor
│   └── Notificaciones
└── ❓ Documentación Técnica

═══════════════════════════════════════════════════════════
PALETA DE COLORES — NO MODIFICAR
═══════════════════════════════════════════════════════════

Primario (fondo principal):     #0A1428
Fondo secundario (cards base):  #111827
Fondo card elevado:             #1A2332
Acento principal (teal):        #00E5C0
Acento hover:                   #00CCB0
Acento muted:                   rgba(0, 229, 192, 0.1)
Acento borde:                   rgba(0, 229, 192, 0.2)
Texto principal:                #F1F5F9
Texto secundario:               #64748B
Texto muted:                    #475569
Danger/Error:                   #EF4444
Warning:                        #F59E0B
Success:                        #10B981
Info:                           #3B82F6
Borde sutil:                    rgba(255, 255, 255, 0.06)
Borde hover:                    rgba(255, 255, 255, 0.12)

═══════════════════════════════════════════════════════════
TIPOGRAFÍA
═══════════════════════════════════════════════════════════

Body / UI:          Inter (400, 500, 600, 700)
Datos técnicos:     JetBrains Mono (métricas, IDs, códigos)
Tamaños:            12px (caption) · 14px (body) · 16px (subtitle) · 20px (title) · 28px (page title) · 36px (hero)
Line height:        1.5 (body) · 1.3 (headings)
Letter spacing:     -0.01em (body) · -0.02em (headings) · 0.05em (labels uppercase)

═══════════════════════════════════════════════════════════
ESTILO VISUAL — REGLAS ESTRICTAS
═══════════════════════════════════════════════════════════

- Minimalista premium. Mucho espacio en blanco (padding generoso: 24-32px en cards).
- Border radius: 12px (cards, modales) · 8px (inputs, badges) · 16px (grandes contenedores).
- Sombras elegantes: 0 4px 24px rgba(0,0,0,0.2) base · 0 8px 32px rgba(0,229,192,0.08) hover.
- Bordes: 1px solid rgba(255,255,255,0.06).
- Focus states: ring 2px #00E5C0 con offset 2px.
- Hover en cards: scale(1.02) con transición 0.2s + sombra teal sutil.
- Iconos: Lucide React (línea fina, 20px) o Phosphor Icons.
- Sin gradientes agresivos. Sin sombras duras. Sin bordes gruesos.
- Sin emojis en la UI (los iconos del menú arriba son solo para este prompt).

═══════════════════════════════════════════════════════════
ANIMACIONES — GSAP / FRAMER MOTION
═══════════════════════════════════════════════════════════

- Page load: fade-up cards con stagger 0.08s (y: 20→0, opacity: 0→1).
- Tab transitions: slide horizontal 0.3s ease-out.
- Modal: scale 0.95→1.0 + backdrop blur, 0.2s.
- Hover cards: scale(1.02), sombra teal, 0.2s ease.
- Hover buttons: translateY(-1px), sombra crece.
- Number counters: count-up en dashboard (0→valor real, 0.8s).
- Progress bars: width de 0%→N% con ease-out 0.8s.
- Skeleton loading: pulse animation durante data fetch.
- Toast notifications: slide-in desde la derecha, auto-dismiss 5s.
- Empty states: fade-in suave 0.5s.

═══════════════════════════════════════════════════════════
TONO DE VOZ Y COPY
═══════════════════════════════════════════════════════════

REGLAS:
- Profesional, técnico, preciso. CERO hype, CERO frases casuales, CERO exclamaciones.
- Usar terminología correcta de auditoría, BPM y gestión de riesgos.
- Títulos descriptivos, no genéricos. "Centro de Control Operativo", NO "Dashboard".
- Subtítulos que expliquen el propósito de la sección en una línea.
- Botones con verbos de acción específicos: "Iniciar Evaluación", NO "Crear nuevo".
- Labels precisos: "Proceso a Evaluar", NO "Nombre".
- Error messages útiles: "El campo Severidad requiere un valor entre 1 y 10.", NO "Campo requerido".
- Estados vacíos con contexto + CTA: "No hay hallazgos registrados. Ejecuta una evaluación para detectar hallazgos automáticamente." + [Iniciar Evaluación →]

VOCABULARIO CORRECTO:
- Evaluación (no "análisis genérico")
- Hallazgo (no "resultado" o "issue")
- Modo de falla (no "error")
- Riesgo inherente / residual (no solo "riesgo")
- Control interno (no "medida")
- Acción correctiva (no "tarea")
- Severidad / Ocurrencia / Detección (FMEA específico)
- Framework (no "método")
- Proceso de negocio (no "flujo")
- Event log (no "datos" genérico)
- Conformance (no "cumplimiento" genérico)

═══════════════════════════════════════════════════════════
MÓDULOS DE LA APLICACIÓN
═══════════════════════════════════════════════════════════

01. Centro de Control Operativo (Dashboard CEO)
02. Centro de Trabajo (Dashboard BPM Modeler)
03. Análisis Rápido / Iniciar Evaluación (Wizard 4 pasos)
04. Editor BPMN 2.0 (re-skinned, panel lateral de riesgos)
05. Biblioteca de Procesos (catálogo versionado)
06. Matriz FMEA (RPN automático, heatmap, Pareto)
07. Panel de Riesgos (heatmap, registro, tendencia)
08. Análisis de Controles Internos
09. Reportes & Hallazgos (generador + gestión)
10. Planes de Acción (Kanban + dashboard cumplimiento)
11. Process Mining & Simulación
12. Historial de Proyectos (comparación, timeline)
13. Configuración (org, roles, integraciones, API, facturación)
14. Onboarding / Setup Wizard
15. Centro de Notificaciones
16. Audit Trail / Log de Actividad

═══════════════════════════════════════════════════════════
ESTÁNDARES OBLIGATORIOS PARA CADA MÓDULO
═══════════════════════════════════════════════════════════

Todo módulo que construyas o modifiques DEBE incluir:

□ Título descriptivo (no genérico) + subtítulo de propósito
□ Estado vacío profesional (ilustración + texto + CTA)
□ Loading state (skeleton con pulse animation)
□ Error state (mensaje útil + acción de recuperación)
□ Breadcrumb de navegación
□ Responsive (mobile, tablet, desktop)
□ Accesibilidad (focus, aria-labels, contraste)
□ Animaciones de entrada (fade-up stagger)
□ Hover states en todos los elementos interactivos
□ Paleta de colores exacta (sin desviaciones)
□ Tipografía Inter + JetBrains Mono para datos
□ Exportación donde aplique (PDF, Excel, CSV)
□ Tooltips explicativos en campos técnicos
□ Consistencia visual total con el resto de la app

═══════════════════════════════════════════════════════════
ACCESIBILIDAD (WCAG 2.1 AA)
═══════════════════════════════════════════════════════════

- Contraste mínimo 4.5:1 texto normal, 3:1 texto grande.
- Focus visible (ring #00E5C0 2px offset 2px) en TODOS los interactivos.
- aria-label en botones de solo icono.
- aria-live para notificaciones y updates en tiempo real.
- Navegación completa por teclado.
- Skip links.
- Roles ARIA en tablas, tabs, modales, formularios.
- Soporte de lectores de pantalla.

═══════════════════════════════════════════════════════════
RESPONSIVE BREAKPOINTS
═══════════════════════════════════════════════════════════

Mobile:     640px   (sidebar → drawer, tablas → scroll horizontal)
Tablet:     768px   (sidebar → colapsar a iconos)
Desktop:    1024px  (layout completo)
Wide:       1280px  (más espacio en grids)
Ultrawide:  1536px  (max-width container 1440px)

═══════════════════════════════════════════════════════════
STACK TÉCNICO RECOMENDADO
═══════════════════════════════════════════════════════════

- Frontend: Next.js 14+ (App Router) + TypeScript
- UI Base: shadcn/ui re-skinned con tokens de Auditora.ai
- Animaciones: Framer Motion (page transitions, layout) + GSAP (scroll, complex)
- Charts: Recharts o Nivo (con colores de paleta)
- BPMN: bpmn.js customizado
- Tablas: TanStack Table v8
- Forms: React Hook Form + Zod
- State: Zustand
- Icons: Lucide React
- Design System: Storybook para documentación de componentes

═══════════════════════════════════════════════════════════
INSTRUCCIÓN FINAL
═══════════════════════════════════════════════════════════

Cuando generes código, diseño, copy o flujos para Auditora.ai, SIEMPRE:

1. Verifica que cumple TODAS las reglas de este prompt.
2. Usa la paleta exacta. Cero desviaciones.
3. Usa el vocabulario técnico correcto.
4. Incluye estados vacíos, loading y error.
5. Añade animaciones sutiles.
6. Piensa en ambos roles (CEO y Modeler).
7. Si algo no está a nivel enterprise, dilo y propón la versión correcta.
8. Nivel mínimo aceptable: 9.5/10. Todo lo que esté por debajo, recházalo y rehazlo.

Este prompt es el source of truth de toda la aplicación.
No aceptes diseños genéricos. No aceptes soluciones a medio hacer.
Cada módulo debe sentirse como parte de una suite enterprise de clase mundial.
```

---

*Fin del documento.*
