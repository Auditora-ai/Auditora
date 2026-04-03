import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const getNavSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/organizations/nav-summary",
		tags: ["Organizations"],
		summary: "Get sidebar navigation summary data",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input: { organizationId } }) => {
		const membership = await verifyOrganizationMembership(
			organizationId,
			user.id,
		);
		if (!membership) {
			return null;
		}

		const architecture = await db.processArchitecture.findUnique({
			where: { organizationId },
			select: { id: true },
		});

		if (!architecture) {
			return {
				maturityScore: 0,
				criticalRiskCount: 0,
				nextSession: null,
				processStats: { documented: 0, total: 0 },
				pendingDeliverables: 0,
				hasActiveSession: false,
			};
		}

		// Run all queries in parallel
		const [
			processStats,
			criticalRisks,
			nextSession,
			activeSession,
			riskCoverageData,
		] = await Promise.all([
			// Process stats: documented (has at least 1 version) vs total
			db.processDefinition.findMany({
				where: {
					architectureId: architecture.id,
					level: "PROCESS",
				},
				select: {
					id: true,
					versions: { select: { id: true }, take: 1 },
					risks: { select: { id: true }, take: 1 },
				},
			}),

			// Critical risks count
			db.processRisk.count({
				where: {
					processDefinition: {
						architectureId: architecture.id,
					},
					severity: { gte: 4 },
					probability: { gte: 4 },
					status: { notIn: ["CLOSED", "ACCEPTED"] },
				},
			}),

			// Next scheduled session
			db.meetingSession.findFirst({
				where: {
					organizationId,
					status: "SCHEDULED",
					scheduledFor: { gte: new Date() },
				},
				orderBy: { scheduledFor: "asc" },
				select: {
					scheduledFor: true,
					processDefinition: {
						select: { name: true },
					},
				},
			}),

			// Active session check
			db.meetingSession.findFirst({
				where: {
					organizationId,
					status: { in: ["ACTIVE", "CONNECTING"] },
				},
				select: { id: true },
			}),

			// For maturity score: risk coverage data
			db.processRisk.findMany({
				where: {
					processDefinition: {
						architectureId: architecture.id,
					},
				},
				select: {
					status: true,
					controls: { select: { id: true }, take: 1 },
					mitigations: {
						select: { status: true },
					},
				},
			}),
		]);

		const totalProcesses = processStats.length;
		const documentedProcesses = processStats.filter(
			(p) => p.versions.length > 0,
		).length;
		const processesWithRisks = processStats.filter(
			(p) => p.risks.length > 0,
		).length;

		// Calculate maturity score
		const totalRisks = riskCoverageData.length;
		const risksWithControls = riskCoverageData.filter(
			(r) => r.controls.length > 0,
		).length;
		const totalMitigations = riskCoverageData.flatMap(
			(r) => r.mitigations,
		).length;
		const completedMitigations = riskCoverageData
			.flatMap((r) => r.mitigations)
			.filter((m) => m.status === "COMPLETED").length;

		const processDocumentation =
			totalProcesses > 0 ? documentedProcesses / totalProcesses : 0;
		const riskCoverage =
			totalProcesses > 0 ? processesWithRisks / totalProcesses : 0;
		const controlMapping =
			totalRisks > 0 ? risksWithControls / totalRisks : 0;
		const mitigationCompletion =
			totalMitigations > 0
				? completedMitigations / totalMitigations
				: 0;

		const maturityScore = Math.round(
			(processDocumentation * 0.3 +
				riskCoverage * 0.3 +
				controlMapping * 0.2 +
				mitigationCompletion * 0.2) *
				100,
		);

		// Pending deliverables: processes with completed sessions but no recent exports
		// Using Prisma queries instead of raw SQL to avoid column name mismatches
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const processesWithEndedSessions = await db.processDefinition.findMany({
			where: {
				architectureId: architecture.id,
				sessions: {
					some: { status: "ENDED" },
				},
			},
			select: {
				id: true,
				sessions: {
					where: { status: "ENDED" },
					select: {
						sessionDeliverables: {
							where: {
								status: "completed",
								createdAt: { gte: thirtyDaysAgo },
							},
							select: { id: true },
							take: 1,
						},
					},
				},
			},
		});
		const pendingDeliverablesCount = processesWithEndedSessions.filter(
			(p) => !p.sessions.some((s) => s.sessionDeliverables.length > 0),
		).length;

		return {
			maturityScore,
			criticalRiskCount: criticalRisks,
			nextSession: nextSession
				? {
						date: nextSession.scheduledFor!,
						processName:
							nextSession.processDefinition?.name ?? null,
					}
				: null,
			processStats: {
				documented: documentedProcesses,
				total: totalProcesses,
			},
			pendingDeliverables: pendingDeliverablesCount,
			hasActiveSession: !!activeSession,
		};
	});
