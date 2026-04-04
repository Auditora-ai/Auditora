// ─── TypeScript Interfaces ──────────────────────────────────────────────────

export type ProcessStatus =
	| "DRAFT"
	| "MAPPED"
	| "DOCUMENTED"
	| "VALIDATED"
	| "APPROVED";

export type RiskLevel = "high" | "medium" | "low";

export interface ProcessStep {
	id: string;
	number: number;
	name: string;
	description: string;
	role: string;
	durationEstimate: string;
	riskLevel: RiskLevel;
	isDecisionPoint: boolean;
	decisionOptions?: { label: string; nextStepId: string }[];
	// SIPOC data
	suppliers: string[];
	inputs: string[];
	outputs: string[];
	customers: string[];
	// Expandable detail
	detailedInstructions: string;
	quePuedeSalirMal: string[];
	// Procedure data
	procedureInstruction: string;
	inputsNeeded: string[];
	outputsProduced: string[];
	hasRisk: boolean;
	riskWarning?: string;
}

export interface ProcessRisk {
	id: string;
	description: string;
	affectedStepId: string;
	affectedStepName: string;
	failureMode: string;
	failureEffect: string;
	severity: number; // 1-10
	frequency: number; // 1-10
	detection: number; // 1-10
	rpn: number; // S x F x D
	mitigationActions: string[];
}

export interface RaciAssignment {
	stepId: string;
	stepName: string;
	responsible: string;
	accountable: string;
	consulted: string[];
	informed: string[];
}

export interface ProcessHistoryEntry {
	id: string;
	version: number;
	date: string;
	author: string;
	changeDescription: string;
}

export interface ProcessDetail {
	id: string;
	name: string;
	description: string;
	status: ProcessStatus;
	maturityScore: number; // 0-100
	category: string;
	owner: string;
	steps: ProcessStep[];
	risks: ProcessRisk[];
	raciAssignments: RaciAssignment[];
	history: ProcessHistoryEntry[];
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

export const mockProcess: ProcessDetail = {
	id: "proc-001",
	name: "Compras de Materia Prima",
	description:
		"Proceso para la adquisición de materias primas requeridas por producción, desde la solicitud hasta la recepción en almacén.",
	status: "DOCUMENTED",
	maturityScore: 68,
	category: "core",
	owner: "Alejandra Rivas",
	steps: [
		{
			id: "step-01",
			number: 1,
			name: "Recepción de solicitud de compra",
			description:
				"El área de producción envía la solicitud de compra con especificaciones técnicas del material requerido.",
			role: "Producción",
			durationEstimate: "1 día",
			riskLevel: "low",
			isDecisionPoint: false,
			suppliers: ["Producción"],
			inputs: ["Orden de producción", "Inventario actual"],
			outputs: ["Solicitud de compra"],
			customers: ["Compras"],
			detailedInstructions:
				"Verificar que la solicitud contenga: código de material, cantidad requerida, fecha límite de entrega, y especificaciones técnicas. Registrar en el sistema ERP.",
			quePuedeSalirMal: [
				"Solicitud incompleta sin especificaciones técnicas",
				"Cantidad solicitada no coincide con la orden de producción",
			],
			procedureInstruction:
				"Recibir solicitud de compra del área de producción. Verificar que incluya código de material, cantidad, fecha requerida y especificaciones técnicas.",
			inputsNeeded: ["Orden de producción", "Niveles de inventario actuales"],
			outputsProduced: ["Solicitud de compra registrada en ERP"],
			hasRisk: false,
		},
		{
			id: "step-02",
			number: 2,
			name: "Validación de stock en almacén",
			description:
				"Verificar si existe inventario disponible antes de proceder con la compra.",
			role: "Almacén",
			durationEstimate: "4 horas",
			riskLevel: "medium",
			isDecisionPoint: true,
			decisionOptions: [
				{ label: "Stock disponible → Entregar", nextStepId: "step-10" },
				{
					label: "Stock insuficiente → Continuar compra",
					nextStepId: "step-03",
				},
			],
			suppliers: ["Compras"],
			inputs: ["Solicitud de compra"],
			outputs: ["Reporte de inventario"],
			customers: ["Compras"],
			detailedInstructions:
				"Consultar niveles de inventario en ERP. Considerar stock de seguridad, lotes mínimos y material en tránsito. Documentar resultado de la verificación.",
			quePuedeSalirMal: [
				"Inventario del sistema no coincide con inventario físico",
				"No se considera el stock de seguridad en la verificación",
			],
			procedureInstruction:
				"Consultar inventario en sistema ERP. Si stock disponible cubre la solicitud (considerando stock de seguridad), informar a producción. Si no, continuar con proceso de compra.",
			inputsNeeded: ["Solicitud de compra", "Reporte de inventario ERP"],
			outputsProduced: [
				"Decisión de compra documentada",
				"Reporte de inventario",
			],
			hasRisk: true,
			riskWarning:
				"Riesgo de discrepancia entre inventario físico y del sistema",
		},
		{
			id: "step-03",
			number: 3,
			name: "Selección de proveedores",
			description:
				"Identificar proveedores calificados del padrón y solicitar cotizaciones.",
			role: "Compras",
			durationEstimate: "2 días",
			riskLevel: "medium",
			isDecisionPoint: false,
			suppliers: ["Base de proveedores"],
			inputs: ["Solicitud de compra validada", "Padrón de proveedores"],
			outputs: ["Solicitudes de cotización enviadas"],
			customers: ["Proveedores"],
			detailedInstructions:
				"Seleccionar al menos 3 proveedores del padrón calificado. Enviar RFQ con especificaciones, cantidades, y fecha requerida. Plazo de respuesta: 3 días hábiles.",
			quePuedeSalirMal: [
				"Proveedores no disponibles o con capacidad limitada",
				"Especificaciones técnicas ambiguas en el RFQ",
				"No consultar el historial de desempeño de proveedores",
			],
			procedureInstruction:
				"Identificar mínimo 3 proveedores del padrón calificado. Preparar RFQ con especificaciones técnicas, volúmenes y plazos. Enviar y establecer fecha límite de respuesta.",
			inputsNeeded: [
				"Solicitud de compra validada",
				"Padrón de proveedores calificados",
				"Historial de desempeño",
			],
			outputsProduced: [
				"RFQs enviados a proveedores",
				"Registro de solicitudes en sistema",
			],
			hasRisk: true,
			riskWarning: "Dependencia de pocos proveedores calificados",
		},
		{
			id: "step-04",
			number: 4,
			name: "Evaluación de cotizaciones",
			description:
				"Analizar cotizaciones recibidas comparando precio, calidad, plazo y condiciones.",
			role: "Compras",
			durationEstimate: "1 día",
			riskLevel: "high",
			isDecisionPoint: false,
			suppliers: ["Proveedores"],
			inputs: ["Cotizaciones recibidas"],
			outputs: ["Cuadro comparativo", "Proveedor seleccionado"],
			customers: ["Gerencia de compras"],
			detailedInstructions:
				"Elaborar cuadro comparativo con: precio unitario, costo total, plazo de entrega, condiciones de pago, certificaciones de calidad. Asignar puntaje según ponderación establecida.",
			quePuedeSalirMal: [
				"Cotizaciones no comparables por diferentes unidades de medida",
				"No considerar costos ocultos (flete, embalaje, seguro)",
				"Sesgo hacia proveedores conocidos sin evaluación objetiva",
			],
			procedureInstruction:
				"Elaborar cuadro comparativo de cotizaciones. Evaluar: precio (40%), calidad (30%), plazo de entrega (20%), condiciones de pago (10%). Documentar justificación de selección.",
			inputsNeeded: [
				"Cotizaciones de proveedores",
				"Criterios de evaluación",
			],
			outputsProduced: [
				"Cuadro comparativo completo",
				"Recomendación de proveedor",
			],
			hasRisk: true,
			riskWarning: "Evaluación subjetiva puede resultar en proveedor inadecuado",
		},
		{
			id: "step-05",
			number: 5,
			name: "Aprobación de la compra",
			description:
				"Obtener autorización según nivel de monto: jefe de compras, gerente o dirección.",
			role: "Gerencia",
			durationEstimate: "1-3 días",
			riskLevel: "medium",
			isDecisionPoint: true,
			decisionOptions: [
				{ label: "Aprobada → Generar OC", nextStepId: "step-06" },
				{
					label: "Rechazada → Renegociar",
					nextStepId: "step-03",
				},
			],
			suppliers: ["Compras"],
			inputs: ["Cuadro comparativo", "Justificación de compra"],
			outputs: ["Autorización firmada"],
			customers: ["Compras"],
			detailedInstructions:
				"Montos < $50,000: Jefe de compras. $50,000-$200,000: Gerente de operaciones. > $200,000: Director general. Documentar la aprobación en sistema.",
			quePuedeSalirMal: [
				"Demoras por ausencia del aprobador",
				"Falta de documentación soporte para la aprobación",
			],
			procedureInstruction:
				"Enviar cuadro comparativo y justificación al nivel de aprobación correspondiente según monto. Registrar aprobación/rechazo en sistema con fecha y firma.",
			inputsNeeded: [
				"Cuadro comparativo",
				"Justificación de compra",
				"Presupuesto disponible",
			],
			outputsProduced: ["Aprobación firmada", "Registro en sistema"],
			hasRisk: false,
		},
		{
			id: "step-06",
			number: 6,
			name: "Emisión de orden de compra",
			description:
				"Generar la orden de compra formal con todos los términos y condiciones acordados.",
			role: "Compras",
			durationEstimate: "4 horas",
			riskLevel: "low",
			isDecisionPoint: false,
			suppliers: ["Compras"],
			inputs: ["Aprobación de compra", "Datos del proveedor"],
			outputs: ["Orden de compra emitida"],
			customers: ["Proveedor", "Almacén"],
			detailedInstructions:
				"Generar OC en ERP con: datos del proveedor, materiales, cantidades, precios, condiciones de entrega y pago. Enviar al proveedor y notificar a almacén.",
			quePuedeSalirMal: [
				"Error en cantidades o especificaciones de la OC",
				"OC no enviada oportunamente al proveedor",
			],
			procedureInstruction:
				"Generar orden de compra en ERP. Incluir: datos proveedor, materiales con código, cantidades, precios unitarios, condiciones de entrega y pago. Enviar copia a proveedor y almacén.",
			inputsNeeded: ["Aprobación firmada", "Datos del proveedor seleccionado"],
			outputsProduced: [
				"Orden de compra en ERP",
				"Copia al proveedor",
				"Aviso a almacén",
			],
			hasRisk: false,
		},
		{
			id: "step-07",
			number: 7,
			name: "Seguimiento de entrega",
			description:
				"Monitorear el estado del pedido con el proveedor hasta la fecha de entrega.",
			role: "Compras",
			durationEstimate: "Variable",
			riskLevel: "medium",
			isDecisionPoint: false,
			suppliers: ["Proveedor"],
			inputs: ["Orden de compra confirmada"],
			outputs: ["Confirmación de envío", "Tracking de pedido"],
			customers: ["Almacén", "Producción"],
			detailedInstructions:
				"Contactar al proveedor 48h después de enviar OC para confirmar recepción. Solicitar fecha estimada de envío. Dar seguimiento semanal o según criticidad del material.",
			quePuedeSalirMal: [
				"Proveedor no confirma la OC a tiempo",
				"Retraso en entrega sin comunicación anticipada",
				"Material enviado no coincide con lo solicitado",
			],
			procedureInstruction:
				"Confirmar recepción de OC por proveedor a las 48h. Solicitar fecha de envío. Hacer seguimiento periódico. Escalar si hay retraso >2 días.",
			inputsNeeded: [
				"Orden de compra confirmada",
				"Datos de contacto del proveedor",
			],
			outputsProduced: [
				"Registro de seguimiento",
				"Alertas de retraso (si aplica)",
			],
			hasRisk: true,
			riskWarning: "Retrasos pueden parar la línea de producción",
		},
		{
			id: "step-08",
			number: 8,
			name: "Recepción e inspección de material",
			description:
				"Recibir el material en almacén y realizar inspección de calidad según especificaciones.",
			role: "Almacén / Calidad",
			durationEstimate: "1 día",
			riskLevel: "high",
			isDecisionPoint: true,
			decisionOptions: [
				{ label: "Aprobado → Ingreso a almacén", nextStepId: "step-09" },
				{
					label: "Rechazado → Devolución al proveedor",
					nextStepId: "step-07",
				},
			],
			suppliers: ["Proveedor"],
			inputs: ["Material entregado", "Orden de compra"],
			outputs: ["Reporte de inspección"],
			customers: ["Almacén", "Calidad"],
			detailedInstructions:
				"Verificar: cantidades vs OC, estado del empaque, certificados de calidad, muestras de inspección según plan. Documentar resultado. Material no conforme se separa y notifica a compras.",
			quePuedeSalirMal: [
				"Material recibido fuera de especificación",
				"Cantidades no coinciden con la OC",
				"Certificados de calidad faltantes o vencidos",
				"Inspección no realizada antes de ingresar al almacén",
			],
			procedureInstruction:
				"Verificar cantidades contra OC. Inspeccionar según plan de calidad: visual, dimensional, certificados. Documentar con fotos si aplica. Material no conforme se segrega y reporta.",
			inputsNeeded: [
				"Material recibido",
				"Orden de compra",
				"Plan de inspección",
			],
			outputsProduced: [
				"Reporte de inspección",
				"Etiquetas de aprobación/rechazo",
			],
			hasRisk: true,
			riskWarning:
				"Material defectuoso puede afectar calidad de producto final",
		},
		{
			id: "step-09",
			number: 9,
			name: "Registro en almacén y actualización de inventario",
			description:
				"Ingresar el material al almacén y actualizar el inventario en sistema.",
			role: "Almacén",
			durationEstimate: "4 horas",
			riskLevel: "low",
			isDecisionPoint: false,
			suppliers: ["Almacén"],
			inputs: ["Material aprobado", "Reporte de inspección"],
			outputs: ["Inventario actualizado", "Ubicación asignada"],
			customers: ["Producción", "Contabilidad"],
			detailedInstructions:
				"Registrar entrada en ERP con referencia a OC. Asignar ubicación en almacén según FIFO. Actualizar niveles de inventario. Notificar a producción la disponibilidad.",
			quePuedeSalirMal: [
				"Error en el registro de cantidades en sistema",
				"Material almacenado en ubicación incorrecta",
			],
			procedureInstruction:
				"Registrar entrada en ERP vinculando a la OC. Asignar ubicación física siguiendo método FIFO. Actualizar stock. Notificar a producción sobre disponibilidad del material.",
			inputsNeeded: ["Material aprobado", "Reporte de inspección aprobado"],
			outputsProduced: [
				"Registro de entrada en ERP",
				"Etiqueta de ubicación",
				"Notificación a producción",
			],
			hasRisk: false,
		},
		{
			id: "step-10",
			number: 10,
			name: "Procesamiento de factura y pago",
			description:
				"Recibir factura del proveedor, conciliar con OC y recepción, y programar pago.",
			role: "Contabilidad",
			durationEstimate: "3 días",
			riskLevel: "medium",
			isDecisionPoint: false,
			suppliers: ["Proveedor", "Compras"],
			inputs: ["Factura", "Orden de compra", "Nota de recepción"],
			outputs: ["Pago programado", "Registro contable"],
			customers: ["Proveedor", "Finanzas"],
			detailedInstructions:
				"Conciliar three-way match: factura vs OC vs nota de recepción. Verificar montos, cantidades y condiciones. Registrar contablemente y programar pago según condiciones acordadas.",
			quePuedeSalirMal: [
				"Discrepancia entre factura, OC y recepción",
				"Retraso en pago afecta relación con proveedor",
				"Error en registro contable",
			],
			procedureInstruction:
				"Realizar conciliación de 3 vías (factura, OC, recepción). Verificar concordancia de montos y cantidades. Registrar asiento contable. Programar pago según condiciones (30/60/90 días).",
			inputsNeeded: [
				"Factura del proveedor",
				"Orden de compra",
				"Nota de recepción",
			],
			outputsProduced: [
				"Registro contable",
				"Pago programado",
				"Comprobante de pago",
			],
			hasRisk: true,
			riskWarning: "Three-way match puede revelar discrepancias",
		},
	],
	risks: [
		{
			id: "risk-01",
			description: "Material recibido fuera de especificación técnica",
			affectedStepId: "step-08",
			affectedStepName: "Recepción e inspección de material",
			failureMode:
				"Proveedor envía material con dimensiones o composición incorrecta",
			failureEffect:
				"Producto final defectuoso, rechazo de lote, retrabajos costosos",
			severity: 9,
			frequency: 4,
			detection: 3,
			rpn: 108,
			mitigationActions: [
				"Inspección de recepción con plan de muestreo AQL",
				"Certificados de calidad obligatorios con cada entrega",
				"Auditoría anual a proveedores críticos",
			],
		},
		{
			id: "risk-02",
			description: "Retraso en entrega de proveedor",
			affectedStepId: "step-07",
			affectedStepName: "Seguimiento de entrega",
			failureMode:
				"Proveedor no cumple fecha de entrega comprometida",
			failureEffect:
				"Paro de línea de producción, incumplimiento con cliente final",
			severity: 8,
			frequency: 6,
			detection: 5,
			rpn: 240,
			mitigationActions: [
				"Mantener stock de seguridad para materiales críticos",
				"Proveedores alternativos calificados (dual sourcing)",
				"Penalidades contractuales por incumplimiento",
				"Seguimiento semanal automatizado con alertas",
			],
		},
		{
			id: "risk-03",
			description: "Discrepancia entre inventario físico y del sistema",
			affectedStepId: "step-02",
			affectedStepName: "Validación de stock en almacén",
			failureMode:
				"Niveles de inventario en ERP no reflejan existencia real",
			failureEffect:
				"Compras innecesarias o faltantes de material en producción",
			severity: 7,
			frequency: 5,
			detection: 4,
			rpn: 140,
			mitigationActions: [
				"Conteos cíclicos semanales de SKUs clase A",
				"Inventario físico mensual completo",
				"Controles de entrada/salida estrictos en almacén",
			],
		},
		{
			id: "risk-04",
			description:
				"Selección de proveedor basada en precio sin considerar calidad",
			affectedStepId: "step-04",
			affectedStepName: "Evaluación de cotizaciones",
			failureMode:
				"Criterios de evaluación sesgados hacia el menor precio",
			failureEffect:
				"Materiales de baja calidad, mayor tasa de rechazo, costos ocultos",
			severity: 8,
			frequency: 3,
			detection: 6,
			rpn: 144,
			mitigationActions: [
				"Ponderación obligatoria: calidad 30%, precio 40%, servicio 30%",
				"Revisión por comité de compras para montos >$100K",
				"Auditoría aleatoria de evaluaciones",
			],
		},
		{
			id: "risk-05",
			description: "Error en conciliación factura-OC-recepción",
			affectedStepId: "step-10",
			affectedStepName: "Procesamiento de factura y pago",
			failureMode:
				"Discrepancias no detectadas entre factura, OC y nota de recepción",
			failureEffect:
				"Sobrepago al proveedor, pérdida financiera, hallazgos de auditoría",
			severity: 6,
			frequency: 4,
			detection: 3,
			rpn: 72,
			mitigationActions: [
				"Three-way match automatizado en ERP",
				"Tolerancia máxima de 2% en variaciones de precio",
				"Revisión mensual de pagos vs recepciones",
			],
		},
		{
			id: "risk-06",
			description: "Dependencia excesiva de proveedor único",
			affectedStepId: "step-03",
			affectedStepName: "Selección de proveedores",
			failureMode:
				"Solo existe un proveedor calificado para material crítico",
			failureEffect:
				"Vulnerabilidad en cadena de suministro, sin capacidad de negociación",
			severity: 9,
			frequency: 5,
			detection: 7,
			rpn: 315,
			mitigationActions: [
				"Programa de desarrollo de proveedores alternativos",
				"Revisión trimestral de padrón de proveedores",
				"Contratos marco con cláusulas de continuidad de suministro",
				"Evaluación de riesgo de proveedor anual",
			],
		},
	],
	raciAssignments: [
		{
			stepId: "step-01",
			stepName: "Recepción de solicitud de compra",
			responsible: "Analista de compras",
			accountable: "Jefe de compras",
			consulted: ["Planeación de producción"],
			informed: ["Almacén"],
		},
		{
			stepId: "step-02",
			stepName: "Validación de stock en almacén",
			responsible: "Almacenista",
			accountable: "Jefe de almacén",
			consulted: ["Analista de compras"],
			informed: ["Producción"],
		},
		{
			stepId: "step-03",
			stepName: "Selección de proveedores",
			responsible: "Analista de compras",
			accountable: "Jefe de compras",
			consulted: ["Calidad", "Ingeniería"],
			informed: ["Gerencia de operaciones"],
		},
		{
			stepId: "step-04",
			stepName: "Evaluación de cotizaciones",
			responsible: "Analista de compras",
			accountable: "Jefe de compras",
			consulted: ["Calidad", "Finanzas"],
			informed: ["Producción"],
		},
		{
			stepId: "step-05",
			stepName: "Aprobación de la compra",
			responsible: "Jefe de compras",
			accountable: "Gerente de operaciones",
			consulted: ["Finanzas"],
			informed: ["Analista de compras", "Producción"],
		},
		{
			stepId: "step-06",
			stepName: "Emisión de orden de compra",
			responsible: "Analista de compras",
			accountable: "Jefe de compras",
			consulted: [],
			informed: ["Proveedor", "Almacén"],
		},
		{
			stepId: "step-07",
			stepName: "Seguimiento de entrega",
			responsible: "Analista de compras",
			accountable: "Jefe de compras",
			consulted: ["Proveedor"],
			informed: ["Almacén", "Producción"],
		},
		{
			stepId: "step-08",
			stepName: "Recepción e inspección de material",
			responsible: "Almacenista",
			accountable: "Jefe de almacén",
			consulted: ["Inspector de calidad", "Analista de compras"],
			informed: ["Producción", "Contabilidad"],
		},
		{
			stepId: "step-09",
			stepName: "Registro en almacén",
			responsible: "Almacenista",
			accountable: "Jefe de almacén",
			consulted: [],
			informed: ["Producción", "Contabilidad"],
		},
		{
			stepId: "step-10",
			stepName: "Procesamiento de factura y pago",
			responsible: "Analista de cuentas por pagar",
			accountable: "Contador general",
			consulted: ["Analista de compras"],
			informed: ["Proveedor", "Tesorería"],
		},
	],
	history: [
		{
			id: "hist-01",
			version: 1,
			date: "2024-09-15T10:30:00Z",
			author: "Alejandra Rivas",
			changeDescription:
				"Creación inicial del proceso a partir de entrevistas con el equipo de compras y almacén.",
		},
		{
			id: "hist-02",
			version: 2,
			date: "2024-11-22T14:15:00Z",
			author: "Carlos Mendoza",
			changeDescription:
				"Se agregaron 6 riesgos FMEA identificados durante la sesión de análisis de riesgos. Se actualizó la matriz RACI incluyendo al área de calidad.",
		},
		{
			id: "hist-03",
			version: 3,
			date: "2025-01-10T09:00:00Z",
			author: "Alejandra Rivas",
			changeDescription:
				"Documentación formal del procedimiento (SOP). Se detallaron instrucciones paso a paso, criterios de decisión y umbrales de aprobación por monto.",
		},
	],
};
