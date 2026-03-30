/**
 * Interview progress tracking via in-memory store.
 *
 * This works because the batch pipeline runs fire-and-forget in the same
 * Next.js process that handles the status poll requests. For multi-instance
 * deployments, migrate to the Redis utility in @repo/ai.
 */

export interface InterviewProgress {
	status: "processing" | "done" | "error";
	step?: string;
	progress?: number;
	bpmnXml?: string;
	riskSummary?: {
		totalRiskScore: number;
		criticalCount: number;
		highCount: number;
		topRiskArea: string;
	};
	risks?: Array<{
		title: string;
		description: string;
		riskType: string;
		severity: number;
		probability: number;
		source: string;
	}>;
	error?: string;
}

const progressStore = new Map<string, InterviewProgress>();

// Auto-cleanup after 10 minutes
const CLEANUP_TTL = 10 * 60 * 1000;

export async function setInterviewProgress(
	sessionId: string,
	progress: InterviewProgress,
): Promise<void> {
	progressStore.set(sessionId, progress);

	// Schedule cleanup for completed/errored progress
	if (progress.status === "done" || progress.status === "error") {
		setTimeout(() => {
			progressStore.delete(sessionId);
		}, CLEANUP_TTL);
	}
}

export async function getInterviewProgress(
	sessionId: string,
): Promise<InterviewProgress | null> {
	return progressStore.get(sessionId) || null;
}
