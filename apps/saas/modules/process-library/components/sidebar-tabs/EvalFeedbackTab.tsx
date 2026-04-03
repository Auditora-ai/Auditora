"use client";

import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	TrendingDownIcon,
	BarChart3Icon,
	UsersIcon,
} from "lucide-react";
import type { ProcessEvalFeedbackData, EvalStepFeedback } from "../../types";

interface EvalFeedbackTabProps {
	evalFeedback?: ProcessEvalFeedbackData;
}

function getRiskBadge(failureRate: number) {
	if (failureRate <= 20) {
		return {
			label: "Low",
			color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
			icon: CheckCircle2Icon,
		};
	}
	if (failureRate <= 50) {
		return {
			label: "Medium",
			color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
			icon: AlertTriangleIcon,
		};
	}
	if (failureRate <= 70) {
		return {
			label: "High",
			color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
			icon: TrendingDownIcon,
		};
	}
	return {
		label: "Critical",
		color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
		icon: AlertTriangleIcon,
	};
}

function StepFeedbackCard({ step }: { step: EvalStepFeedback }) {
	const risk = getRiskBadge(step.failureRate);
	const RiskIcon = risk.icon;

	return (
		<div className="rounded-lg border border-border p-3 space-y-2">
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1.5 mb-1">
						<span className="text-[10px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
							#{step.order}
						</span>
						<span className={`text-[10px] font-medium rounded px-1.5 py-0.5 inline-flex items-center gap-0.5 ${risk.color}`}>
							<RiskIcon className="h-2.5 w-2.5" />
							{risk.label}
						</span>
					</div>
					<p className="text-xs text-foreground line-clamp-2">
						{step.decisionPrompt}
					</p>
				</div>
				<div className="shrink-0 text-right">
					<div className="text-lg font-bold tabular-nums" style={{ color: step.failureRate > 50 ? "#DC2626" : step.failureRate > 20 ? "#EAB308" : "#16A34A" }}>
						{step.failureRate}%
					</div>
					<div className="text-[9px] text-muted-foreground">failure rate</div>
				</div>
			</div>

			{/* Progress bar */}
			<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
				<div
					className="h-full rounded-full transition-all"
					style={{
						width: `${step.failureRate}%`,
						background: step.failureRate > 50 ? "#DC2626" : step.failureRate > 20 ? "#EAB308" : "#16A34A",
					}}
				/>
			</div>

			<div className="flex items-center justify-between text-[10px] text-muted-foreground">
				<span>{step.totalResponses} responses</span>
				<span>{step.highRiskChoices} high-risk choices</span>
			</div>

			{step.proceduralReference && (
				<div className="text-[10px] text-muted-foreground border-t border-border pt-1.5 mt-1">
					<span className="font-medium">Procedure: </span>
					<span className="line-clamp-2">{step.proceduralReference}</span>
				</div>
			)}
		</div>
	);
}

export function EvalFeedbackTab({ evalFeedback }: EvalFeedbackTabProps) {
	if (!evalFeedback || !evalFeedback.hasData) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<BarChart3Icon className="mb-3 h-8 w-8 text-muted-foreground/40" />
				<p className="text-sm font-medium text-muted-foreground mb-1">
					No evaluation data yet
				</p>
				<p className="text-xs text-muted-foreground/70 max-w-[240px]">
					Generate an evaluation from this process and complete at least one simulation to see feedback.
				</p>
			</div>
		);
	}

	// Sort steps by failure rate (highest first)
	const sortedSteps = [...evalFeedback.steps].sort(
		(a, b) => b.failureRate - a.failureRate,
	);

	const avgFailureRate =
		evalFeedback.steps.length > 0
			? Math.round(
					evalFeedback.steps.reduce((s, st) => s + st.failureRate, 0) /
						evalFeedback.steps.length,
			  )
			: 0;

	const criticalSteps = evalFeedback.steps.filter(
		(s) => s.failureRate > 50,
	).length;

	return (
		<div className="space-y-4">
			{/* Summary header */}
			<div className="grid grid-cols-3 gap-2">
				<div className="rounded-lg border border-border p-2 text-center">
					<div className="text-lg font-bold tabular-nums">{evalFeedback.avgOverallScore}</div>
					<div className="text-[9px] text-muted-foreground">Avg Score</div>
				</div>
				<div className="rounded-lg border border-border p-2 text-center">
					<div className="flex items-center justify-center gap-1">
						<UsersIcon className="h-3 w-3 text-muted-foreground" />
						<span className="text-lg font-bold tabular-nums">{evalFeedback.totalRuns}</span>
					</div>
					<div className="text-[9px] text-muted-foreground">Evaluations</div>
				</div>
				<div className="rounded-lg border border-border p-2 text-center">
					<div className="text-lg font-bold tabular-nums" style={{ color: criticalSteps > 0 ? "#DC2626" : "#16A34A" }}>
						{criticalSteps}
					</div>
					<div className="text-[9px] text-muted-foreground">Critical Steps</div>
				</div>
			</div>

			{/* Overall failure rate bar */}
			{avgFailureRate > 0 && (
				<div className="rounded-lg border border-border p-2.5">
					<div className="flex items-center justify-between mb-1.5">
						<span className="text-xs font-medium">Average Step Failure Rate</span>
						<span className="text-xs font-bold tabular-nums" style={{ color: avgFailureRate > 50 ? "#DC2626" : avgFailureRate > 20 ? "#EAB308" : "#16A34A" }}>
							{avgFailureRate}%
						</span>
					</div>
					<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
						<div
							className="h-full rounded-full transition-all"
							style={{
								width: `${avgFailureRate}%`,
								background: avgFailureRate > 50 ? "#DC2626" : avgFailureRate > 20 ? "#EAB308" : "#16A34A",
							}}
						/>
					</div>
				</div>
			)}

			{/* Per-step cards */}
			<div className="space-y-2">
				<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					Decision Points
				</h4>
				{sortedSteps.map((step) => (
					<StepFeedbackCard key={step.order} step={step} />
				))}
			</div>
		</div>
	);
}
