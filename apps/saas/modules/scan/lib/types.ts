/**
 * Scan Feature - Type Definitions
 *
 * All shared types for the free scan / vulnerability assessment feature.
 */

// ── Analysis result from the LLM ────────────────────────────────────────────

export interface ScanAnalysis {
	companyName: string;
	industry: string;
	processes: Array<{
		name: string;
		description: string;
		riskLevel: "low" | "medium" | "high" | "critical";
	}>;
	highestRiskProcess: {
		name: string;
		risks: Array<{
			title: string;
			severity: number;
			description: string;
		}>;
	};
	vulnerabilityScore: number; // 0-100
	summary: string; // One paragraph executive summary
}

// ── UI phase tracking ───────────────────────────────────────────────────────

export type ScanPhase = "input" | "analyzing" | "results";

// ── SSE progress events ─────────────────────────────────────────────────────

export interface ScanProgress {
	step: number;
	totalSteps: number;
	message: string;
	data?: Partial<ScanAnalysis>;
}

// ── Session shape (mirrors Prisma AnonymousSession relevant fields) ─────────

export interface ScanSession {
	id: string;
	fingerprint: string;
	phase: string;
	sourceUrl: string | null;
	businessContext: string | null;
	businessDescription: string | null;
	industry: string | null;
	processName: string | null;
	riskResults: ScanAnalysis | null;
	shareToken: string | null;
	shareExpiresAt: Date | null;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}
