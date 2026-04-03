"use client";

import { cn } from "@repo/ui";
import {
	CheckCircle2Icon,
	AlertTriangleIcon,
	ShieldAlertIcon,
	ClockIcon,
	UserIcon,
	RepeatIcon,
} from "lucide-react";

interface ProcedureStep {
	stepNumber?: number;
	action: string;
	responsible?: string;
	description?: string;
	inputs?: string[];
	outputs?: string[];
	systems?: string[];
	controls?: string[];
	exceptions?: { condition: string; action: string }[];
	estimatedTime?: string;
	notes?: string;
}

interface LinkedRisk {
	id: string;
	title: string;
	riskType: string;
	riskScore: number;
}

interface ProcedurePreviewProps {
	title: string;
	version: number;
	status: string;
	objective: string | null;
	scope: string | null;
	responsible: string | null;
	frequency: string | null;
	prerequisites: string[];
	steps: ProcedureStep[];
	indicators: any[];
	controlPointsSummary: string | null;
	linkedRisks: LinkedRisk[];
	processName: string;
}

const frequencyLabels: Record<string, string> = {
	daily: "Diario",
	weekly: "Semanal",
	monthly: "Mensual",
	per_event: "Por evento",
};

const riskTypeLabels: Record<string, string> = {
	OPERATIONAL: "Operacional",
	COMPLIANCE: "Cumplimiento",
	STRATEGIC: "Estratégico",
	FINANCIAL: "Financiero",
	TECHNOLOGY: "Tecnología",
	HUMAN_RESOURCE: "RRHH",
	REPUTATIONAL: "Reputacional",
};

export function ProcedurePreview({
	title,
	version,
	status,
	objective,
	scope,
	responsible,
	frequency,
	prerequisites,
	steps,
	indicators,
	controlPointsSummary,
	linkedRisks,
	processName,
}: ProcedurePreviewProps) {
	const hasContent = objective || scope || steps.length > 0;

	if (!hasContent) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30">
					<AlertTriangleIcon className="h-6 w-6 text-muted-foreground/40" />
				</div>
				<p className="text-sm text-muted-foreground">Sin contenido aún</p>
				<p className="text-xs text-muted-foreground/60 max-w-[280px]">
					Usa el editor o genera el contenido con IA para ver la vista previa del documento.
				</p>
			</div>
		);
	}

	let sectionNum = 0;
	const nextSection = () => ++sectionNum;

	return (
		<div className="procedure-preview mx-auto max-w-[640px] px-8 py-8">
			{/* Document header */}
			<div className="mb-8 border-b-2 border-foreground/10 pb-6">
				<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					Procedimiento Operativo
				</p>
				<h1 className="mt-2 font-display text-2xl font-bold leading-tight text-foreground">
					{title}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">{processName}</p>

				{/* Meta grid */}
				<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
					{responsible && (
						<MetaField icon={<UserIcon className="h-3 w-3" />} label="Responsable" value={responsible} />
					)}
					{frequency && (
						<MetaField icon={<RepeatIcon className="h-3 w-3" />} label="Frecuencia" value={frequencyLabels[frequency] || frequency} />
					)}
					<MetaField icon={<ClockIcon className="h-3 w-3" />} label="Versión" value={`v${version}`} />
				</div>
			</div>

			{/* Sections */}
			{objective && (
				<DocSection num={nextSection()} title="Objetivo">
					<p className="text-sm leading-relaxed text-foreground/80">{objective}</p>
				</DocSection>
			)}

			{scope && (
				<DocSection num={nextSection()} title="Alcance">
					<p className="text-sm leading-relaxed text-foreground/80">{scope}</p>
				</DocSection>
			)}

			{prerequisites.length > 0 && (
				<DocSection num={nextSection()} title="Prerrequisitos">
					<ul className="space-y-1.5">
						{prerequisites.map((p, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
								<CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
								{p}
							</li>
						))}
					</ul>
				</DocSection>
			)}

			{steps.length > 0 && (
				<DocSection num={nextSection()} title={`Pasos del Procedimiento (${steps.length})`}>
					<div className="space-y-4">
						{steps.map((step, idx) => (
							<div key={idx} className="rounded-xl border border-border/40 bg-background p-4">
								<div className="flex items-start gap-3">
									<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
										{step.stepNumber || idx + 1}
									</span>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-semibold text-foreground">{step.action}</p>
										{step.description && (
											<p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
										)}

										{/* Metadata badges */}
										<div className="mt-2 flex flex-wrap gap-1.5">
											{step.responsible && (
												<Badge color="blue">{step.responsible}</Badge>
											)}
											{step.systems?.map((s) => (
												<Badge key={s} color="teal">{s}</Badge>
											))}
											{step.estimatedTime && (
												<Badge color="slate">{step.estimatedTime}</Badge>
											)}
										</div>

										{/* I/O */}
										{((step.inputs?.length || 0) > 0 || (step.outputs?.length || 0) > 0) && (
											<div className="mt-2.5 grid grid-cols-2 gap-2">
												{(step.inputs?.length || 0) > 0 && (
													<div className="rounded-lg bg-muted/30 p-2">
														<p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Entradas</p>
														{step.inputs!.map((inp) => (
															<p key={inp} className="mt-0.5 text-[11px] text-foreground/70">{inp}</p>
														))}
													</div>
												)}
												{(step.outputs?.length || 0) > 0 && (
													<div className="rounded-lg bg-emerald-500/5 p-2">
														<p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Salidas</p>
														{step.outputs!.map((out) => (
															<p key={out} className="mt-0.5 text-[11px] text-foreground/70">{out}</p>
														))}
													</div>
												)}
											</div>
										)}

										{/* Controls */}
										{(step.controls?.length || 0) > 0 && (
											<div className="mt-2">
												{step.controls!.map((c) => (
													<p key={c} className="flex items-start gap-1.5 text-[11px] text-foreground/70">
														<CheckCircle2Icon className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />{c}
													</p>
												))}
											</div>
										)}

										{/* Exceptions */}
										{(step.exceptions?.length || 0) > 0 && (
											<div className="mt-2 space-y-1">
												{step.exceptions!.map((ex, i) => (
													<div key={i} className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-[11px]">
														<span className="font-medium text-amber-600">Si </span>
														<span className="text-amber-700">{ex.condition}</span>
														<span className="text-amber-600"> → {ex.action}</span>
													</div>
												))}
											</div>
										)}

										{step.notes && (
											<p className="mt-2 text-[11px] italic text-muted-foreground">{step.notes}</p>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</DocSection>
			)}

			{indicators.length > 0 && (
			<DocSection num={nextSection()} title="Indicadores de Desempeño">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{indicators.map((ind: any, i: number) => (
							<div key={i} className="rounded-lg border border-border/40 p-3">
								<p className="text-xs font-medium text-foreground">{typeof ind === "string" ? ind : ind.name}</p>
								{ind.formula && <p className="mt-0.5 text-[11px] text-muted-foreground">{ind.formula}</p>}
								{ind.target && <p className="mt-1 text-[11px] font-medium text-primary">Meta: {ind.target}</p>}
							</div>
						))}
					</div>
				</DocSection>
			)}

			{controlPointsSummary && (
				<DocSection num={nextSection()} title="Resumen de Puntos de Control">
					<p className="text-sm leading-relaxed text-foreground/80">{controlPointsSummary}</p>
				</DocSection>
			)}

			{linkedRisks.length > 0 && (
				<DocSection num={nextSection()} title={`Riesgos Vinculados (${linkedRisks.length})`}>
					<div className="space-y-2">
						{linkedRisks.map((risk) => (
							<div key={risk.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
								<div>
									<p className="text-xs font-medium text-foreground">{risk.title}</p>
									<span className="text-[10px] text-muted-foreground">{riskTypeLabels[risk.riskType] || risk.riskType}</span>
								</div>
								<span className={cn(
									"rounded-full px-2 py-0.5 text-[10px] font-bold",
									risk.riskScore >= 20 ? "bg-red-500/15 text-red-400" :
									risk.riskScore >= 12 ? "bg-amber-500/15 text-amber-400" :
									"bg-emerald-500/15 text-emerald-400",
								)}>
									{risk.riskScore}
								</span>
							</div>
						))}
					</div>
				</DocSection>
			)}

			{/* Document styling */}
			<style>{`
				.procedure-preview h1 { font-family: var(--font-display, 'Instrument Serif', serif); }
			`}</style>
		</div>
	);
}

function DocSection({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
	return (
		<div className="mb-7">
			<h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
				<span className="flex h-5 w-5 items-center justify-center rounded bg-muted/50 text-[10px] font-bold">
					{num}
				</span>
				{title}
				<div className="h-px flex-1 bg-border/30" />
			</h3>
			{children}
		</div>
	);
}

function MetaField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2">
			<span className="text-muted-foreground">{icon}</span>
			<div>
				<p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
				<p className="text-xs font-medium text-foreground/80">{value}</p>
			</div>
		</div>
	);
}

function Badge({ children, color }: { children: React.ReactNode; color: "blue" | "teal" | "slate" }) {
	const styles = {
		blue: "bg-blue-500/10 text-blue-400",
		teal: "bg-primary/10 text-primary",
		slate: "bg-muted/50 text-muted-foreground",
	};
	return (
		<span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", styles[color])}>
			{children}
		</span>
	);
}
