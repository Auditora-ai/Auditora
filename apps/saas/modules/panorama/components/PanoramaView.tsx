"use client";

import Link from "next/link";
import { Card, CardContent } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui";
import {
	AlertTriangle,
	ChevronRight,
	ClipboardCheck,
	FileSearch,
	RefreshCw,
	TrendingUp,
	TrendingDown,
} from "lucide-react";
import type { PanoramaData, PanoramaBreakdown } from "@panorama/data/mock-panorama";

// ─── Props ───────────────────────────────────────────────────────────────────

interface PanoramaViewProps {
	data: PanoramaData;
	organizationSlug: string;
}

// ─── Progress Ring ───────────────────────────────────────────────────────────

function ProgressRing({
	value,
	total,
	size = 40,
	strokeWidth = 4,
}: {
	value: number;
	total: number;
	size?: number;
	strokeWidth?: number;
}) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const pct = total > 0 ? value / total : 0;
	const offset = circumference * (1 - pct);

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			className="shrink-0 -rotate-90"
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				className="text-muted/30"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				className={cn(
					pct >= 0.7
						? "text-emerald-500"
						: pct >= 0.4
							? "text-amber-500"
							: "text-destructive",
				)}
			/>
		</svg>
	);
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({
	points,
	width = 280,
	height = 80,
}: {
	points: { label: string; value: number }[];
	width?: number;
	height?: number;
}) {
	if (points.length === 0) return null;

	const maxVal = Math.max(...points.map((p) => p.value), 1);
	const minVal = Math.min(...points.map((p) => p.value), 0);
	const range = maxVal - minVal || 1;

	const padding = { top: 8, bottom: 24, left: 8, right: 8 };
	const chartW = width - padding.left - padding.right;
	const chartH = height - padding.top - padding.bottom;

	const barWidth = Math.min(chartW / points.length - 4, 40);
	const gap = (chartW - barWidth * points.length) / (points.length + 1);

	return (
		<svg
			width="100%"
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			preserveAspectRatio="xMidYMid meet"
			className="w-full"
		>
			{points.map((point, i) => {
				const barH = ((point.value - minVal) / range) * chartH;
				const x = padding.left + gap + i * (barWidth + gap);
				const y = padding.top + chartH - barH;
				const isLast = i === points.length - 1;

				return (
					<g key={point.label}>
						<rect
							x={x}
							y={y}
							width={barWidth}
							height={barH}
							rx={4}
							className={cn(
								isLast
									? "fill-[hsl(var(--palette-action))]"
									: "fill-muted-foreground/20",
							)}
						/>
						<text
							x={x + barWidth / 2}
							y={height - 4}
							textAnchor="middle"
							className="fill-muted-foreground text-[10px]"
						>
							{point.label}
						</text>
						<text
							x={x + barWidth / 2}
							y={y - 4}
							textAnchor="middle"
							className="fill-foreground text-[10px] font-medium"
						>
							{point.value}%
						</text>
					</g>
				);
			})}
		</svg>
	);
}

// ─── Action Icon ─────────────────────────────────────────────────────────────

function ActionIcon({ type }: { type: string }) {
	switch (type) {
		case "evaluate":
			return <ClipboardCheck className="size-5 text-primary" />;
		case "capture":
			return <FileSearch className="size-5 text-primary" />;
		case "re-evaluate":
			return <RefreshCw className="size-5 text-primary" />;
		default:
			return <ClipboardCheck className="size-5 text-primary" />;
	}
}

// ─── Breakdown Card ──────────────────────────────────────────────────────────

function BreakdownCard({ item }: { item: PanoramaBreakdown }) {
	const displayValue = item.isPercentage
		? `${item.current}%`
		: `${item.current}/${item.total}`;

	return (
		<Card size="sm" className="flex-1 min-w-0">
			<CardContent className="flex items-center gap-3">
				<ProgressRing value={item.current} total={item.total} />
				<div className="min-w-0">
					<p className="text-xs text-muted-foreground truncate">
						{item.label}
					</p>
					<p className="text-lg font-semibold">{displayValue}</p>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PanoramaView({ data, organizationSlug }: PanoramaViewProps) {
	const isPositiveTrend = data.trendDelta >= 0;
	const basePath = `/${organizationSlug}`;

	return (
		<div className="flex flex-col gap-4 px-4 py-4 pb-24 max-w-2xl mx-auto">
			{/* ── Score Card ────────────────────────────────────────── */}
			<Card>
				<CardContent className="flex flex-col items-center gap-2 py-2">
					<p className="text-sm text-muted-foreground">Tu operación</p>
					<div className="flex items-baseline gap-3">
						<span className="text-5xl font-bold tracking-tight">
							{data.overallScore}%
						</span>
						<div
							className={cn(
								"flex items-center gap-1 text-sm font-medium",
								isPositiveTrend ? "text-emerald-500" : "text-destructive",
							)}
						>
							{isPositiveTrend ? (
								<TrendingUp className="size-4" />
							) : (
								<TrendingDown className="size-4" />
							)}
							<span>
								{isPositiveTrend ? "+" : ""}
								{data.trendDelta}%
							</span>
						</div>
					</div>
					<p className="text-xs text-muted-foreground">bajo control</p>
				</CardContent>
			</Card>

			{/* ── Breakdown Row ─────────────────────────────────────── */}
			<div className="flex gap-3">
				{data.breakdowns.map((item) => (
					<BreakdownCard key={item.label} item={item} />
				))}
			</div>

			{/* ── Alertas ───────────────────────────────────────────── */}
			{data.alerts.length > 0 && (
				<section className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-semibold">Alertas</h2>
						<Badge variant="destructive">{data.alerts.length}</Badge>
					</div>
					<div className="h-px bg-border" />
					<div className="flex flex-col gap-3">
						{data.alerts.map((alert) => (
							<Card
								key={alert.id}
								size="sm"
								className="border-l-4 border-l-destructive"
							>
								<CardContent className="flex items-start gap-3">
									<AlertTriangle className="size-5 shrink-0 text-destructive mt-0.5" />
									<div className="min-w-0">
										<p className="font-medium">{alert.title}</p>
										<p className="text-sm text-muted-foreground">
											{alert.description}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</section>
			)}

			{/* ── Acciones ──────────────────────────────────────────── */}
			{data.actions.length > 0 && (
				<section className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-semibold">Acciones sugeridas</h2>
					</div>
					<div className="h-px bg-border" />
					<div className="flex flex-col gap-3">
						{data.actions.map((action) => (
							<Link
								key={action.id}
								href={`${basePath}${action.href}`}
								className="block"
							>
								<Card
									size="sm"
									className="border-l-4 border-l-primary transition-colors hover:bg-muted/50 active:bg-muted"
								>
									<CardContent className="flex items-center gap-3">
										<ActionIcon type={action.type} />
										<div className="flex-1 min-w-0">
											<p className="font-medium">{action.title}</p>
											<p className="text-sm text-muted-foreground">
												{action.description}
											</p>
										</div>
										<ChevronRight className="size-5 shrink-0 text-muted-foreground" />
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* ── Tendencia ─────────────────────────────────────────── */}
			{data.trend.length > 0 && (
				<section className="flex flex-col gap-2">
					<h2 className="text-lg font-semibold">Tendencia</h2>
					<div className="h-px bg-border" />
					<Card size="sm">
						<CardContent>
							<Sparkline points={data.trend} />
						</CardContent>
					</Card>
				</section>
			)}
		</div>
	);
}
