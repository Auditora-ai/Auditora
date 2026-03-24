"use client";

import { useCallback, useMemo, useState } from "react";
import { SparklesIcon, ClipboardCopyIcon, PlusCircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import type { DiagramNode } from "../types";
import { useLiveSessionContext } from "../context/LiveSessionContext";

interface TeleprompterSectionProps {
	currentQuestion: string | null;
	questionQueue: string[];
	completenessScore: number | null;
	sipocCoverage: Record<string, number> | null;
	gapType: string | null;
	/** Hide the internal header (used when RightPanel provides accordion header) */
	compact?: boolean;
}

const SIPOC_DIMENSIONS = [
	{ key: "suppliers", label: "S", fullLabel: "Proveedores", color: "#3B82F6" },
	{ key: "inputs", label: "I", fullLabel: "Entradas", color: "#7C3AED" },
	{ key: "process", label: "P", fullLabel: "Proceso", color: "#16A34A" },
	{ key: "outputs", label: "O", fullLabel: "Salidas", color: "#EAB308" },
	{ key: "customers", label: "C", fullLabel: "Clientes", color: "#DC2626" },
];

interface SipocQuestion {
	dimension: string;
	question: string;
	color: string;
	/** Check if this question is resolved by analyzing current diagram nodes */
	isResolved: (nodes: DiagramNode[]) => boolean;
}

const DEFAULT_SIPOC_QUESTIONS: SipocQuestion[] = [
	{
		dimension: "S",
		question: "¿Quienes son los proveedores o areas que inician este proceso?",
		color: "#3B82F6",
		// Resolved when there are 2+ distinct lanes (roles/areas identified)
		isResolved: (nodes) => {
			const lanes = new Set(nodes.filter((n) => n.lane && n.state !== "rejected").map((n) => n.lane));
			return lanes.size >= 2;
		},
	},
	{
		dimension: "I",
		question: "¿Que informacion, documentos o materiales se necesitan para comenzar?",
		color: "#7C3AED",
		// Resolved when there's a start event with a descriptive label (not just "Inicio")
		isResolved: (nodes) => {
			return nodes.some((n) =>
				isStartType(n.type) && n.label.length > 6 && n.label.toLowerCase() !== "inicio"
			);
		},
	},
	{
		dimension: "P",
		question: "¿Cuales son los pasos principales del proceso de inicio a fin?",
		color: "#16A34A",
		// Resolved when there are 3+ task nodes
		isResolved: (nodes) => {
			return nodes.filter((n) => isTaskType(n.type) && n.state !== "rejected").length >= 3;
		},
	},
	{
		dimension: "O",
		question: "¿Que entregables o resultados produce este proceso?",
		color: "#EAB308",
		// Resolved when there's an end event with descriptive label
		isResolved: (nodes) => {
			return nodes.some((n) =>
				isEndType(n.type) && n.label.length > 3 && n.label.toLowerCase() !== "fin"
			);
		},
	},
	{
		dimension: "C",
		question: "¿Quienes son los clientes o areas que reciben el resultado?",
		color: "#DC2626",
		// Resolved when the last lane (end event lane) is identified and there are 2+ lanes
		isResolved: (nodes) => {
			const lanes = new Set(nodes.filter((n) => n.lane && n.state !== "rejected").map((n) => n.lane));
			const hasEndInLane = nodes.some((n) => isEndType(n.type) && n.lane);
			return lanes.size >= 2 && hasEndInLane;
		},
	},
	{
		dimension: "P",
		question: "¿Que decisiones se toman durante el proceso y quien las toma?",
		color: "#16A34A",
		// Resolved when there's at least 1 gateway
		isResolved: (nodes) => {
			return nodes.some((n) => isGatewayType(n.type) && n.state !== "rejected");
		},
	},
	{
		dimension: "P",
		question: "¿Que excepciones o caminos alternativos existen?",
		color: "#16A34A",
		// Resolved when there are 2+ gateways (multiple decision points = exception paths)
		isResolved: (nodes) => {
			return nodes.filter((n) => isGatewayType(n.type) && n.state !== "rejected").length >= 2;
		},
	},
	{
		dimension: "I",
		question: "¿Que sistemas o herramientas se utilizan?",
		color: "#7C3AED",
		// Resolved when there's a serviceTask or a lane that looks like a system
		isResolved: (nodes) => {
			const hasServiceTask = nodes.some((n) =>
				(n.type.toLowerCase().includes("service") || n.type.toLowerCase() === "servicetask") &&
				n.state !== "rejected"
			);
			const hasSystemLane = nodes.some((n) =>
				n.lane && /sistema|sap|erp|crm|app|plataforma|software/i.test(n.lane)
			);
			return hasServiceTask || hasSystemLane;
		},
	},
];

function isTaskType(type: string): boolean {
	const t = type.toLowerCase();
	return t === "task" || t === "usertask" || t === "user_task" ||
		t === "servicetask" || t === "service_task";
}
function isGatewayType(type: string): boolean {
	return type.toLowerCase().includes("gateway");
}
function isStartType(type: string): boolean {
	const t = type.toLowerCase();
	return t === "startevent" || t === "start_event";
}
function isEndType(type: string): boolean {
	const t = type.toLowerCase();
	return t === "endevent" || t === "end_event";
}

export function TeleprompterSection({
	currentQuestion,
	questionQueue,
	completenessScore,
	sipocCoverage,
	gapType,
	compact,
}: TeleprompterSectionProps) {
	const { sessionId, nodes } = useLiveSessionContext();
	const [addingToDiagram, setAddingToDiagram] = useState(false);
	const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
	const [expandedQ, setExpandedQ] = useState<number | null>(null);
	const [answerText, setAnswerText] = useState("");
	const [manuallyAnswered, setManuallyAnswered] = useState<Set<number>>(new Set());

	// Auto-detect which questions are resolved by analyzing the diagram
	const resolvedByDiagram = useMemo(() => {
		const resolved = new Set<number>();
		DEFAULT_SIPOC_QUESTIONS.forEach((q, i) => {
			if (q.isResolved(nodes)) {
				resolved.add(i);
			}
		});
		return resolved;
	}, [nodes]);

	// Combine: resolved by diagram OR manually answered
	const answeredQuestions = useMemo(() => {
		return new Set([...resolvedByDiagram, ...manuallyAnswered]);
	}, [resolvedByDiagram, manuallyAnswered]);

	const handleCopy = useCallback((text: string, idx?: number) => {
		navigator.clipboard.writeText(text);
		toast.success("Pregunta copiada al portapapeles");
		if (idx !== undefined) {
			setCopiedIdx(idx);
			setTimeout(() => setCopiedIdx(null), 2000);
		}
	}, []);

	const handleAddToDiagram = useCallback(async (text: string) => {
		if (!sessionId) return;
		setAddingToDiagram(true);
		try {
			// Route through transcript API so AI extraction interprets it
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: `Agregar al proceso: ${text}` }),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("IA procesando sugerencia...");
		} catch (err) {
			console.error("[TeleprompterSection] Add to diagram failed:", err);
			toast.error("Error al procesar sugerencia");
		} finally {
			setAddingToDiagram(false);
		}
	}, [sessionId]);

	const handleAnswer = useCallback(async (questionIdx: number) => {
		if (!sessionId || !answerText.trim()) return;
		const question = DEFAULT_SIPOC_QUESTIONS[questionIdx]?.question || "";
		const fullText = `[Pregunta: ${question}] Respuesta: ${answerText.trim()}`;
		try {
			// Send to transcript API — triggers AI extraction pipeline
			// The AI understands context and creates the right node types
			// (tasks, gateways, lanes, etc.) not just raw tasks
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: fullText }),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("IA procesando respuesta...");
			setAnswerText("");
			setExpandedQ(null);
			// Mark question as answered
			setManuallyAnswered((prev) => new Set([...prev, questionIdx]));
		} catch {
			toast.error("Error al enviar respuesta");
		}
	}, [sessionId, answerText]);

	// Merge server coverage with local answered questions for immediate feedback
	const localCoverage = useMemo(() => {
		const dimMap: Record<string, string> = { S: "suppliers", I: "inputs", P: "process", O: "outputs", C: "customers" };
		// Count answered questions per dimension
		const dimAnswered: Record<string, number> = {};
		const dimTotal: Record<string, number> = {};
		DEFAULT_SIPOC_QUESTIONS.forEach((q, i) => {
			const key = dimMap[q.dimension] || q.dimension;
			dimTotal[key] = (dimTotal[key] || 0) + 1;
			if (answeredQuestions.has(i)) {
				dimAnswered[key] = (dimAnswered[key] || 0) + 1;
			}
		});
		// Calculate local coverage percentage per dimension
		const local: Record<string, number> = {};
		for (const [key, total] of Object.entries(dimTotal)) {
			local[key] = Math.round(((dimAnswered[key] || 0) / total) * 100);
		}
		return local;
	}, [answeredQuestions]);

	// Use server data if available, otherwise use local tracking
	const coverage = useMemo(() => {
		const base = sipocCoverage || { suppliers: 0, inputs: 0, process: 0, outputs: 0, customers: 0 };
		// Take the max of server and local for each dimension
		const merged: Record<string, number> = {};
		for (const dim of SIPOC_DIMENSIONS) {
			merged[dim.key] = Math.max(base[dim.key] ?? 0, localCoverage[dim.key] ?? 0);
		}
		return merged;
	}, [sipocCoverage, localCoverage]);

	const hasAiSuggestions = !!currentQuestion;

	return (
		<div className="flex flex-col overflow-hidden">
			{/* Header — hidden in compact mode (RightPanel provides accordion header) */}
			{!compact && (
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
					{!gapType && (
						<span className="ml-auto rounded-full bg-[#334155] px-2 py-0.5 text-[10px] font-medium text-[#64748B]">
							SIPOC
						</span>
					)}
				</div>
			)}

			{/* SIPOC Coverage bars — always visible */}
			<div className="flex items-end gap-1 border-b border-[#334155]/50 px-3 py-2">
				{SIPOC_DIMENSIONS.map((dim) => {
					const pct = coverage[dim.key] ?? 0;
					return (
						<div key={dim.key} className="flex flex-1 flex-col items-center gap-1" title={`${dim.fullLabel}: ${pct}%`}>
							<div className="h-8 w-full overflow-hidden rounded bg-[#1E293B]">
								<div
									className="w-full rounded transition-all duration-500 ease-out"
									style={{
										height: `${Math.max(pct, 2)}%`,
										backgroundColor: pct > 0 ? dim.color : "#334155",
										marginTop: `${100 - Math.max(pct, 2)}%`,
									}}
								/>
							</div>
							<span className="text-[9px] font-medium" style={{ color: pct > 0 ? dim.color : "#64748B" }}>
								{dim.label}
							</span>
						</div>
					);
				})}
			</div>

			{/* Questions */}
			<div className="flex-1 overflow-y-auto p-3">
				{hasAiSuggestions ? (
					/* AI-generated questions from teleprompter pipeline */
					<div className="space-y-3">
						<div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
							<p className="text-sm font-medium leading-relaxed text-[#F1F5F9]">
								{currentQuestion}
							</p>
							<div className="mt-2.5 flex gap-2">
								<button
									type="button"
									onClick={() => handleCopy(currentQuestion!)}
									className="flex items-center gap-1 rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-[#1D4ED8]"
								>
									<ClipboardCopyIcon className="h-3 w-3" />
									Copiar pregunta
								</button>
								<button
									type="button"
									onClick={() => handleAddToDiagram(currentQuestion!)}
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
					/* Default SIPOC-based questions before AI kicks in */
					<div className="space-y-1.5">
						<p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
							{answeredQuestions.size > 0
								? `Preguntas SIPOC (${answeredQuestions.size}/${DEFAULT_SIPOC_QUESTIONS.length} respondidas)`
								: "Preguntas iniciales SIPOC"}
						</p>
						{DEFAULT_SIPOC_QUESTIONS.filter((_, i) => !answeredQuestions.has(i)).map((q, filteredIdx) => {
							const i = DEFAULT_SIPOC_QUESTIONS.indexOf(q);
							return (
							<div key={i}>
								<button
									type="button"
									onClick={() => {
										if (expandedQ === i) {
											setExpandedQ(null);
										} else {
											setExpandedQ(i);
											setAnswerText("");
										}
									}}
									className="group flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-[#1E293B]"
								>
									<span
										className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
										style={{ backgroundColor: q.color }}
									>
										{q.dimension}
									</span>
									<span className="text-[11px] leading-relaxed text-[#94A3B8] group-hover:text-[#E2E8F0]">
										{q.question}
									</span>
								</button>
								{expandedQ === i && (
									<div className="ml-6 mt-1 flex gap-1.5 pb-1">
										<input
											type="text"
											value={answerText}
											onChange={(e) => setAnswerText(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && handleAnswer(i)}
											placeholder="Escribe la respuesta..."
											autoFocus
											className="flex-1 rounded-lg bg-[#1E293B] px-2.5 py-1.5 text-[11px] text-[#F1F5F9] placeholder-[#64748B] outline-none ring-1 ring-[#334155] focus:ring-[#2563EB]"
										/>
										<button
											type="button"
											onClick={() => handleAnswer(i)}
											disabled={!answerText.trim()}
											className="rounded-lg bg-[#2563EB] px-2 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-40"
										>
											+
										</button>
									</div>
								)}
							</div>
						);
						})}
						{answeredQuestions.size > 0 && answeredQuestions.size === DEFAULT_SIPOC_QUESTIONS.length && (
							<p className="mt-3 text-center text-[10px] text-[#16A34A]">
								Todas las preguntas SIPOC respondidas. La IA generara preguntas contextuales.
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
