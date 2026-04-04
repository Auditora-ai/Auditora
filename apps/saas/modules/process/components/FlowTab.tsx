"use client";

import { useState } from "react";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui";
import {
	ChevronDownIcon,
	AlertTriangleIcon,
	ClockIcon,
} from "lucide-react";
import type { ProcessStep } from "../data/mock-process";

interface FlowTabProps {
	steps: ProcessStep[];
}

function RiskDot({ level }: { level: "high" | "medium" | "low" }) {
	return (
		<span
			className={cn(
				"inline-block h-2 w-2 shrink-0 rounded-full",
				level === "high" && "bg-red-500",
				level === "medium" && "bg-amber-500",
				level === "low" && "bg-green-500",
			)}
			title={`Riesgo ${level === "high" ? "alto" : level === "medium" ? "medio" : "bajo"}`}
		/>
	);
}

function FlowCard({ step }: { step: ProcessStep }) {
	const [expanded, setExpanded] = useState(false);

	if (step.isDecisionPoint) {
		return (
			<div className="relative flex flex-col items-center">
				{/* Diamond card */}
				<button
					onClick={() => setExpanded(!expanded)}
					className="relative z-10 w-full"
				>
					<div className="mx-auto w-[85%] rotate-0">
						<div className="rounded-xl border-2 border-action bg-white p-4 shadow-sm">
							<div className="flex items-start gap-3">
								{/* Step number diamond */}
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rotate-45 border-2 border-action bg-action/10">
									<span className="rotate-[-45deg] text-xs font-bold text-action">
										{step.number}
									</span>
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="text-sm font-semibold text-slate-900 leading-tight">
											{step.name}
										</p>
										<RiskDot level={step.riskLevel} />
									</div>
									<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
										<Badge variant="outline" className="text-[10px] px-1.5 py-0">
											{step.role}
										</Badge>
										<span className="flex items-center gap-0.5 text-[10px] text-slate-500">
											<ClockIcon className="h-3 w-3" />
											{step.durationEstimate}
										</span>
									</div>
									{/* Decision options */}
									<div className="mt-2 space-y-1">
										{step.decisionOptions?.map((opt, i) => (
											<div
												key={i}
												className="flex items-center gap-1.5 text-xs text-slate-600"
											>
												<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-action/60" />
												{opt.label}
											</div>
										))}
									</div>
									<ChevronDownIcon
										className={cn(
											"mt-1 h-4 w-4 text-slate-400 transition-transform duration-200",
											expanded && "rotate-180",
										)}
									/>
								</div>
							</div>
						</div>
					</div>
				</button>

				{/* Expanded detail */}
				<div
					className={cn(
						"w-full overflow-hidden transition-all duration-300 ease-in-out",
						expanded ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0",
					)}
				>
					<div className="mx-4 rounded-lg bg-slate-50 p-4 text-sm">
						<p className="text-slate-700 leading-relaxed">
							{step.detailedInstructions}
						</p>
						{step.quePuedeSalirMal.length > 0 && (
							<div className="mt-3">
								<div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
									<AlertTriangleIcon className="h-3.5 w-3.5" />
									¿Qué puede salir mal?
								</div>
								<ul className="mt-1.5 space-y-1">
									{step.quePuedeSalirMal.map((item, i) => (
										<li
											key={i}
											className="flex items-start gap-1.5 text-xs text-slate-600"
										>
											<span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
											{item}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative">
			<button
				onClick={() => setExpanded(!expanded)}
				className="w-full text-left"
			>
				<div className="rounded-xl bg-white p-4 shadow-sm">
					<div className="flex items-start gap-3">
						{/* Step number circle */}
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action text-white">
							<span className="text-xs font-bold">{step.number}</span>
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<p className="text-sm font-semibold text-slate-900 leading-tight">
									{step.name}
								</p>
								<RiskDot level={step.riskLevel} />
							</div>
							<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
								<Badge variant="outline" className="text-[10px] px-1.5 py-0">
									{step.role}
								</Badge>
								<span className="flex items-center gap-0.5 text-[10px] text-slate-500">
									<ClockIcon className="h-3 w-3" />
									{step.durationEstimate}
								</span>
							</div>
							<ChevronDownIcon
								className={cn(
									"mt-1 h-4 w-4 text-slate-400 transition-transform duration-200",
									expanded && "rotate-180",
								)}
							/>
						</div>
					</div>
				</div>
			</button>

			{/* Expanded detail */}
			<div
				className={cn(
					"overflow-hidden transition-all duration-300 ease-in-out",
					expanded ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0",
				)}
			>
				<div className="mx-4 rounded-lg bg-slate-50 p-4 text-sm">
					<p className="text-slate-700 leading-relaxed">
						{step.detailedInstructions}
					</p>
					{step.quePuedeSalirMal.length > 0 && (
						<div className="mt-3">
							<div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
								<AlertTriangleIcon className="h-3.5 w-3.5" />
								¿Qué puede salir mal?
							</div>
							<ul className="mt-1.5 space-y-1">
								{step.quePuedeSalirMal.map((item, i) => (
									<li
										key={i}
										className="flex items-start gap-1.5 text-xs text-slate-600"
									>
										<span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
										{item}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function FlowTab({ steps }: FlowTabProps) {
	return (
		<div className="relative px-4 py-4">
			{/* Vertical connecting line */}
			<div className="absolute left-[2.45rem] top-8 bottom-8 w-px bg-slate-200" />

			<div className="relative space-y-3">
				{steps.map((step) => (
					<FlowCard key={step.id} step={step} />
				))}
			</div>
		</div>
	);
}
