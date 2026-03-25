"use client";

import { useState, useCallback, useEffect } from "react";
import {
	SparklesIcon,
	RefreshCwIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	Loader2Icon,
	DownloadIcon,
	ChevronDownIcon,
	ChevronRightIcon,
} from "lucide-react";
import type { ProcedureResult } from "@repo/ai";

interface SopDocumentViewProps {
	nodeId: string;
	nodeLabel: string;
	sessionId: string;
	procedure: ProcedureResult | null;
}

export function SopDocumentView({ nodeId, nodeLabel, sessionId, procedure: initialProcedure }: SopDocumentViewProps) {
	const [procedure, setProcedure] = useState<ProcedureResult | null>(initialProcedure);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Sync with prop changes (e.g. live-data poll updates)
	useEffect(() => {
		if (initialProcedure) setProcedure(initialProcedure);
	}, [initialProcedure]);

	const handleGenerate = useCallback(async () => {
		setGenerating(true);
		setError(null);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/nodes/${nodeId}/procedure`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error al generar");
			if (data.procedure) setProcedure(data.procedure as ProcedureResult);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setGenerating(false);
		}
	}, [sessionId, nodeId]);

	const handleExport = useCallback(() => {
		if (!procedure) return;
		const lines: string[] = [];
		lines.push(`PROCEDIMIENTO: ${procedure.activityName}`);
		lines.push(`Codigo: ${procedure.procedureCode || "—"}`);
		lines.push(`Proceso: ${procedure.processName}`);
		lines.push(`Responsable: ${procedure.responsible}`);
		if (procedure.frequency) lines.push(`Frecuencia: ${procedure.frequency}`);
		lines.push("");
		lines.push(`OBJETIVO`);
		lines.push(procedure.objective);
		lines.push("");
		lines.push(`ALCANCE`);
		lines.push(procedure.scope);
		lines.push("");
		if (procedure.prerequisites.length > 0) {
			lines.push("PRERREQUISITOS");
			procedure.prerequisites.forEach((p) => lines.push(`  - ${p}`));
			lines.push("");
		}
		lines.push("PASOS");
		procedure.steps.forEach((step) => {
			lines.push(`${step.stepNumber}. ${step.action}`);
			lines.push(`   ${step.description}`);
			if (step.responsible) lines.push(`   Responsable: ${step.responsible}`);
			if (step.systems.length > 0) lines.push(`   Sistemas: ${step.systems.join(", ")}`);
			if (step.inputs.length > 0) lines.push(`   Entradas: ${step.inputs.join(", ")}`);
			if (step.outputs.length > 0) lines.push(`   Salidas: ${step.outputs.join(", ")}`);
			if (step.controls.length > 0) lines.push(`   Controles: ${step.controls.join(", ")}`);
			step.exceptions.forEach((ex) => lines.push(`   Si ${ex.condition} → ${ex.action}`));
			if (step.estimatedTime) lines.push(`   Tiempo: ${step.estimatedTime}`);
			lines.push("");
		});
		if (procedure.indicators.length > 0) {
			lines.push("INDICADORES");
			procedure.indicators.forEach((ind) => lines.push(`  - ${ind.name}${ind.target ? ` (Meta: ${ind.target})` : ""}`));
			lines.push("");
		}
		if (procedure.gaps.length > 0) {
			lines.push("INFORMACIÓN PENDIENTE");
			procedure.gaps.forEach((g) => lines.push(`  - ${g}`));
		}
		const blob = new Blob([lines.join("\n")], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `SOP-${nodeLabel.replace(/[^a-zA-Z0-9]/g, "-")}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}, [procedure, nodeLabel]);

	if (generating) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<Loader2Icon className="h-8 w-8 animate-spin text-[#2563EB]" />
				<p className="text-sm text-[#94A3B8]">Generando procedimiento...</p>
				<p className="text-xs text-[#CBD5E1]">Analizando transcript y contexto BPMN</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<AlertTriangleIcon className="h-8 w-8 text-[#EAB308]" />
				<p className="text-sm text-[#94A3B8]">{error}</p>
				<button onClick={handleGenerate} className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8]">
					<RefreshCwIcon className="h-3.5 w-3.5" /> Reintentar
				</button>
			</div>
		);
	}

	if (!procedure) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<div className="rounded-2xl bg-[#EFF6FF] p-5">
					<SparklesIcon className="h-10 w-10 text-[#2563EB]" />
				</div>
				<div className="text-center">
					<p className="text-sm font-medium text-[#0F172A]">Sin procedimiento</p>
					<p className="mt-1 max-w-sm text-xs text-[#64748B]">
						Genera un documento SOP completo usando la transcripcion de la sesion y el contexto del diagrama BPMN. Puedes refinarlo con el chat de IA.
					</p>
				</div>
				<button onClick={handleGenerate} className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1D4ED8]">
					<SparklesIcon className="h-4 w-4" /> Generar SOP con IA
				</button>
			</div>
		);
	}

	// Full document view
	return (
		<div className="mx-auto max-w-[720px] px-8 py-6">
			{/* Document header */}
			<div className="mb-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Procedimiento</p>
						<h2 className="mt-1 text-lg font-bold text-[#0F172A]">{procedure.activityName}</h2>
						<p className="mt-0.5 text-xs text-[#64748B]">{procedure.processName}</p>
					</div>
					<div className="flex items-center gap-2">
						<button onClick={handleGenerate} className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[11px] text-[#64748B] hover:bg-white hover:text-[#334155]">
							<RefreshCwIcon className="h-3 w-3" /> Regenerar
						</button>
						<button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#1D4ED8]">
							<DownloadIcon className="h-3 w-3" /> Exportar
						</button>
					</div>
				</div>
				{/* Metadata grid */}
				<div className="mt-4 grid grid-cols-3 gap-3">
					<MetaField label="Codigo" value={procedure.procedureCode || "—"} />
					<MetaField label="Responsable" value={procedure.responsible} />
					<MetaField label="Frecuencia" value={procedure.frequency || "—"} />
				</div>
				{/* Confidence bar */}
				{procedure.overallConfidence != null && (
					<div className="mt-3 flex items-center gap-2">
						<span className="text-[10px] text-[#94A3B8]">Confianza</span>
						<div className="h-1.5 flex-1 rounded-full bg-[#E2E8F0]">
							<div
								className="h-1.5 rounded-full transition-all"
								style={{
									width: `${Math.round(procedure.overallConfidence * 100)}%`,
									backgroundColor: procedure.overallConfidence > 0.7 ? "#16A34A" : procedure.overallConfidence > 0.4 ? "#EAB308" : "#EF4444",
								}}
							/>
						</div>
						<span className="text-[10px] font-medium tabular-nums text-[#64748B]">{Math.round(procedure.overallConfidence * 100)}%</span>
					</div>
				)}
			</div>

			{/* Objective */}
			<DocSection title="Objetivo">
				<p className="text-sm leading-relaxed text-[#334155]">{procedure.objective}</p>
			</DocSection>

			{/* Scope */}
			<DocSection title="Alcance">
				<p className="text-sm leading-relaxed text-[#334155]">{procedure.scope}</p>
			</DocSection>

			{/* Prerequisites */}
			{procedure.prerequisites.length > 0 && (
				<DocSection title="Prerrequisitos">
					<ul className="space-y-1.5">
						{procedure.prerequisites.map((p, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-[#334155]">
								<CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
								{p}
							</li>
						))}
					</ul>
				</DocSection>
			)}

			{/* Steps */}
			<DocSection title={`Pasos del Procedimiento (${procedure.steps.length})`}>
				<div className="space-y-4">
					{procedure.steps.map((step) => (
						<div key={step.stepNumber} className="rounded-xl border border-[#E2E8F0] bg-white p-4">
							<div className="flex items-start gap-3">
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white">
									{step.stepNumber}
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-[#0F172A]">{step.action}</p>
									<p className="mt-1 text-sm leading-relaxed text-[#64748B]">{step.description}</p>

									{/* Metadata row */}
									<div className="mt-2 flex flex-wrap items-center gap-2">
										{step.responsible && (
											<span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#475569]">
												{step.responsible}
											</span>
										)}
										{step.systems.map((s) => (
											<span key={s} className="rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-medium text-[#2563EB]">
												{s}
											</span>
										))}
										{step.estimatedTime && (
											<span className="text-[10px] text-[#94A3B8]">{step.estimatedTime}</span>
										)}
									</div>

									{/* I/O */}
									{(step.inputs.length > 0 || step.outputs.length > 0) && (
										<div className="mt-2 grid grid-cols-2 gap-2">
											{step.inputs.length > 0 && (
												<div className="rounded-lg bg-[#F8FAFC] p-2">
													<p className="text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">Entradas</p>
													{step.inputs.map((inp) => (
														<p key={inp} className="mt-0.5 text-[11px] text-[#475569]">{inp}</p>
													))}
												</div>
											)}
											{step.outputs.length > 0 && (
												<div className="rounded-lg bg-[#F0FDF4] p-2">
													<p className="text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">Salidas</p>
													{step.outputs.map((out) => (
														<p key={out} className="mt-0.5 text-[11px] text-[#475569]">{out}</p>
													))}
												</div>
											)}
										</div>
									)}

									{/* Controls */}
									{step.controls.length > 0 && (
										<div className="mt-2">
											{step.controls.map((c) => (
												<p key={c} className="flex items-start gap-1.5 text-[11px] text-[#475569]">
													<CheckCircle2Icon className="mt-0.5 h-3 w-3 shrink-0 text-[#16A34A]" />{c}
												</p>
											))}
										</div>
									)}

									{/* Exceptions */}
									{step.exceptions.length > 0 && (
										<div className="mt-2 space-y-1">
											{step.exceptions.map((ex, i) => (
												<div key={i} className="rounded-lg bg-[#FEF9C3] px-3 py-1.5 text-[11px]">
													<span className="font-medium text-[#92400E]">Si: </span>
													<span className="text-[#78350F]">{ex.condition}</span>
													<span className="text-[#92400E]"> → {ex.action}</span>
												</div>
											))}
										</div>
									)}

									{step.notes && (
										<p className="mt-2 text-[11px] italic text-[#94A3B8]">{step.notes}</p>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</DocSection>

			{/* KPIs */}
			{procedure.indicators.length > 0 && (
				<DocSection title="Indicadores">
					<div className="grid grid-cols-2 gap-3">
						{procedure.indicators.map((ind, i) => (
							<div key={i} className="rounded-lg border border-[#E2E8F0] p-3">
								<p className="text-xs font-medium text-[#0F172A]">{ind.name}</p>
								{ind.formula && <p className="mt-0.5 text-[11px] text-[#64748B]">{ind.formula}</p>}
								{ind.target && <p className="mt-1 text-[11px] font-medium text-[#2563EB]">Meta: {ind.target}</p>}
							</div>
						))}
					</div>
				</DocSection>
			)}

			{/* Gaps */}
			{procedure.gaps.length > 0 && (
				<DocSection title="Informacion Pendiente">
					<div className="space-y-2">
						{procedure.gaps.map((gap, i) => (
							<div key={i} className="flex items-start gap-2 rounded-lg bg-[#FEF9C3] px-3 py-2 text-sm">
								<AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" />
								<span className="text-[#78350F]">{gap}</span>
							</div>
						))}
					</div>
				</DocSection>
			)}

			{/* Definitions */}
			{procedure.definitions && procedure.definitions.length > 0 && (
				<DocSection title="Definiciones">
					<div className="space-y-1.5">
						{procedure.definitions.map((def, i) => (
							<p key={i} className="text-sm">
								<span className="font-medium text-[#0F172A]">{def.term}:</span>{" "}
								<span className="text-[#64748B]">{def.definition}</span>
							</p>
						))}
					</div>
				</DocSection>
			)}
		</div>
	);
}

function MetaField({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg bg-white px-3 py-2">
			<p className="text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">{label}</p>
			<p className="mt-0.5 text-xs font-medium text-[#334155]">{value}</p>
		</div>
	);
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-6">
			<h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
				{title}
				<div className="h-px flex-1 bg-[#E2E8F0]" />
			</h3>
			{children}
		</div>
	);
}
