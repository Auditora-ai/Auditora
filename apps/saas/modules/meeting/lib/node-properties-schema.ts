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
});

export type NodeProperties = z.infer<typeof NodePropertiesSchema>;

/** Field definitions for rendering the properties editor UI */
export const PROPERTY_FIELDS = [
	{
		key: "description" as const,
		label: "Descripción / Procedimiento",
		type: "richtext" as const,
		group: "general",
	},
	{
		key: "responsable" as const,
		label: "Responsable",
		type: "text" as const,
		group: "general",
	},
	{
		key: "slaValue" as const,
		label: "SLA",
		type: "number" as const,
		group: "recursos",
		suffix: "slaUnit",
	},
	{
		key: "slaUnit" as const,
		label: "Unidad SLA",
		type: "select" as const,
		group: "recursos",
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
	},
	{
		key: "estimatedDuration" as const,
		label: "Duración estimada (min)",
		type: "number" as const,
		group: "recursos",
	},
	{
		key: "systems" as const,
		label: "Sistemas",
		type: "tags" as const,
		group: "recursos",
		placeholder: "SAP, CRM, etc.",
	},
	{
		key: "inputs" as const,
		label: "Entradas",
		type: "tags" as const,
		group: "entradas_salidas",
		placeholder: "Orden de compra, datos proveedor...",
	},
	{
		key: "outputs" as const,
		label: "Salidas",
		type: "tags" as const,
		group: "entradas_salidas",
		placeholder: "Factura validada, reporte...",
	},
	{
		key: "costPerExecution" as const,
		label: "Costo por ejecución",
		type: "number" as const,
		group: "costos",
	},
	{
		key: "costCurrency" as const,
		label: "Moneda",
		type: "text" as const,
		group: "costos",
		placeholder: "USD, MXN",
	},
] as const;

export const PROPERTY_GROUPS = [
	{ key: "general", label: "General" },
	{ key: "recursos", label: "Recursos y Tiempos" },
	{ key: "entradas_salidas", label: "Entradas / Salidas" },
	{ key: "costos", label: "Costos" },
] as const;
