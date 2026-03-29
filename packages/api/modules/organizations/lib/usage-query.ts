import { db } from "@repo/database";
import { estimateTokenCostUsd } from "@repo/ai";

export async function queryOrgUsage(orgId: string, days: number) {
	const since = new Date();
	since.setDate(since.getDate() - days);

	// AI token usage — aggregate by pipeline
	const byPipeline = await db.aiUsageLog.groupBy({
		by: ["pipeline", "model"],
		where: {
			organizationId: orgId,
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

	// AI token usage — raw logs for daily chart
	const rawLogs = await db.aiUsageLog.findMany({
		where: {
			organizationId: orgId,
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
	const byDay: Record<
		string,
		{
			inputTokens: number;
			outputTokens: number;
			calls: number;
			errors: number;
		}
	> = {};
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

	// Merge pipeline+model groups into pipeline-level rows with cost
	const pipelineMap = new Map<
		string,
		{
			pipeline: string;
			inputTokens: number;
			outputTokens: number;
			calls: number;
			avgDurationMs: number;
			estimatedCostUsd: number;
			durationCount: number;
			durationSum: number;
		}
	>();

	for (const p of byPipeline) {
		const input = p._sum.inputTokens ?? 0;
		const output = p._sum.outputTokens ?? 0;
		const cost = estimateTokenCostUsd(p.model, input, output);

		const existing = pipelineMap.get(p.pipeline);
		if (existing) {
			existing.inputTokens += input;
			existing.outputTokens += output;
			existing.calls += p._count;
			existing.estimatedCostUsd += cost;
			existing.durationSum += (p._avg.durationMs ?? 0) * p._count;
			existing.durationCount += p._count;
		} else {
			pipelineMap.set(p.pipeline, {
				pipeline: p.pipeline,
				inputTokens: input,
				outputTokens: output,
				calls: p._count,
				estimatedCostUsd: cost,
				avgDurationMs: 0,
				durationSum: (p._avg.durationMs ?? 0) * p._count,
				durationCount: p._count,
			});
		}
	}

	const pipelineRows = Array.from(pipelineMap.values()).map((row) => ({
		pipeline: row.pipeline,
		inputTokens: row.inputTokens,
		outputTokens: row.outputTokens,
		totalTokens: row.inputTokens + row.outputTokens,
		calls: row.calls,
		avgDurationMs:
			row.durationCount > 0
				? Math.round(row.durationSum / row.durationCount)
				: 0,
		estimatedCostUsd: Math.round(row.estimatedCostUsd * 10000) / 10000,
	}));

	const totalInputTokens = pipelineRows.reduce(
		(sum, p) => sum + p.inputTokens,
		0,
	);
	const totalOutputTokens = pipelineRows.reduce(
		(sum, p) => sum + p.outputTokens,
		0,
	);
	const totalAiCostUsd = pipelineRows.reduce(
		(sum, p) => sum + p.estimatedCostUsd,
		0,
	);

	// External costs (Deepgram, Recall.ai)
	const externalCostRows = await db.externalCostLog.groupBy({
		by: ["service"],
		where: {
			organizationId: orgId,
			createdAt: { gte: since },
		},
		_sum: {
			units: true,
			estimatedCostUsd: true,
		},
		_count: true,
	});

	const externalCosts = externalCostRows.map((r) => ({
		service: r.service,
		units: r._sum.units ?? 0,
		estimatedCostUsd:
			Math.round((r._sum.estimatedCostUsd ?? 0) * 10000) / 10000,
		count: r._count,
	}));

	const totalExternalCostUsd = externalCosts.reduce(
		(sum, r) => sum + r.estimatedCostUsd,
		0,
	);

	return {
		period: { days, since: since.toISOString() },
		totals: {
			inputTokens: totalInputTokens,
			outputTokens: totalOutputTokens,
			totalTokens: totalInputTokens + totalOutputTokens,
			calls: rawLogs.length,
			errors: rawLogs.filter((l) => !l.success).length,
			estimatedCostUsd: Math.round(totalAiCostUsd * 10000) / 10000,
		},
		byPipeline: pipelineRows,
		byDay: Object.entries(byDay).map(([date, data]) => ({
			date,
			...data,
			totalTokens: data.inputTokens + data.outputTokens,
		})),
		externalCosts,
		totalEstimatedCostUsd:
			Math.round((totalAiCostUsd + totalExternalCostUsd) * 10000) / 10000,
	};
}
