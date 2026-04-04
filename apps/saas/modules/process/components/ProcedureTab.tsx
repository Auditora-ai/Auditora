"use client";

import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	ArrowDownIcon,
} from "lucide-react";
import type { ProcessStep } from "../data/mock-process";

interface ProcedureTabProps {
	steps: ProcessStep[];
}

export function ProcedureTab({ steps }: ProcedureTabProps) {
	return (
		<div className="space-y-4 px-4 py-4">
			<div className="mb-2">
				<h3 className="text-sm font-semibold text-slate-900">
					Procedimiento Operativo Estándar (SOP)
				</h3>
				<p className="text-xs text-slate-500 mt-0.5">
					Instrucciones paso a paso para la ejecución del proceso
				</p>
			</div>

			{steps.map((step, index) => (
				<div key={step.id} className="relative">
					{/* Card */}
					<div
						className={cn(
							"rounded-xl bg-white p-4 shadow-sm",
							step.hasRisk && "border-l-4 border-l-amber-400",
						)}
					>
						{/* Step header */}
						<div className="flex items-start gap-3 mb-3">
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
								<span className="text-xs font-bold">{step.number}</span>
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-slate-900 leading-tight">
									{step.name}
								</p>
								<Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
									{step.role}
								</Badge>
							</div>
						</div>

						{/* Instruction */}
						<p className="text-sm text-slate-700 leading-relaxed mb-3">
							{step.procedureInstruction}
						</p>

						{/* Inputs & Outputs */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<div className="flex items-center gap-1 mb-1.5">
									<ArrowRightIcon className="h-3 w-3 text-blue-500" />
									<span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
										Entradas
									</span>
								</div>
								<ul className="space-y-0.5">
									{step.inputsNeeded.map((input, i) => (
										<li
											key={i}
											className="text-xs text-slate-600 flex items-start gap-1"
										>
											<span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
											{input}
										</li>
									))}
								</ul>
							</div>
							<div>
								<div className="flex items-center gap-1 mb-1.5">
									<ArrowDownIcon className="h-3 w-3 text-green-500" />
									<span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
										Salidas
									</span>
								</div>
								<ul className="space-y-0.5">
									{step.outputsProduced.map((output, i) => (
										<li
											key={i}
											className="text-xs text-slate-600 flex items-start gap-1"
										>
											<span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-400" />
											{output}
										</li>
									))}
								</ul>
							</div>
						</div>

						{/* Risk warning */}
						{step.hasRisk && step.riskWarning && (
							<div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 border border-amber-200">
								<AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
								<p className="text-xs text-amber-800 leading-relaxed">
									{step.riskWarning}
								</p>
							</div>
						)}
					</div>

					{/* Connector */}
					{index < steps.length - 1 && (
						<div className="flex justify-center py-1">
							<div className="h-4 w-px bg-slate-200" />
						</div>
					)}
				</div>
			))}
		</div>
	);
}
