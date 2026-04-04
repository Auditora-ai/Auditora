import { useMemo } from "react";

export type ProcessStatus = "DRAFT" | "CAPTURED" | "DOCUMENTED" | "EVALUATED";
export type ProcessCategory = "strategic" | "core" | "support";

export interface ProcessMapItem {
	id: string;
	name: string;
	description: string | null;
	category: ProcessCategory;
	processStatus: ProcessStatus;
	priority: number;
	/** Only present when status is EVALUATED */
	alignmentPct?: number;
	/** Only present when status is EVALUATED */
	riskCount?: number;
}

export interface ProcessMapData {
	processes: ProcessMapItem[];
	orgName: string;
	industry: string;
	totalCount: number;
	documentedCount: number;
	evaluatedCount: number;
}

const MOCK_PROCESSES: ProcessMapItem[] = [
	// ESTRATÉGICOS
	{
		id: "proc-001",
		name: "Planificación Estratégica",
		description: "Definición de objetivos y metas organizacionales",
		category: "strategic",
		processStatus: "EVALUATED",
		priority: 1,
		alignmentPct: 87,
		riskCount: 2,
	},
	{
		id: "proc-002",
		name: "Gestión de la Innovación",
		description: "Procesos de innovación y mejora continua",
		category: "strategic",
		processStatus: "DOCUMENTED",
		priority: 2,
	},
	{
		id: "proc-003",
		name: "Gestión de Riesgos Corporativos",
		description: "Identificación y mitigación de riesgos",
		category: "strategic",
		processStatus: "EVALUATED",
		priority: 3,
		alignmentPct: 45,
		riskCount: 7,
	},
	// OPERATIVOS
	{
		id: "proc-004",
		name: "Producción y Operaciones",
		description: "Gestión de la cadena productiva",
		category: "core",
		processStatus: "EVALUATED",
		priority: 1,
		alignmentPct: 92,
		riskCount: 1,
	},
	{
		id: "proc-005",
		name: "Gestión Comercial",
		description: "Ventas y relaciones con clientes",
		category: "core",
		processStatus: "EVALUATED",
		priority: 2,
		alignmentPct: 73,
		riskCount: 3,
	},
	{
		id: "proc-006",
		name: "Logística y Distribución",
		description: "Cadena de suministro y entregas",
		category: "core",
		processStatus: "DOCUMENTED",
		priority: 3,
	},
	{
		id: "proc-007",
		name: "Servicio al Cliente",
		description: "Atención y soporte postventa",
		category: "core",
		processStatus: "CAPTURED",
		priority: 4,
	},
	{
		id: "proc-008",
		name: "Control de Calidad",
		description: "Aseguramiento de la calidad del producto",
		category: "core",
		processStatus: "DRAFT",
		priority: 5,
	},
	// SOPORTE
	{
		id: "proc-009",
		name: "Gestión del Talento Humano",
		description: "Reclutamiento, capacitación y bienestar",
		category: "support",
		processStatus: "EVALUATED",
		priority: 1,
		alignmentPct: 68,
		riskCount: 4,
	},
	{
		id: "proc-010",
		name: "Gestión Financiera",
		description: "Contabilidad, presupuestos y tesorería",
		category: "support",
		processStatus: "DOCUMENTED",
		priority: 2,
	},
	{
		id: "proc-011",
		name: "Tecnología de la Información",
		description: "Infraestructura y sistemas digitales",
		category: "support",
		processStatus: "CAPTURED",
		priority: 3,
	},
	{
		id: "proc-012",
		name: "Gestión Legal y Cumplimiento",
		description: "Normativa, contratos y compliance",
		category: "support",
		processStatus: "DRAFT",
		priority: 4,
	},
];

export function useProcessMap(orgSlug: string): ProcessMapData {
	return useMemo(() => {
		const processes = MOCK_PROCESSES;
		const totalCount = processes.length;
		const documentedCount = processes.filter(
			(p) => p.processStatus === "DOCUMENTED" || p.processStatus === "EVALUATED",
		).length;
		const evaluatedCount = processes.filter(
			(p) => p.processStatus === "EVALUATED",
		).length;

		return {
			processes,
			orgName: "Acme Manufacturing",
			industry: "Manufactura",
			totalCount,
			documentedCount,
			evaluatedCount,
		};
	}, [orgSlug]);
}
