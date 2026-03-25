"use client";

import { useState, useCallback, useEffect } from "react";
import {
	SparklesIcon,
	RefreshCwIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClipboardListIcon,
	Loader2Icon,
	DownloadIcon,
} from "lucide-react";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import type { ProcedureResult } from "@repo/ai";

interface SopPanelProps {
	collapsed: boolean;
}

export function SopPanel({ collapsed }: SopPanelProps) {
	const { sessionId, selectedNodeId, nodes } = useLiveSessionContext();
	const [procedure, setProcedure] = useState<ProcedureResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [fetched, setFetched] = useState<string | null>(null);

	const node = nodes.find((n) => n.id === selectedNodeId);

	// Fetch existing procedure when node changes
	useEffect(() => {
		if (!selectedNodeId || fetched === selectedNodeId) return;
		setFetched(selectedNodeId);

		fetch(`/api/sessions/${sessionId}/nodes/${selectedNodeId}/procedure`)
			.then((r) => r.json())
			.then((data) => {
				if (data.procedure) setProcedure(data.procedure as ProcedureResult);
				else setProcedure(null);
			})
			.catch(() => setProcedure(null));
	}, [selectedNodeId, sessionId, fetched]);

	// Reset when node changes
	useEffect(() => {
		setProcedure(null);
		setFetched(null);
	}, [selectedNodeId]);

	const handleGenerate = useCallback(async () => {
		if (!selectedNodeId) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/nodes/${selectedNodeId}/procedure`, {
				method: "POST",
			});
			const data = await res.json();
			if (data.procedure) setProcedure(data.procedure as ProcedureResult);
		} catch (err) {
			console.error("[SopPanel] Generate failed:", err);
		} finally {
			setLoading(false);
		}
	}, [selectedNodeId, sessionId]);

	if (collapsed) return <div style={{ gridArea: "right" }} />;

	if (!selectedNodeId || !node) {
		return (
			<div
				className="flex flex-col items-center justify-center overflow-hidden border-l border-[#334155] bg-[#0F172A]"
				style={{ gridArea: "right" }}
			>
				<ClipboardListIcon className="mb-2 h-6 w-6 text-[#475569]" />
				<p className="px-4 text-center text-xs text-[#64748B]">
					Selecciona una tarea para ver o generar su procedimiento
				</p>
			</div>
		);
	}

	return (
		<div
			className="flex flex-col overflow-hidden border-l border-[#334155] bg-[#0F172A]"
			style={{ gridArea: "right" }}
		>
			{/* Header */}
			<div className="shrink-0 border-b border-[#334155] px-3 py-2.5">
				<div className="flex items-center gap-2">
					<ClipboardListIcon className="h-3.5 w-3.5 text-[#2563EB]" />
					<span className="text-xs font-medium text-[#F1F5F9]">Procedimiento</span>
				</div>
				<p className="mt-1 truncate text-[10px] text-[#64748B]">{node.label}</p>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{loading ? (
					<div className="flex flex-col items-center justify-center gap-3 p-8">
						<Loader2Icon className="h-6 w-6 animate-spin text-[#2563EB]" />
						<p className="text-xs text-[#94A3B8]">Generando procedimiento...</p>
						<p className="text-[10px] text-[#64748B]">Analizando transcript y contexto BPMN</p>
					</div>
				) : procedure ? (
					<ProcedureView procedure={procedure} />
				) : (
					<EmptyState onGenerate={handleGenerate} />
				)}
			</div>

			{/* Footer actions */}
			{procedure && !loading && (
				<div className="shrink-0 border-t border-[#334155] px-3 py-2">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleGenerate}
							className="flex items-center gap-1.5 rounded-md bg-[#1E293B] px-2.5 py-1.5 text-[10px] text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white"
						>
							<RefreshCwIcon className="h-3 w-3" />
							Regenerar
						</button>
						<ExportButton procedure={procedure} nodeName={node.label} />
					</div>
					{procedure.overallConfidence != null && (
						<div className="mt-2 flex items-center gap-2">
							<div className="h-1 flex-1 rounded-full bg-[#1E293B]">
								<div
									className="h-1 rounded-full transition-all"
									style={{
										width: `${Math.round(procedure.overallConfidence * 100)}%`,
										backgroundColor: procedure.overallConfidence > 0.7 ? "#22C55E" : procedure.overallConfidence > 0.4 ? "#EAB308" : "#EF4444",
									}}
								/>
							</div>
							<span className="text-[9px] tabular-nums text-[#64748B]">
								{Math.round(procedure.overallConfidence * 100)}%
							</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center gap-4 p-6">
			<div className="rounded-xl bg-[#1E293B] p-4">
				<SparklesIcon className="h-8 w-8 text-[#2563EB]" />
			</div>
			<div className="text-center">
				<p className="text-xs font-medium text-[#F1F5F9]">Sin procedimiento</p>
				<p className="mt-1 max-w-[200px] text-[10px] leading-relaxed text-[#64748B]">
					Genera un borrador del procedimiento usando la transcripcion y el contexto del diagrama
				</p>
			</div>
			<button
				type="button"
				onClick={onGenerate}
				className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8]"
			>
				<SparklesIcon className="h-3.5 w-3.5" />
				Generar con IA
			</button>
		</div>
	);
}

function ProcedureView({ procedure }: { procedure: ProcedureResult }) {
	return (
		<div className="space-y-0.5">
			{/* Objective */}
			<CollapsibleSection title="Objetivo" defaultOpen>
				<p className="text-[11px] leading-relaxed text-[#CBD5E1]">{procedure.objective}</p>
			</CollapsibleSection>

			{/* Scope */}
			<CollapsibleSection title="Alcance">
				<p className="text-[11px] leading-relaxed text-[#CBD5E1]">{procedure.scope}</p>
			</CollapsibleSection>

			{/* Responsible */}
			<CollapsibleSection title="Responsable">
				<p className="text-[11px] text-[#CBD5E1]">{procedure.responsible}</p>
				{procedure.frequency && (
					<p className="mt-1 text-[10px] text-[#64748B]">Frecuencia: {procedure.frequency}</p>
				)}
			</CollapsibleSection>

			{/* Prerequisites */}
			{procedure.prerequisites.length > 0 && (
				<CollapsibleSection title="Prerrequisitos">
					<ul className="space-y-1">
						{procedure.prerequisites.map((p, i) => (
							<li key={i} className="flex items-start gap-1.5 text-[11px] text-[#CBD5E1]">
								<CheckCircle2Icon className="mt-0.5 h-3 w-3 shrink-0 text-[#22C55E]" />
								{p}
							</li>
						))}
					</ul>
				</CollapsibleSection>
			)}

			{/* Steps */}
			<CollapsibleSection title={`Pasos (${procedure.steps.length})`} defaultOpen>
				<div className="space-y-3">
					{procedure.steps.map((step) => (
						<div key={step.stepNumber} className="rounded-lg bg-[#0F172A] p-2.5">
							<div className="flex items-start gap-2">
								<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/20 text-[9px] font-bold text-[#3B82F6]">
									{step.stepNumber}
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] font-medium text-[#F1F5F9]">{step.action}</p>
									<p className="mt-0.5 text-[10px] leading-relaxed text-[#94A3B8]">{step.description}</p>
									{step.responsible && (
										<span className="mt-1 inline-block rounded bg-[#1E293B] px-1.5 py-0.5 text-[9px] text-[#64748B]">
											{step.responsible}
										</span>
									)}
									{step.systems.length > 0 && (
										<div className="mt-1 flex flex-wrap gap-1">
											{step.systems.map((s) => (
												<span key={s} className="rounded bg-[#172554] px-1.5 py-0.5 text-[9px] text-[#3B82F6]">{s}</span>
											))}
										</div>
									)}
									{step.exceptions.length > 0 && (
										<div className="mt-1.5 space-y-1">
											{step.exceptions.map((ex, i) => (
												<div key={i} className="rounded bg-[#451A03]/30 px-2 py-1 text-[9px]">
													<span className="text-[#F59E0B]">Si: </span>
													<span className="text-[#FCD34D]">{ex.condition}</span>
													<span className="text-[#94A3B8]"> → {ex.action}</span>
												</div>
											))}
										</div>
									)}
									{step.estimatedTime && (
										<span className="mt-1 inline-block text-[9px] text-[#475569]">{step.estimatedTime}</span>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</CollapsibleSection>

			{/* KPIs */}
			{procedure.indicators.length > 0 && (
				<CollapsibleSection title="Indicadores">
					<div className="space-y-1.5">
						{procedure.indicators.map((ind, i) => (
							<div key={i} className="text-[11px]">
								<span className="font-medium text-[#CBD5E1]">{ind.name}</span>
								{ind.target && <span className="ml-1 text-[#64748B]">Meta: {ind.target}</span>}
							</div>
						))}
					</div>
				</CollapsibleSection>
			)}

			{/* Gaps */}
			{procedure.gaps.length > 0 && (
				<CollapsibleSection title={`Gaps (${procedure.gaps.length})`} defaultOpen>
					<div className="space-y-1">
						{procedure.gaps.map((gap, i) => (
							<div key={i} className="flex items-start gap-1.5 text-[11px]">
								<AlertTriangleIcon className="mt-0.5 h-3 w-3 shrink-0 text-[#EAB308]" />
								<span className="text-[#FCD34D]">{gap}</span>
							</div>
						))}
					</div>
				</CollapsibleSection>
			)}
		</div>
	);
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className="border-b border-[#1E293B]">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#1E293B]"
			>
				{open ? (
					<ChevronDownIcon className="h-3 w-3 text-[#64748B]" />
				) : (
					<ChevronRightIcon className="h-3 w-3 text-[#64748B]" />
				)}
				<span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">{title}</span>
			</button>
			{open && <div className="px-3 pb-3">{children}</div>}
		</div>
	);
}

function ExportButton({ procedure, nodeName }: { procedure: ProcedureResult; nodeName: string }) {
	const handleExport = useCallback(() => {
		// Generate a simple text export for now
		const lines: string[] = [];
		lines.push(`PROCEDIMIENTO: ${procedure.activityName}`);
		lines.push(`Codigo: ${procedure.procedureCode || "—"}`);
		lines.push(`Proceso: ${procedure.processName}`);
		lines.push("");
		lines.push(`OBJETIVO: ${procedure.objective}`);
		lines.push(`ALCANCE: ${procedure.scope}`);
		lines.push(`RESPONSABLE: ${procedure.responsible}`);
		if (procedure.frequency) lines.push(`FRECUENCIA: ${procedure.frequency}`);
		lines.push("");

		if (procedure.prerequisites.length > 0) {
			lines.push("PRERREQUISITOS:");
			procedure.prerequisites.forEach((p) => lines.push(`  - ${p}`));
			lines.push("");
		}

		lines.push("PASOS:");
		procedure.steps.forEach((step) => {
			lines.push(`  ${step.stepNumber}. ${step.action}`);
			lines.push(`     ${step.description}`);
			if (step.responsible) lines.push(`     Responsable: ${step.responsible}`);
			if (step.systems.length > 0) lines.push(`     Sistemas: ${step.systems.join(", ")}`);
			if (step.inputs.length > 0) lines.push(`     Entradas: ${step.inputs.join(", ")}`);
			if (step.outputs.length > 0) lines.push(`     Salidas: ${step.outputs.join(", ")}`);
			if (step.controls.length > 0) lines.push(`     Controles: ${step.controls.join(", ")}`);
			step.exceptions.forEach((ex) => {
				lines.push(`     Si ${ex.condition} → ${ex.action}`);
			});
			if (step.estimatedTime) lines.push(`     Tiempo: ${step.estimatedTime}`);
			lines.push("");
		});

		if (procedure.indicators.length > 0) {
			lines.push("INDICADORES:");
			procedure.indicators.forEach((ind) => {
				lines.push(`  - ${ind.name}${ind.target ? ` (Meta: ${ind.target})` : ""}`);
			});
			lines.push("");
		}

		if (procedure.gaps.length > 0) {
			lines.push("GAPS / INFORMACION PENDIENTE:");
			procedure.gaps.forEach((g) => lines.push(`  - ${g}`));
		}

		const blob = new Blob([lines.join("\n")], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `SOP-${nodeName.replace(/[^a-zA-Z0-9]/g, "-")}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}, [procedure, nodeName]);

	return (
		<button
			type="button"
			onClick={handleExport}
			className="flex items-center gap-1.5 rounded-md bg-[#1E293B] px-2.5 py-1.5 text-[10px] text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white"
		>
			<DownloadIcon className="h-3 w-3" />
			Exportar
		</button>
	);
}
