"use client";

import { Badge } from "@repo/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

function formatTokens(tokens: number): string {
	if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
	if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
	return String(tokens);
}

function formatCost(usd: number): string {
	if (usd >= 1) return `$${usd.toFixed(2)}`;
	if (usd >= 0.01) return `$${usd.toFixed(3)}`;
	if (usd > 0) return `$${usd.toFixed(4)}`;
	return "$0.00";
}

const TIER_LABELS: Record<string, { label: string; variant: "info" | "warning" | "success" }> = {
	budget: { label: "Budget (DeepSeek)", variant: "warning" },
	standard: { label: "Standard (Sonnet)", variant: "info" },
	premium: { label: "Premium (Opus)", variant: "success" },
};

export function AiUsageDashboard({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations("organizations.settings.ai");
	const { data, isLoading } = useQuery(
		orpc.organizations.ai.usage.queryOptions({
			input: { organizationId, days: 30 },
		}),
	);

	const tierInfo = TIER_LABELS[data?.organization?.aiTier ?? "standard"] ?? TIER_LABELS.standard;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="font-medium">{t("usage.title")}</CardTitle>
						<CardDescription className="text-foreground/60 leading-snug">
							{t("usage.description")}
						</CardDescription>
					</div>
					{data?.organization?.aiTier && (
						<Badge status={tierInfo.variant}>
							{tierInfo.label}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Summary cards */}
				{isLoading ? (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				) : data?.totals ? (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
						<div>
							<p className="text-2xl font-semibold tabular-nums">
								{formatTokens(data.totals.totalTokens)}
							</p>
							<p className="text-sm text-muted-foreground">
								{t("usage.totalTokens")}
							</p>
						</div>
						<div>
							<p className="text-2xl font-semibold tabular-nums">
								{data.totals.calls}
							</p>
							<p className="text-sm text-muted-foreground">
								{t("usage.totalCalls")}
							</p>
						</div>
						<div>
							<p className="text-2xl font-semibold tabular-nums">
								{formatTokens(data.totals.inputTokens)}
							</p>
							<p className="text-sm text-muted-foreground">
								{t("usage.inputTokens")}
							</p>
						</div>
						<div>
							<p className="text-2xl font-semibold tabular-nums text-red-500">
								{data.totals.errors}
							</p>
							<p className="text-sm text-muted-foreground">
								{t("usage.errors")}
							</p>
						</div>
						<div>
							<p className="text-2xl font-semibold tabular-nums text-emerald-600">
								{formatCost(data.totalEstimatedCostUsd)}
							</p>
							<p className="text-sm text-muted-foreground">
								{t("usage.estimatedCost")}
							</p>
						</div>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">{t("usage.noData")}</p>
				)}

				{/* Pipeline breakdown */}
				{data?.byPipeline && data.byPipeline.length > 0 && (
					<div>
						<h4 className="font-medium mb-2 text-sm">
							{t("usage.pipelineBreakdown")}
						</h4>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("usage.pipeline")}</TableHead>
										<TableHead className="text-right">{t("usage.calls")}</TableHead>
										<TableHead className="text-right">Input</TableHead>
										<TableHead className="text-right">Output</TableHead>
										<TableHead className="text-right">Total</TableHead>
										<TableHead className="text-right">{t("usage.estimatedCost")}</TableHead>
										<TableHead className="text-right">{t("usage.avgDuration")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.byPipeline
										.sort((a, b) => b.totalTokens - a.totalTokens)
										.map((p) => (
											<TableRow key={p.pipeline}>
												<TableCell>
													<Badge status="info" className="font-mono text-xs">
														{p.pipeline}
													</Badge>
												</TableCell>
												<TableCell className="text-right tabular-nums">
													{p.calls}
												</TableCell>
												<TableCell className="text-right tabular-nums">
													{formatTokens(p.inputTokens)}
												</TableCell>
												<TableCell className="text-right tabular-nums">
													{formatTokens(p.outputTokens)}
												</TableCell>
												<TableCell className="text-right tabular-nums font-medium">
													{formatTokens(p.totalTokens)}
												</TableCell>
												<TableCell className="text-right tabular-nums text-emerald-600">
													{formatCost(p.estimatedCostUsd)}
												</TableCell>
												<TableCell className="text-right tabular-nums">
													{p.avgDurationMs > 0
														? `${(p.avgDurationMs / 1000).toFixed(1)}s`
														: "---"}
												</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</div>
					</div>
				)}

				{/* External costs */}
				{data?.externalCosts && data.externalCosts.length > 0 && (
					<div>
						<h4 className="font-medium mb-2 text-sm">
							{t("externalCosts.title")}
						</h4>
						<p className="text-xs text-muted-foreground mb-3">
							{t("externalCosts.description")}
						</p>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{data.externalCosts.map((ext) => (
								<div
									key={ext.service}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div>
										<p className="font-medium text-sm">
											{ext.service === "deepgram-stt"
												? t("externalCosts.deepgramStt")
												: t("externalCosts.recallBot")}
										</p>
										<p className="text-xs text-muted-foreground">
											{ext.units.toFixed(1)} {t("externalCosts.minutes")}
										</p>
									</div>
									<p className="text-lg font-semibold tabular-nums text-emerald-600">
										{formatCost(ext.estimatedCostUsd)}
									</p>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Daily usage chart */}
				{data?.byDay && data.byDay.length > 0 && (
					<div>
						<h4 className="font-medium mb-2 text-sm">
							{t("usage.dailyUsage")}
						</h4>
						<div className="flex items-end gap-1 h-32">
							{data.byDay.map((day) => {
								const maxTokens = Math.max(
									...data.byDay.map((d) => d.totalTokens),
								);
								const height =
									maxTokens > 0
										? Math.max(4, (day.totalTokens / maxTokens) * 100)
										: 4;

								return (
									<div
										key={day.date}
										className="flex-1 flex flex-col items-center gap-1"
										title={`${day.date}: ${formatTokens(day.totalTokens)} tokens, ${day.calls} calls`}
									>
										<div
											className="w-full bg-primary/60 rounded-t"
											style={{ height: `${height}%` }}
										/>
										{data.byDay.length <= 15 && (
											<span className="text-[9px] text-muted-foreground tabular-nums">
												{day.date.slice(5)}
											</span>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
