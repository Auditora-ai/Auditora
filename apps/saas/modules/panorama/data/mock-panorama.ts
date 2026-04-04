// ─── Panorama Mock Data ──────────────────────────────────────────────────────

export interface PanoramaTrendPoint {
	label: string;
	value: number;
}

export interface PanoramaBreakdown {
	label: string;
	current: number;
	total: number;
	/** Display as percentage instead of fraction */
	isPercentage?: boolean;
}

export interface PanoramaAlert {
	id: string;
	title: string;
	description: string;
	severity: "critical" | "warning";
}

export interface PanoramaAction {
	id: string;
	title: string;
	description: string;
	href: string;
	type: "evaluate" | "capture" | "re-evaluate";
}

export interface PanoramaData {
	/** Overall operational readiness score (0-100) */
	overallScore: number;
	/** Trend direction: positive = improving, negative = declining */
	trendDelta: number;
	breakdowns: PanoramaBreakdown[];
	alerts: PanoramaAlert[];
	actions: PanoramaAction[];
	trend: PanoramaTrendPoint[];
}

export const MOCK_PANORAMA: PanoramaData = {
	overallScore: 67,
	trendDelta: 4,
	breakdowns: [
		{ label: "Documentación", current: 8, total: 12 },
		{ label: "Evaluados", current: 3, total: 12 },
		{ label: "Alineación", current: 72, total: 100, isPercentage: true },
	],
	alerts: [
		{
			id: "alert-rrhh",
			title: "RRHH Onboarding",
			description: "45% alineación — 2 personas en riesgo",
			severity: "critical",
		},
		{
			id: "alert-produccion",
			title: "Producción",
			description: "4 riesgos FMEA sin mitigar",
			severity: "warning",
		},
	],
	actions: [
		{
			id: "action-compras",
			title: "Evalúa Compras",
			description: "Nadie ha sido evaluado",
			href: "/evaluaciones",
			type: "evaluate",
		},
		{
			id: "action-logistica",
			title: "Documenta Logística",
			description: "Solo capturado",
			href: "/descubrir",
			type: "capture",
		},
		{
			id: "action-produccion",
			title: "Re-evalúa Producción",
			description: "Último score: 55%",
			href: "/evaluaciones",
			type: "re-evaluate",
		},
	],
	trend: [
		{ label: "Ene", value: 42 },
		{ label: "Feb", value: 51 },
		{ label: "Mar", value: 59 },
		{ label: "Abr", value: 67 },
	],
};
