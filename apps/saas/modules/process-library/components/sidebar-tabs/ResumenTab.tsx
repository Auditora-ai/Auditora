"use client";

import { useMemo } from "react";
import {
	AlertCircleIcon,
	CircleIcon,
	Table2Icon,
	ShieldAlertIcon,
	GitBranchIcon,
	VideoIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	calculatePhaseCompleteness,
	calculateOverallHealth,
} from "../ProcessPhaseDashboard";
import type { ProcessData } from "../../types";

interface ResumenTabProps {
	process: ProcessData;
}

export function ResumenTab({ process }: ResumenTabProps) {
	const t = useTranslations("processLibrary.sidebar");
	const scores = useMemo(
		() =>
			calculatePhaseCompleteness({
				...process,
				risksCount: process.risksCount ?? 0,
				hasIntelligence: process.hasIntelligence ?? false,
			}),
		[process],
	);
	const health = calculateOverallHealth(scores);

	const gaps = useMemo(() => {
		const items: { label: string; severity: "error" | "warning" }[] = [];
		if (!process.bpmnXml) items.push({ label: t("noDiagram"), severity: "error" });
		if (!process.description) items.push({ label: t("noDescription"), severity: "warning" });
		if (process.raciCount === 0) items.push({ label: t("noRaci"), severity: "warning" });
		if (process.risksCount === 0) items.push({ label: t("noRiskAnalysis"), severity: "warning" });
		if (process.sessionsCount === 0) items.push({ label: t("noCaptureSessions"), severity: "warning" });
		if ((process.goals?.length ?? 0) === 0) items.push({ label: t("noGoals"), severity: "warning" });
		return items;
	}, [process]);

	return (
		<div className="space-y-4">
			{/* Health Score */}
			<div className="rounded-lg border p-3">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium">Salud del Proceso</span>
					<span className={`text-lg font-bold tabular-nums ${health >= 75 ? "text-success" : health >= 50 ? "text-orientation" : "text-destructive"}`}>
						{health}%
					</span>
				</div>
				<div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={health} aria-valuemin={0} aria-valuemax={100} aria-label="Salud del proceso">
					<div
						className={`h-full rounded-full transition-all duration-500 ease-out ${health >= 75 ? "bg-success" : health >= 50 ? "bg-orientation" : "bg-destructive"}`}
						style={{ width: `${health}%` }}
					/>
				</div>
			</div>

			{/* Gaps */}
			{gaps.length > 0 && (
				<div className="space-y-1.5">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Pendientes
					</h4>
					{gaps.map((gap) => (
						<div key={gap.label} className="flex items-center gap-2 text-xs">
							{gap.severity === "error" ? (
								<AlertCircleIcon className="h-3.5 w-3.5 text-destructive shrink-0" />
							) : (
								<CircleIcon className="h-3.5 w-3.5 text-orientation shrink-0" />
							)}
							<span className="text-muted-foreground">{gap.label}</span>
						</div>
					))}
				</div>
			)}

			{/* Quick Stats */}
			<div className="space-y-1.5">
				<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Estadísticas
				</h4>
				<div className="grid grid-cols-2 gap-2">
					<StatCard icon={VideoIcon} label="Sesiones" value={process.sessionsCount} />
					<StatCard icon={GitBranchIcon} label="Versiones" value={process.versionsCount} />
					<StatCard icon={Table2Icon} label="RACI" value={process.raciCount} />
					<StatCard icon={ShieldAlertIcon} label="Riesgos" value={process.risksCount} />
				</div>
			</div>

			{/* Process Details */}
			{process.owner && (
				<div className="text-xs">
					<span className="text-muted-foreground">Responsable: </span>
					<span className="font-medium">{process.owner}</span>
				</div>
			)}
		</div>
	);
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
	return (
		<div className="flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors hover:bg-accent/30">
			<Icon className={`h-3.5 w-3.5 shrink-0 ${value > 0 ? "text-primary" : "text-muted-foreground/50"}`} />
			<div>
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className={`text-sm font-semibold tabular-nums ${value === 0 ? "text-muted-foreground/50" : ""}`}>{value}</p>
			</div>
		</div>
	);
}
