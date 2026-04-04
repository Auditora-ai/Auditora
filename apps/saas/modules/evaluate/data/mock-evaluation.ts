// ─────────────────────────────────────────────────────────────
// Mock data & TypeScript interfaces for the Evaluate module
// Harvard-case style evaluations for process competency
// ─────────────────────────────────────────────────────────────

/** A single option within a scenario (A, B, or C) */
export interface EvaluationOption {
  readonly label: "A" | "B" | "C";
  readonly text: string;
}

/** One scenario the evaluee must answer */
export interface EvaluationScenario {
  readonly id: string;
  readonly index: number;
  readonly context: string;
  readonly question: string;
  readonly options: readonly [EvaluationOption, EvaluationOption, EvaluationOption];
  readonly correctAnswer: "A" | "B" | "C";
  readonly explanation: string;
  readonly linkedStep: number;
  readonly linkedStepName: string;
}

/** Risk from FMEA displayed in the launcher */
export interface FMEARisk {
  readonly id: string;
  readonly name: string;
  readonly rpn: number;
}

/** A team member who can be evaluated */
export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly avatarUrl: string | null;
  readonly initials: string;
}

/** Individual answer recorded during an evaluation */
export interface RecordedAnswer {
  readonly scenarioId: string;
  readonly selected: "A" | "B" | "C";
  readonly isCorrect: boolean;
}

/** Gap identified for a team member */
export interface GapItem {
  readonly description: string;
  readonly linkedSteps: string;
}

/** Completed evaluation result for one person */
export interface MemberResult {
  readonly memberId: string;
  readonly member: TeamMember;
  readonly score: number;
  readonly correctCount: number;
  readonly totalCount: number;
  readonly answers: readonly RecordedAnswer[];
  readonly gaps: readonly GapItem[];
  readonly completedAt: string;
}

/** The full evaluation process config */
export interface EvaluationProcess {
  readonly id: string;
  readonly processName: string;
  readonly stepCount: number;
  readonly riskCount: number;
  readonly scenarios: readonly EvaluationScenario[];
  readonly risks: readonly FMEARisk[];
  readonly teamMembers: readonly TeamMember[];
}

/** Aggregate results for the manager view */
export interface EvaluationResultsSummary {
  readonly processId: string;
  readonly processName: string;
  readonly teamAlignment: number;
  readonly weakestSteps: readonly string[];
  readonly strongestSteps: readonly string[];
  readonly memberResults: readonly MemberResult[];
  readonly completedCount: number;
  readonly totalAssigned: number;
}

// ─────────────────────────────────────────────────────────────
// MOCK SCENARIOS: Compras de Materia Prima (8 scenarios)
// ─────────────────────────────────────────────────────────────

export const mockScenarios: readonly EvaluationScenario[] = [
  {
    id: "sc-001",
    index: 0,
    context:
      "Recibes una solicitud urgente del area de produccion para 500kg de resina epoxica. El proveedor habitual tiene 3 semanas de espera, pero un proveedor alterno ofrece entrega en 5 dias sin certificacion de calidad vigente.",
    question: "¿Que haces?",
    options: [
      { label: "A", text: "Compras al proveedor alterno para no detener produccion y solicitas la certificacion despues." },
      { label: "B", text: "Consultas con Calidad si el proveedor alterno puede ser aprobado de emergencia antes de emitir la orden." },
      { label: "C", text: "Rechazas la solicitud urgente y mantienes la orden con el proveedor habitual." },
    ],
    correctAnswer: "B",
    explanation:
      "Segun el paso 3 del procedimiento, toda compra debe verificar que el proveedor cuente con certificacion vigente. En emergencias se activa la evaluacion rapida con Calidad.",
    linkedStep: 3,
    linkedStepName: "Verificacion de proveedor aprobado",
  },
  {
    id: "sc-002",
    index: 1,
    context:
      "Al recibir un lote de pigmentos, el almacenista reporta que el certificado de analisis (CoA) no coincide con el numero de lote fisico. La produccion necesita el material para el turno nocturno.",
    question: "¿Que haces?",
    options: [
      { label: "A", text: "Aceptas el material condicionalmente y pides al proveedor corregir el CoA por correo." },
      { label: "B", text: "Retienes el material en cuarentena, notificas al proveedor y activas inspeccion de entrada." },
      { label: "C", text: "Liberas el material porque la diferencia de lote es probablemente un error tipografico." },
    ],
    correctAnswer: "B",
    explanation:
      "El paso 5 establece que cualquier discrepancia documental requiere retencion inmediata en cuarentena e inspeccion antes de liberar a produccion.",
    linkedStep: 5,
    linkedStepName: "Inspeccion y validacion de entrada",
  },
  {
    id: "sc-003",
    index: 2,
    context:
      "Estas evaluando cotizaciones para un contrato anual de solventes. Tres proveedores cotizan precios similares, pero uno ofrece un 12% de descuento si eliminas la clausula de penalizacion por incumplimiento de entrega.",
    question: "¿Que haces?",
    options: [
      { label: "A", text: "Aceptas el descuento y eliminas la clausula; el ahorro es significativo para el presupuesto." },
      { label: "B", text: "Negocias un descuento menor manteniendo la clausula de penalizacion intacta." },
      { label: "C", text: "Rechazas al proveedor por intentar modificar las condiciones estandar del contrato." },
    ],
    correctAnswer: "B",
    explanation:
      "El paso 2 indica que las clausulas de cumplimiento de entrega son obligatorias. Se puede negociar precio pero no eliminar protecciones contractuales clave.",
    linkedStep: 2,
    linkedStepName: "Negociacion y terminos contractuales",
  },
  {
    id: "sc-004",
    index: 3,
    context:
      "Un proveedor que usas frecuentemente te informa que cambiara su formulacion de aditivos. El nuevo producto tiene las mismas especificaciones tecnicas documentadas, pero la composicion quimica exacta es diferente.",
    question: "¿Que haces?",
    options: [
      { label: "A", text: "Solicitas muestras del nuevo producto, realizas pruebas de compatibilidad y documentas la validacion antes de aprobar el cambio." },
      { label: "B", text: "Aceptas el cambio porque las especificaciones tecnicas son identicas y no deberia haber impacto." },
      { label: "C", text: "Cambias de proveedor inmediatamente para evitar cualquier riesgo." },
    ],
    correctAnswer: "A",
    explanation:
      "Segun el paso 6, cualquier cambio en formulacion requiere validacion tecnica previa (pruebas de compatibilidad) antes de autorizar su uso en produccion.",
    linkedStep: 6,
    linkedStepName: "Gestion de cambios en materia prima",
  },
  {
    id: "sc-005",
    index: 4,
    context:
      "El inventario de polietileno esta a 15 dias de cobertura. Tu politica indica reorden a 20 dias. Sin embargo, tu gerente te pide esperar porque anticipa una baja de precios la proxima semana.",
    question: "¿Que haces?",
    options: [
      { label: "A", text: "Esperas la baja de precios como pide tu gerente; confias en su experiencia de mercado." },
      { label: "B", text: "Generas la requisicion siguiendo la politica de reorden y comunicas a tu gerente la situacion de inventario critico." },
      { label: "C", text: "Haces un pedido parcial (50%) para cubrir mientras esperas la baja de precio." },
    ],
    correctAnswer: "B",
    explanation:
      "El paso 1 define que el punto de reorden es mandatorio. Desviar de la politica de inventario requiere autorizacion formal del Director de Operaciones, no del gerente directo.",
    linkedStep: 1,
    linkedStepName: "Generacion de requisicion de compra",
  },
  {
    id: "sc-006",
    index: 5,
    context:
      "Descubres que un lote de materia prima almacenado hace 4 meses ha excedido su fecha de re-analisis. Produccion ya programo su uso para manana temprano y la linea esta configurada.",
    question: "¿Que haces?",
    options: [
      { label: "A", text: "Permites el uso porque el material fue aprobado originalmente y solo paso un poco la fecha." },
      { label: "B", text: "Bloqueas el material, solicitas re-analisis urgente al laboratorio y notificas a produccion del posible retraso." },
      { label: "C", text: "Desechas el lote completo y emites una nueva orden de compra urgente." },
    ],
    correctAnswer: "B",
    explanation:
      "El paso 7 establece que ningun material puede usarse despues de su fecha de re-analisis. Se debe confirmar su conformidad mediante prueba de laboratorio antes de liberar.",
    linkedStep: 7,
    linkedStepName: "Control de vigencia y re-analisis",
  },
  {
    id: "sc-007",
    index: 6,
    context:
      "Recibes 3 tambores de acido acetico. Al revisarlos, uno tiene una abolladura en la tapa pero el sello esta intacto. El transportista quiere que firmes la recepcion completa para poder partir.",
    question: "¿Que haces?",
    options: [
      { label: "A", text: "Firmas la recepcion con una nota de 'recibido con dano' y aceptas los 3 tambores." },
      { label: "B", text: "Firmas la recepcion completa; el sello esta intacto asi que el contenido no fue afectado." },
      { label: "C", text: "Recibes 2 tambores, rechazas el danado, documentas con fotos y reportas al proveedor para reposicion." },
    ],
    correctAnswer: "C",
    explanation:
      "Segun el paso 8, material con dano visible en empaque debe rechazarse en recepcion. Aceptar con notas no exime de responsabilidad si el contenido resulta contaminado.",
    linkedStep: 8,
    linkedStepName: "Recepcion y verificacion fisica",
  },
  {
    id: "sc-008",
    index: 7,
    context:
      "Tu director te pide evaluar un nuevo proveedor extranjero que ofrece precios 30% menores. No tiene certificaciones ISO pero muestra resultados de laboratorio propios. El ahorro anual seria de $200,000 USD.",
    question: "¿Que haces?",
    options: [
      { label: "A", text: "Rechazas al proveedor porque no tiene ISO; la politica es clara al respecto." },
      { label: "B", text: "Inicias el proceso formal de evaluacion de proveedor nuevo: auditoria, muestras, validacion tecnica, revision legal y aprobacion del comite." },
      { label: "C", text: "Apruebas al proveedor con una compra piloto pequena para probar la calidad." },
    ],
    correctAnswer: "B",
    explanation:
      "El paso 4 define el proceso completo de alta de proveedor. La falta de ISO no es motivo automatico de rechazo si se completa evaluacion integral, pero compras piloto sin proceso formal no estan permitidas.",
    linkedStep: 4,
    linkedStepName: "Evaluacion y alta de proveedores",
  },
] as const;

// ─────────────────────────────────────────────────────────────
// MOCK RISKS (from FMEA)
// ─────────────────────────────────────────────────────────────

export const mockRisks: readonly FMEARisk[] = [
  { id: "r-001", name: "Proveedor no certificado entrega material fuera de spec", rpn: 280 },
  { id: "r-002", name: "Discrepancia documental no detectada en recepcion", rpn: 240 },
  { id: "r-003", name: "Material vencido liberado a produccion", rpn: 210 },
  { id: "r-004", name: "Cambio de formulacion sin validacion previa", rpn: 192 },
  { id: "r-005", name: "Incumplimiento de punto de reorden critico", rpn: 168 },
  { id: "r-006", name: "Dano fisico en recepcion no documentado", rpn: 144 },
] as const;

// ─────────────────────────────────────────────────────────────
// MOCK TEAM MEMBERS
// ─────────────────────────────────────────────────────────────

export const mockTeamMembers: readonly TeamMember[] = [
  { id: "tm-001", name: "Maria Gonzalez", role: "Comprador Senior", avatarUrl: null, initials: "MG" },
  { id: "tm-002", name: "Carlos Ramirez", role: "Jefe de Almacen", avatarUrl: null, initials: "CR" },
  { id: "tm-003", name: "Ana Torres", role: "Analista de Compras", avatarUrl: null, initials: "AT" },
  { id: "tm-004", name: "Roberto Diaz", role: "Inspector de Calidad", avatarUrl: null, initials: "RD" },
  { id: "tm-005", name: "Laura Mendez", role: "Coordinadora de Logistica", avatarUrl: null, initials: "LM" },
] as const;

// ─────────────────────────────────────────────────────────────
// MOCK MEMBER RESULTS (pre-populated for results view)
// ─────────────────────────────────────────────────────────────

export const mockMemberResults: readonly MemberResult[] = [
  {
    memberId: "tm-001",
    member: mockTeamMembers[0],
    score: 88,
    correctCount: 7,
    totalCount: 8,
    completedAt: "2025-04-03T14:22:00Z",
    answers: [
      { scenarioId: "sc-001", selected: "B", isCorrect: true },
      { scenarioId: "sc-002", selected: "B", isCorrect: true },
      { scenarioId: "sc-003", selected: "B", isCorrect: true },
      { scenarioId: "sc-004", selected: "A", isCorrect: true },
      { scenarioId: "sc-005", selected: "B", isCorrect: true },
      { scenarioId: "sc-006", selected: "B", isCorrect: true },
      { scenarioId: "sc-007", selected: "A", isCorrect: false },
      { scenarioId: "sc-008", selected: "B", isCorrect: true },
    ],
    gaps: [
      { description: "Acepto material con dano visible en lugar de rechazarlo", linkedSteps: "paso 8" },
    ],
  },
  {
    memberId: "tm-002",
    member: mockTeamMembers[1],
    score: 63,
    correctCount: 5,
    totalCount: 8,
    completedAt: "2025-04-03T15:45:00Z",
    answers: [
      { scenarioId: "sc-001", selected: "A", isCorrect: false },
      { scenarioId: "sc-002", selected: "B", isCorrect: true },
      { scenarioId: "sc-003", selected: "A", isCorrect: false },
      { scenarioId: "sc-004", selected: "B", isCorrect: false },
      { scenarioId: "sc-005", selected: "B", isCorrect: true },
      { scenarioId: "sc-006", selected: "B", isCorrect: true },
      { scenarioId: "sc-007", selected: "C", isCorrect: true },
      { scenarioId: "sc-008", selected: "B", isCorrect: true },
    ],
    gaps: [
      { description: "Compro a proveedor no certificado en situacion de urgencia", linkedSteps: "paso 3" },
      { description: "Elimino clausulas contractuales por descuento", linkedSteps: "paso 2" },
      { description: "Acepto cambio de formulacion sin validacion tecnica", linkedSteps: "paso 6" },
    ],
  },
  {
    memberId: "tm-003",
    member: mockTeamMembers[2],
    score: 75,
    correctCount: 6,
    totalCount: 8,
    completedAt: "2025-04-03T16:10:00Z",
    answers: [
      { scenarioId: "sc-001", selected: "B", isCorrect: true },
      { scenarioId: "sc-002", selected: "A", isCorrect: false },
      { scenarioId: "sc-003", selected: "B", isCorrect: true },
      { scenarioId: "sc-004", selected: "A", isCorrect: true },
      { scenarioId: "sc-005", selected: "A", isCorrect: false },
      { scenarioId: "sc-006", selected: "B", isCorrect: true },
      { scenarioId: "sc-007", selected: "C", isCorrect: true },
      { scenarioId: "sc-008", selected: "B", isCorrect: true },
    ],
    gaps: [
      { description: "Acepto material con discrepancia documental", linkedSteps: "paso 5" },
      { description: "Desvio de politica de reorden por instruccion de gerente", linkedSteps: "paso 1" },
    ],
  },
  {
    memberId: "tm-004",
    member: mockTeamMembers[3],
    score: 50,
    correctCount: 4,
    totalCount: 8,
    completedAt: "2025-04-04T09:30:00Z",
    answers: [
      { scenarioId: "sc-001", selected: "A", isCorrect: false },
      { scenarioId: "sc-002", selected: "B", isCorrect: true },
      { scenarioId: "sc-003", selected: "A", isCorrect: false },
      { scenarioId: "sc-004", selected: "B", isCorrect: false },
      { scenarioId: "sc-005", selected: "C", isCorrect: false },
      { scenarioId: "sc-006", selected: "B", isCorrect: true },
      { scenarioId: "sc-007", selected: "C", isCorrect: true },
      { scenarioId: "sc-008", selected: "B", isCorrect: true },
    ],
    gaps: [
      { description: "Compro a proveedor no certificado en situacion de urgencia", linkedSteps: "paso 3" },
      { description: "Elimino clausulas contractuales por descuento", linkedSteps: "paso 2" },
      { description: "Acepto cambio de formulacion sin validacion tecnica", linkedSteps: "paso 6" },
      { description: "Hizo pedido parcial desviando politica de reorden", linkedSteps: "paso 1" },
    ],
  },
  {
    memberId: "tm-005",
    member: mockTeamMembers[4],
    score: 38,
    correctCount: 3,
    totalCount: 8,
    completedAt: "2025-04-04T10:15:00Z",
    answers: [
      { scenarioId: "sc-001", selected: "A", isCorrect: false },
      { scenarioId: "sc-002", selected: "C", isCorrect: false },
      { scenarioId: "sc-003", selected: "A", isCorrect: false },
      { scenarioId: "sc-004", selected: "A", isCorrect: true },
      { scenarioId: "sc-005", selected: "A", isCorrect: false },
      { scenarioId: "sc-006", selected: "A", isCorrect: false },
      { scenarioId: "sc-007", selected: "C", isCorrect: true },
      { scenarioId: "sc-008", selected: "B", isCorrect: true },
    ],
    gaps: [
      { description: "Compro a proveedor no certificado en situacion de urgencia", linkedSteps: "paso 3" },
      { description: "Libero material sin certificado valido", linkedSteps: "paso 5" },
      { description: "Elimino clausulas contractuales por descuento", linkedSteps: "paso 2" },
      { description: "Desvio de politica de reorden por instruccion de gerente", linkedSteps: "paso 1" },
      { description: "Permitio uso de material vencido sin re-analisis", linkedSteps: "paso 7" },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────
// COMPOSITE MOCK OBJECTS
// ─────────────────────────────────────────────────────────────

export const mockEvaluationProcess: EvaluationProcess = {
  id: "eval-proc-001",
  processName: "Compras de Materia Prima",
  stepCount: 12,
  riskCount: 6,
  scenarios: mockScenarios,
  risks: mockRisks,
  teamMembers: mockTeamMembers,
};

export const mockResultsSummary: EvaluationResultsSummary = {
  processId: "eval-proc-001",
  processName: "Compras de Materia Prima",
  teamAlignment: 63,
  weakestSteps: [
    "Paso 2: Negociacion y terminos contractuales",
    "Paso 3: Verificacion de proveedor aprobado",
    "Paso 1: Generacion de requisicion de compra",
  ],
  strongestSteps: [
    "Paso 7: Control de vigencia y re-analisis",
    "Paso 8: Recepcion y verificacion fisica",
    "Paso 4: Evaluacion y alta de proveedores",
  ],
  memberResults: mockMemberResults,
  completedCount: 5,
  totalAssigned: 5,
};
