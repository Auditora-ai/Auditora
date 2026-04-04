/** Types shared across the Panorama module */

export interface PanoramaScoreTrendPoint {
	month: string;
	score: number;
}

export interface PanoramaProcessHeatmapRow {
	processName: string;
	avgAlignment: number;
	avgRisk: number;
	avgCriterio: number;
	simulationCount: number;
}

export interface PanoramaVulnerableProcess {
	name: string;
	avgScore: number;
	simulationCount: number;
}

export interface PanoramaActionItem {
	type: "evaluate" | "document" | "re-evaluate";
	processName: string;
	href: string;
}

export interface PanoramaActivityItem {
	type: "session_ended" | "evaluation_completed";
	title: string;
	subtitle: string;
	date: string;
}

export interface PanoramaData {
	organizationSlug: string;
	maturityScore: number;
	scoreTrend: PanoramaScoreTrendPoint[];
	/** Percentage of processes that have at least one documented version */
	documentedPercent: number;
	/** Percentage of members who have completed at least one evaluation */
	evaluatedPercent: number;
	/** Average alignment score across all evaluations */
	alignmentPercent: number;
	/** Evaluation completion rate */
	completionRate: number;
	/** Processes with avgScore < 60 */
	vulnerableProcesses: PanoramaVulnerableProcess[];
	/** Recommended actions derived from data */
	actions: PanoramaActionItem[];
	/** Recent activity feed */
	activity: PanoramaActivityItem[];
	/** Process heatmap for desktop view */
	processHeatmap: PanoramaProcessHeatmapRow[];
	/** Whether there's insufficient data to show meaningful info */
	insufficientData: boolean;
}
