"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import {
	ShieldAlertIcon,
	CheckCircle2Icon,
} from "lucide-react";
import type { ProcessRisk } from "../data/mock-process";

interface RisksTabProps {
	risks: ProcessRisk[];
}

function getRpnColor(rpn: number) {
	if (rpn > 200) return "border-l-red-500";
	if (rpn >= 100) return "border-l-amber-400";
	return "border-l-green-500";
}

function getRpnBg(rpn: number) {
	if (rpn > 200) return "bg-red-500";
	if (rpn >= 100) return "bg-amber-500";
	return "bg-green-500";
}

function getRpnLabel(rpn: number) {
	if (rpn > 200) return "Crítico";
	if (rpn >= 100) return "Alto";
	return "Aceptable";
}

function getRpnBadgeClass(rpn: number) {
	if (rpn > 200) return "bg-red-100 text-red-700";
	if (rpn >= 100) return "bg-amber-100 text-amber-700";
	return "bg-green-100 text-green-700";
}

export function RisksTab({ risks }: RisksTabProps) {
	const sorted = [...risks].sort((a, b) => b.rpn - a.rpn);

	return (
		<div className="space-y-4 px-4 py-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-semibold text-slate-900">
						Análisis FMEA
					</h3>
					<p className="text-xs text-slate-500 mt-0.5">
						{risks.length} riesgos identificados, ordenados por RPN
					</p>
				</div>
				{/* Legend */}
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-full bg-red-500" />
						<span className="text-[10px] text-slate-500">&gt;200</span>
					</div>
					<div className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-full bg-amber-500" />
						<span className="text-[10px] text-slate-500">100-200</span>
					</div>
					<div className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-full bg-green-500" />
						<span className="text-[10px] text-slate-500">&lt;100</span>
					</div>
				</div>
			</div>

			{sorted.map((risk) => (
				<div
					key={risk.id}
					className={cn(
						"rounded-xl bg-white p-4 shadow-sm border-l-4",
						getRpnColor(risk.rpn),
					)}
				>
					{/* RPN badge + description */}
					<div className="flex items-start gap-3">
						<div className="shrink-0 text-center">
							<div
								className={cn(
									"flex h-12 w-12 items-center justify-center rounded-lg",
									getRpnBadgeClass(risk.rpn),
								)}
							>
								<div>
									<p className="text-lg font-bold leading-none">{risk.rpn}</p>
									<p className="text-[8px] font-medium uppercase mt-0.5">RPN</p>
								</div>
							</div>
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold text-slate-900 leading-tight">
								{risk.description}
							</p>
							<div className="mt-1 flex items-center gap-1.5">
								<ShieldAlertIcon className="h-3 w-3 text-slate-400" />
								<span className="text-[10px] text-slate-500">
									Paso: {risk.affectedStepName}
								</span>
							</div>
						</div>
						<Badge className={cn("shrink-0 text-[10px]", getRpnBadgeClass(risk.rpn))}>
							{getRpnLabel(risk.rpn)}
						</Badge>
					</div>

					{/* Failure mode & effect */}
					<div className="mt-3 grid grid-cols-1 gap-2">
						<div className="rounded-lg bg-slate-50 p-2.5">
							<p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
								Modo de fallo
							</p>
							<p className="text-xs text-slate-700">{risk.failureMode}</p>
						</div>
						<div className="rounded-lg bg-slate-50 p-2.5">
							<p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
								Efecto
							</p>
							<p className="text-xs text-slate-700">{risk.failureEffect}</p>
						</div>
					</div>

					{/* S x F x D scores */}
					<div className="mt-3 flex items-center justify-center gap-2">
						<div className="rounded-lg bg-slate-100 px-3 py-1.5 text-center">
							<p className="text-[10px] text-slate-500 font-medium">Severidad</p>
							<p className="text-sm font-bold text-slate-900">{risk.severity}</p>
						</div>
						<span className="text-slate-400 font-bold text-xs">×</span>
						<div className="rounded-lg bg-slate-100 px-3 py-1.5 text-center">
							<p className="text-[10px] text-slate-500 font-medium">Frecuencia</p>
							<p className="text-sm font-bold text-slate-900">{risk.frequency}</p>
						</div>
						<span className="text-slate-400 font-bold text-xs">×</span>
						<div className="rounded-lg bg-slate-100 px-3 py-1.5 text-center">
							<p className="text-[10px] text-slate-500 font-medium">Detección</p>
							<p className="text-sm font-bold text-slate-900">{risk.detection}</p>
						</div>
						<span className="text-slate-400 font-bold text-xs">=</span>
						<div
							className={cn(
								"rounded-lg px-3 py-1.5 text-center",
								getRpnBadgeClass(risk.rpn),
							)}
						>
							<p className="text-[10px] font-medium">RPN</p>
							<p className="text-sm font-bold">{risk.rpn}</p>
						</div>
					</div>

					{/* Mitigation actions */}
					{risk.mitigationActions.length > 0 && (
						<div className="mt-3 pt-3 border-t border-slate-100">
							<p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
								Acciones de mitigación
							</p>
							<ul className="space-y-1">
								{risk.mitigationActions.map((action, i) => (
									<li
										key={i}
										className="flex items-start gap-1.5 text-xs text-slate-600"
									>
										<CheckCircle2Icon className="h-3.5 w-3.5 shrink-0 text-green-500 mt-0.5" />
										{action}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			))}
		</div>
	);
}
