"use client";

import { usePanelFlash } from "../hooks/usePanelFlash";

interface SipocCoverage {
	suppliers: number;
	inputs: number;
	process: number;
	outputs: number;
	customers: number;
}

interface TeleprompterPanelProps {
	currentQuestion: string;
	questionQueue: string[];
	aiSuggestion: string | null;
	sessionType: "DISCOVERY" | "DEEP_DIVE";
	isFlashing?: boolean;
	completenessScore?: number;
	gapType?: string;
	sipocCoverage?: SipocCoverage;
}

const GAP_TYPE_LABELS: Record<string, string> = {
	missing_role: "Rol faltante",
	missing_exception: "Excepción faltante",
	missing_decision: "Decisión faltante",
	missing_trigger: "Disparador faltante",
	missing_sla: "SLA faltante",
	missing_system: "Sistema faltante",
	missing_output: "Salida faltante",
	missing_input: "Entrada faltante",
	missing_supplier: "Proveedor faltante",
	missing_customer: "Cliente faltante",
	general_exploration: "Exploración general",
};

const SIPOC_LABELS = [
	{ key: "suppliers" as const, label: "S" },
	{ key: "inputs" as const, label: "I" },
	{ key: "process" as const, label: "P" },
	{ key: "outputs" as const, label: "O" },
	{ key: "customers" as const, label: "C" },
];

export function TeleprompterPanel({
	currentQuestion,
	questionQueue,
	aiSuggestion,
	sessionType,
	isFlashing = false,
	completenessScore,
	gapType,
	sipocCoverage,
}: TeleprompterPanelProps) {
	const flashStyle = usePanelFlash(isFlashing, {
		color: "rgba(14, 165, 233, 0.4)",
	});

	return (
		<div className="flex h-full flex-col" style={flashStyle}>
			{/* Panel header */}
			<div className="border-b border-border px-4 py-3">
				<span className="text-xs font-medium uppercase tracking-wider text-[#F1F5F9]">
					Preguntas
				</span>
				<span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
					{sessionType === "DISCOVERY" ? "Discovery" : "Deep Dive"}
				</span>
			</div>

			{/* Completeness bar */}
			{completenessScore !== undefined && (
				<div className="px-4 py-2">
					<div className="mb-1 flex items-center justify-between">
						<span className="text-[9px] text-[#94A3B8]">Completitud</span>
						<span className="text-[9px] text-[#94A3B8]">{completenessScore}%</span>
					</div>
					<div className="h-1 w-full rounded-full bg-[#1E293B]">
						<div
							className="h-1 rounded-full bg-[#3B82F6] transition-all duration-500"
							style={{ width: `${Math.min(100, Math.max(0, completenessScore))}%` }}
						/>
					</div>

					{/* SIPOC mini bars */}
					{sipocCoverage && (
						<div className="mt-1.5 flex items-center gap-1.5">
							{SIPOC_LABELS.map(({ key, label }) => (
								<div key={key} className="flex flex-1 flex-col items-center gap-0.5">
									<span className="text-[8px] text-[#94A3B8]">{label}</span>
									<div className="h-0.5 w-full rounded-full bg-[#1E293B]">
										<div
											className="h-0.5 rounded-full bg-[#3B82F6] transition-all duration-500"
											style={{ width: `${Math.min(100, Math.max(0, sipocCoverage[key]))}%` }}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Current question — large, prominent */}
			<div className="border-b border-[#3B82F6] bg-[#1E3A5F] px-4 py-4">
				<div className="mb-1.5 flex items-center gap-2">
					<span className="text-xs font-semibold uppercase tracking-widest text-[#60A5FA]">
						PREGUNTAR AHORA
					</span>
					{gapType && gapType !== "general_exploration" && (
						<span className="rounded-full bg-[#7C3AED33] px-2 py-0.5 text-[10px] font-medium text-[#A78BFA]">
							{GAP_TYPE_LABELS[gapType] || gapType}
						</span>
					)}
				</div>
				<p className="text-xl leading-relaxed text-foreground">
					{currentQuestion}
				</p>
			</div>

			{/* Question queue */}
			<div className="flex-1 overflow-y-auto">
				{questionQueue.map((question, index) => (
					<div
						key={index}
						className="border-b border-border/50 px-4 py-3"
					>
						<span className="mr-2 text-xs font-semibold text-muted-foreground">
							{index + 1}.
						</span>
						<span className="text-sm leading-relaxed text-[#CBD5E1]">
							{question}
						</span>
					</div>
				))}
				{questionQueue.length === 0 && (
					<div className="px-4 py-8 text-center">
						<p className="text-sm text-muted-foreground">
							Comienza a hablar para activar las preguntas guiadas
						</p>
					</div>
				)}
			</div>

			{/* AI suggestion */}
			{aiSuggestion && (
				<div className="border-t border-border bg-accent px-4 py-3">
					<div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Sugerencia IA
					</div>
					<p className="text-xs leading-relaxed text-foreground/70">
						{aiSuggestion}
					</p>
				</div>
			)}
		</div>
	);
}
