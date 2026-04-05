/** Types shared across the Home module */

export interface ProcessItem {
	id: string;
	name: string;
	category: "strategic" | "operative" | "support";
	status: "DRAFT" | "CAPTURED" | "DOCUMENTED" | "EVALUATED";
	alignmentScore: number | null;
	riskCount: number;
	criticalRiskCount: number;
	evalCount: number;
}

export interface TopRisk {
	id: string;
	title: string;
	description: string | null;
	processName: string;
	severity: number;
	probability: number;
	riskScore: number;
}

export interface ActivityItem {
	type: "session_ended" | "risk_found" | "process_updated" | "evaluation_completed";
	title: string;
	subtitle: string;
	date: string;
}

export interface VulnerableProcess {
	name: string;
	avgScore: number;
	processId: string;
	simulationCount: number;
}

export interface NextStepRecommendation {
	id: string;
	message: string;
	href: string;
	icon: "scan" | "evaluate" | "improve" | "remind" | "grow";
}

export interface EvaluacionesSummary {
	orgAvgScore: number;
	totalSimulations: number;
	membersEvaluated: number;
	completionRate: number;
	dimensionAverages: {
		alignment: number;
		riskLevel: number;
		criterio: number;
	};
	scoreTrend: Array<{ month: string; score: number }>;
}

export interface HomePageProps {
	organizationId: string;
	organizationName: string;
	organizationSlug: string;
	basePath: string;
	processes: ProcessItem[];
	maturityScore: number;
	topRisks: TopRisk[];
	nextSession: {
		id: string;
		scheduledFor: string;
		processName: string | null;
		status: string;
	} | null;
	recentActivity: ActivityItem[];
	processCount: number;
	documentedCount: number;
	riskCount: number;
	hasActiveSession: boolean;
	evaluaciones?: EvaluacionesSummary | null;
	vulnerableProcesses?: VulnerableProcess[];
	nextSteps?: NextStepRecommendation[];
}
