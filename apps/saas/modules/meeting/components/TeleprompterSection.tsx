"use client";

import { useCallback, useState } from "react";
import { SparklesIcon, ClipboardCopyIcon, PlusCircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useLiveSessionContext } from "../context/LiveSessionContext";

interface TeleprompterSectionProps {
	currentQuestion: string | null;
	questionQueue: string[];
	completenessScore: number | null;
	sipocCoverage: Record<string, number> | null;
	gapType: string | null;
}

const SIPOC_DIMENSIONS = [
	{ key: "suppliers", label: "S", color: "#3B82F6" },
	{ key: "inputs", label: "I", color: "#7C3AED" },
	{ key: "process", label: "P", color: "#16A34A" },
	{ key: "outputs", label: "O", color: "#EAB308" },
	{ key: "customers", label: "C", color: "#DC2626" },
];

export function TeleprompterSection({
	currentQuestion,
	questionQueue,
	completenessScore,
	sipocCoverage,
	gapType,
}: TeleprompterSectionProps) {
	const { sessionId } = useLiveSessionContext();
	const [addingToDiagram, setAddingToDiagram] = useState(false);

	const handleCopy = useCallback(() => {
		if (currentQuestion) {
			navigator.clipboard.writeText(currentQuestion);
			toast.success("Pregunta copiada al portapapeles");
		}
	}, [currentQuestion]);

	const handleAddToDiagram = useCallback(async () => {
		if (!currentQuestion || !sessionId) return;
		setAddingToDiagram(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/nodes/bulk`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nodes: [{ type: "task", label: currentQuestion, connections: [] }],
				}),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Nodo agregado al diagrama");
		} catch (err) {
			console.error("[TeleprompterSection] Add to diagram failed:", err);
			toast.error("Error al agregar nodo");
		} finally {
			setAddingToDiagram(false);
		}
	}, [currentQuestion, sessionId]);

	return (
		<div className="flex flex-col overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-[#334155] px-3 py-2">
				<SparklesIcon className="h-3.5 w-3.5 text-[#2563EB]" />
				<span className="text-xs font-medium text-[#94A3B8]">
					Sugerencias IA
				</span>
				{gapType && (
					<span className="ml-auto rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-medium text-[#3B82F6]">
						{gapType}
					</span>
				)}
			</div>

			{/* SIPOC Coverage bars */}
			{sipocCoverage && (
				<div className="flex items-end gap-1 border-b border-[#334155]/50 px-3 py-2">
					{SIPOC_DIMENSIONS.map((dim) => {
						const pct = sipocCoverage[dim.key] ?? 0;
						return (
							<div key={dim.key} className="flex flex-1 flex-col items-center gap-1">
								<div className="h-8 w-full overflow-hidden rounded bg-[#1E293B]">
									<div
										className="w-full rounded transition-all duration-500 ease-out"
										style={{
											height: `${pct}%`,
											backgroundColor: dim.color,
											marginTop: `${100 - pct}%`,
										}}
									/>
								</div>
								<span className="text-[9px] font-medium text-[#64748B]">
									{dim.label}
								</span>
							</div>
						);
					})}
				</div>
			)}

			{/* Current question */}
			<div className="flex-1 overflow-y-auto p-3">
				{currentQuestion ? (
					<div className="space-y-3">
						{/* Main question card */}
						<div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
							<p className="text-sm font-medium leading-relaxed text-[#F1F5F9]">
								{currentQuestion}
							</p>
							<div className="mt-2.5 flex gap-2">
								<button
									type="button"
									onClick={handleCopy}
									className="flex items-center gap-1 rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-[#1D4ED8]"
								>
									<ClipboardCopyIcon className="h-3 w-3" />
									Copiar pregunta
								</button>
								<button
									type="button"
									onClick={handleAddToDiagram}
									disabled={addingToDiagram}
									className="flex items-center gap-1 rounded-lg bg-[#1E293B] px-2.5 py-1.5 text-[10px] font-medium text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white disabled:opacity-50"
								>
									{addingToDiagram ? (
										<Loader2Icon className="h-3 w-3 animate-spin" />
									) : (
										<PlusCircleIcon className="h-3 w-3" />
									)}
									Agregar al diagrama
								</button>
							</div>
						</div>

						{/* Past questions (reduced opacity) */}
						{questionQueue.slice(0, 3).map((q, i) => (
							<div
								key={`q-${i}`}
								className="rounded-lg bg-white/5 p-2.5"
								style={{ opacity: 0.6 - i * 0.15 }}
							>
								<p className="text-xs leading-relaxed text-[#94A3B8]">{q}</p>
							</div>
						))}
					</div>
				) : (
					<div className="flex h-full items-center justify-center">
						<p className="text-center text-xs text-[#64748B]">
							Las sugerencias apareceran conforme avance la conversacion
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
