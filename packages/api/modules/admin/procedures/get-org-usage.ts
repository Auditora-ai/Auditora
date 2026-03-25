import { ORPCError } from "@orpc/client";
import { db } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

export const getOrgUsage = adminProcedure
	.route({
		method: "GET",
		path: "/admin/organizations/{id}/usage",
		tags: ["Administration"],
		summary: "Get AI usage for an organization",
	})
	.input(
		z.object({
			id: z.string(),
			days: z.number().int().min(1).max(90).default(30),
		}),
	)
	.handler(async ({ input: { id, days } }) => {
		const org = await db.organization.findUnique({
			where: { id },
			select: { id: true, name: true, aiTier: true, aiTokenBudget: true },
		});
		if (!org) {
			throw new ORPCError("NOT_FOUND");
		}

		const since = new Date();
		since.setDate(since.getDate() - days);

		// Aggregate by pipeline
		const byPipeline = await db.aiUsageLog.groupBy({
			by: ["pipeline"],
			where: {
				organizationId: id,
				createdAt: { gte: since },
			},
			_sum: {
				inputTokens: true,
				outputTokens: true,
			},
			_count: true,
			_avg: {
				durationMs: true,
			},
		});

		// Aggregate by day for chart
		const rawLogs = await db.aiUsageLog.findMany({
			where: {
				organizationId: id,
				createdAt: { gte: since },
			},
			select: {
				inputTokens: true,
				outputTokens: true,
				createdAt: true,
				success: true,
			},
			orderBy: { createdAt: "asc" },
		});

		// Group by day
		const byDay: Record<string, { inputTokens: number; outputTokens: number; calls: number; errors: number }> = {};
		for (const log of rawLogs) {
			const day = log.createdAt.toISOString().split("T")[0]!;
			if (!byDay[day]) {
				byDay[day] = { inputTokens: 0, outputTokens: 0, calls: 0, errors: 0 };
			}
			byDay[day].inputTokens += log.inputTokens;
			byDay[day].outputTokens += log.outputTokens;
			byDay[day].calls += 1;
			if (!log.success) byDay[day].errors += 1;
		}

		const totalInputTokens = byPipeline.reduce((sum, p) => sum + (p._sum.inputTokens ?? 0), 0);
		const totalOutputTokens = byPipeline.reduce((sum, p) => sum + (p._sum.outputTokens ?? 0), 0);

		return {
			organization: org,
			period: { days, since: since.toISOString() },
			totals: {
				inputTokens: totalInputTokens,
				outputTokens: totalOutputTokens,
				totalTokens: totalInputTokens + totalOutputTokens,
				calls: rawLogs.length,
				errors: rawLogs.filter((l) => !l.success).length,
			},
			byPipeline: byPipeline.map((p) => ({
				pipeline: p.pipeline,
				inputTokens: p._sum.inputTokens ?? 0,
				outputTokens: p._sum.outputTokens ?? 0,
				totalTokens: (p._sum.inputTokens ?? 0) + (p._sum.outputTokens ?? 0),
				calls: p._count,
				avgDurationMs: Math.round(p._avg.durationMs ?? 0),
			})),
			byDay: Object.entries(byDay).map(([date, data]) => ({
				date,
				...data,
				totalTokens: data.inputTokens + data.outputTokens,
			})),
		};
	});
