import { z } from "zod";

const AttachmentSchema = z.object({
	name: z.string(),
	url: z.string(),
	type: z.string(),
	size: z.number(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

export const NodePropertiesSchema = z.object({
	// TipTap JSON doc or legacy plain string
	description: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
	attachments: z.array(AttachmentSchema).optional(),
	responsable: z.string().optional(),
	slaValue: z.number().nullable().optional(),
	slaUnit: z.enum(["minutes", "hours", "days"]).optional(),
	frequency: z.enum(["daily", "weekly", "monthly", "per_event"]).optional(),
	frequencyCount: z.number().nullable().optional(),
	systems: z.array(z.string()).optional(),
	inputs: z.array(z.string()).optional(),
	outputs: z.array(z.string()).optional(),
	costPerExecution: z.number().nullable().optional(),
	costCurrency: z.string().optional(),
	estimatedDuration: z.number().nullable().optional(),
	docMode: z.enum(["description", "sop"]).optional(),
}).passthrough();

export type NodeProperties = z.infer<typeof NodePropertiesSchema>;

/** Field definitions for rendering the properties editor UI */
export const PROPERTY_FIELDS = [
	{
		key: "description" as const,
		label: "Descripción / Procedimiento",
		type: "richtext" as const,
		group: "general",
		tooltip: "Explica en qué consiste esta actividad: qué se hace, por qué se hace y cuál es el resultado esperado. Escríbelo como si le explicaras a un nuevo empleado en su primer día.",
	},
	{
		key: "responsable" as const,
		label: "Responsable",
		type: "text" as const,
		group: "general",
		tooltip: "El rol o puesto que ejecuta esta actividad. No pongas el nombre de la persona, sino el cargo. Ej: 'Analista de compras', 'Gerente de RRHH', 'Asistente contable'.",
	},
	{
		key: "slaValue" as const,
		label: "SLA",
		type: "number" as const,
		group: "recursos",
		suffix: "slaUnit",
		tooltip: "Tiempo máximo permitido para completar esta actividad según las reglas del negocio. Ej: si una factura debe aprobarse en 48 horas, el SLA es 48. Déjalo vacío si no hay un tiempo límite definido.",
	},
	{
		key: "slaUnit" as const,
		label: "Unidad SLA",
		type: "select" as const,
		group: "recursos",
		tooltip: "La unidad de tiempo del SLA: minutos (tareas rápidas como verificaciones), horas (aprobaciones del día), o días (procesos que toman más tiempo).",
		options: [
			{ value: "minutes", label: "Minutos" },
			{ value: "hours", label: "Horas" },
			{ value: "days", label: "Días" },
		],
	},
	{
		key: "frequency" as const,
		label: "Frecuencia",
		type: "select" as const,
		group: "recursos",
		tooltip: "¿Cada cuánto se ejecuta esta actividad? Diaria (todos los días), semanal, mensual, o por evento (cada vez que ocurre algo que la dispara, como recibir una solicitud).",
		options: [
			{ value: "daily", label: "Diaria" },
			{ value: "weekly", label: "Semanal" },
			{ value: "monthly", label: "Mensual" },
			{ value: "per_event", label: "Por evento" },
		],
	},
	{
		key: "frequencyCount" as const,
		label: "Cantidad por período",
		type: "number" as const,
		group: "recursos",
		tooltip: "¿Cuántas veces se repite en el período seleccionado? Ej: si se procesan ~20 facturas al mes, pon 20. Esto ayuda a calcular la carga de trabajo y costos.",
	},
	{
		key: "estimatedDuration" as const,
		label: "Duración estimada (min)",
		type: "number" as const,
		group: "recursos",
		tooltip: "¿Cuántos minutos tarda una persona experimentada en completar esta actividad una vez? No incluyas tiempos de espera, solo el trabajo activo. Ej: revisar un documento = 15 min.",
	},
	{
		key: "systems" as const,
		label: "Sistemas",
		type: "tags" as const,
		group: "recursos",
		placeholder: "SAP, CRM, etc.",
		tooltip: "Software, aplicaciones o herramientas que se usan para realizar esta actividad. Incluye todo: ERP (SAP, Oracle), email, Excel, sistemas internos, portales web. Presiona Enter para agregar cada uno.",
	},
	{
		key: "inputs" as const,
		label: "Entradas",
		type: "tags" as const,
		group: "entradas_salidas",
		placeholder: "Orden de compra, datos proveedor...",
		tooltip: "Documentos, datos o información que necesitas ANTES de empezar esta actividad. Pregúntate: ¿qué necesito tener en la mano para poder hacer esto? Ej: solicitud firmada, cotización, datos del cliente.",
	},
	{
		key: "outputs" as const,
		label: "Salidas",
		type: "tags" as const,
		group: "entradas_salidas",
		placeholder: "Factura validada, reporte...",
		tooltip: "Documentos, datos o resultados que se producen AL TERMINAR esta actividad. Pregúntate: ¿qué entrego o qué cambia cuando termino? Ej: factura aprobada, correo de confirmación, registro actualizado.",
	},
	{
		key: "costPerExecution" as const,
		label: "Costo por ejecución",
		type: "number" as const,
		group: "costos",
		tooltip: "Costo aproximado cada vez que se ejecuta esta actividad. Incluye el tiempo de la persona (costo hora x duración) y cualquier costo directo (licencias, materiales). Déjalo vacío si no lo conoces.",
	},
	{
		key: "costCurrency" as const,
		label: "Moneda",
		type: "text" as const,
		group: "costos",
		placeholder: "USD, MXN",
		tooltip: "La moneda del costo. Usa el código de 3 letras: USD (dólares), MXN (pesos mexicanos), EUR (euros), COP (pesos colombianos), etc.",
	},
] as const;

export const PROPERTY_GROUPS = [
	{ key: "general", label: "General" },
	{ key: "recursos", label: "Recursos y Tiempos" },
	{ key: "entradas_salidas", label: "Entradas / Salidas" },
	{ key: "costos", label: "Costos" },
] as const;
