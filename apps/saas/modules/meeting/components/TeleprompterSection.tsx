"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SparklesIcon, TelescopeIcon, MicroscopeIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import type { DiagramNode } from "../types";
import { useLiveSessionContext } from "../context/LiveSessionContext";

const GAP_LABELS: Record<string, string> = {
	missing_role: "Roles",
	missing_supplier: "Proveedores",
	missing_input: "Entradas",
	missing_output: "Salidas",
	missing_customer: "Clientes",
	missing_trigger: "Disparadores",
	missing_decision: "Decisiones",
	missing_exception: "Excepciones",
	missing_sla: "Tiempos",
	missing_system: "Sistemas",
	general_exploration: "Exploración",
};

const QUESTION_MODES = [
	{ key: "explore", label: "Explorar", icon: TelescopeIcon, hint: "Cubrir todas las dimensiones SIPOC" },
	{ key: "deepen", label: "Profundizar", icon: MicroscopeIcon, hint: "Detallar la dimensión más débil" },
	{ key: "validate", label: "Validar", icon: ShieldCheckIcon, hint: "Revisar cada nodo, sellar gaps" },
] as const;

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

	const [answeredAiQuestions, setAnsweredAiQuestions] = useState<Set<string>>(new Set());

	const [sending, setSending] = useState(false);

	const handleAnswerAiQuestion = useCallback(async (question?: string) => {
		if (!sessionId || !answerText.trim() || sending) return;
		const q = question || currentQuestion || "";
		const fullText = `[Pregunta: ${q}] Respuesta: ${answerText.trim()}`;

		// Immediate feedback — clear input and collapse BEFORE API call
		const savedText = answerText.trim();
		setAnswerText("");
		setExpandedQ(null);
		setAnsweredAiQuestions((prev) => new Set([...prev, q]));
		setSending(true);

		try {
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: fullText }),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
		} catch {
			toast.error("Error al enviar respuesta");
		} finally {
			setSending(false);
		}
	}, [sessionId, answerText, currentQuestion, sending]);

	const handleAnswer = useCallback(async (questionIdx: number) => {
		if (!sessionId || !answerText.trim() || sending) return;
		const question = DEFAULT_SIPOC_QUESTIONS[questionIdx]?.question || "";
		const fullText = `[Pregunta: ${question}] Respuesta: ${answerText.trim()}`;

		// Immediate feedback — clear input and collapse BEFORE API call
		setAnswerText("");
		setExpandedQ(null);
		setManuallyAnswered((prev) => new Set([...prev, questionIdx]));
		setSending(true);

		try {
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: fullText }),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
		} catch {
			toast.error("Error al enviar respuesta");
		} finally {
			setSending(false);
		}
	}, [sessionId, answerText, sending]);

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

	// Server data takes priority (from AI analysis), local only as fallback
	const coverage = useMemo(() => {
		if (sipocCoverage) {
			// Server has real analysis — use it directly
			const merged: Record<string, number> = {};
			for (const dim of SIPOC_DIMENSIONS) {
				merged[dim.key] = sipocCoverage[dim.key] ?? 0;
			}
			return merged;
		}
		// No server data — use local tracking from answered questions
		return localCoverage;
	}, [sipocCoverage, localCoverage]);

	const hasAiSuggestions = !!currentQuestion;

	return (
		<div className="flex h-full flex-col overflow-hidden">
			{/* Header — hidden in compact mode (RightPanel provides accordion header) */}
			{!compact && (
				<div className="flex items-center gap-2 border-b border-[#334155] px-3 py-2">
					<SparklesIcon className="h-3.5 w-3.5 text-[#2563EB]" />
					<span className="text-xs font-medium text-[#94A3B8]">
						Sugerencias IA
					</span>
					{gapType && (
						<span className="ml-auto rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-medium text-[#3B82F6]">
							{GAP_LABELS[gapType] || gapType}
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

			{/* Mode pills */}
			<QuestionModePills />

			{/* Questions */}
			<div className="flex-1 overflow-y-auto p-3">
				{hasAiSuggestions ? (
					/* AI-generated questions — same interactive pattern as SIPOC */
					<div className="space-y-1.5">
						<p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
							Preguntas del proceso
						</p>
						{/* All questions (current + past), filter answered */}
						{[currentQuestion, ...questionQueue]
							.filter((q): q is string => !!q && !answeredAiQuestions.has(q))
							.map((q, i) => {
								const gapToSipoc: Record<string, string> = {
									missing_role: "S", missing_supplier: "S",
									missing_input: "I", missing_trigger: "I",
									missing_decision: "P", missing_exception: "P", missing_sla: "P", missing_system: "P",
									missing_output: "O",
									missing_customer: "C",
									general_exploration: "P",
								};
								const dimLabel = gapType ? (gapToSipoc[gapType] || "P") : "P";
								const dimColor = SIPOC_DIMENSIONS.find((d) => d.label === dimLabel)?.color || "#2563EB";
								return (
									<div key={`ai-${i}`}>
										<button
											type="button"
											onClick={() => {
												if (expandedQ === 200 + i) { setExpandedQ(null); }
												else { setExpandedQ(200 + i); setAnswerText(""); }
											}}
											className="group flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-[#1E293B]"
										>
											<span
												className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
												style={{ backgroundColor: dimColor }}
											>
												{dimLabel}
											</span>
											<span className="text-[11px] leading-relaxed text-[#E2E8F0]">{q}</span>
										</button>
										{expandedQ === 200 + i && (
											<div className="ml-6 mt-1 flex gap-1.5 pb-1">
												<input
													type="text"
													value={answerText}
													onChange={(e) => setAnswerText(e.target.value)}
													onKeyDown={(e) => e.key === "Enter" && handleAnswerAiQuestion(q)}
													placeholder="Escribe la respuesta..."
													autoFocus
													className="flex-1 rounded-lg bg-[#1E293B] px-2.5 py-1.5 text-[11px] text-[#F1F5F9] placeholder-[#64748B] outline-none ring-1 ring-[#334155] focus:ring-[#2563EB]"
												/>
												<button type="button" onClick={() => handleAnswerAiQuestion(q)} disabled={!answerText.trim()} className="rounded-lg bg-[#2563EB] px-2 py-1.5 text-[10px] font-medium text-white disabled:opacity-40">+</button>
											</div>
										)}
									</div>
								);
							})}
						{answeredAiQuestions.size > 0 && (
							<p className="mt-2 text-center text-[10px] text-[#64748B]">
								{answeredAiQuestions.size} pregunta{answeredAiQuestions.size > 1 ? "s" : ""} respondida{answeredAiQuestions.size > 1 ? "s" : ""}
							</p>
						)}
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

function QuestionModePills() {
	const { sessionId, questionMode: contextMode } = useLiveSessionContext() as any;
	const [mode, setMode] = useState<string>(contextMode || "explore");
	// Sync with context when it loads from DB
	useEffect(() => {
		if (contextMode && contextMode !== mode) setMode(contextMode);
	}, [contextMode]);
	const [saving, setSaving] = useState(false);

	const handleChange = useCallback(async (newMode: string) => {
		if (newMode === mode || saving) return;
		setMode(newMode);
		setSaving(true);
		const label = QUESTION_MODES.find((m) => m.key === newMode)?.label || newMode;
		toast.loading(`Cambiando a ${label}...`, { id: "mode-change" });
		try {
			// Save mode
			await fetch(`/api/sessions/${sessionId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ questionMode: newMode }),
			});
			// Regenerate questions with new mode
			await fetch(`/api/sessions/${sessionId}/regenerate-questions`, { method: "POST" });
			toast.success(`Modo: ${label} — preguntas regeneradas`, { id: "mode-change", duration: 3000 });
		} catch {
			toast.error("Error al cambiar modo", { id: "mode-change" });
		}
		finally { setSaving(false); }
	}, [sessionId, mode, saving]);

	return (
		<div className="flex items-center gap-1 border-b border-[#334155]/50 px-3 py-1.5">
			{QUESTION_MODES.map((m) => {
				const Icon = m.icon;
				const active = mode === m.key;
				return (
					<button
						key={m.key}
						type="button"
						onClick={() => handleChange(m.key)}
						title={m.hint}
						className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[10px] font-medium transition-colors ${
							active
								? "bg-[#2563EB]/15 text-[#3B82F6]"
								: "text-[#64748B] hover:bg-[#1E293B] hover:text-[#94A3B8]"
						}`}
					>
						<Icon className="h-3 w-3" />
						{m.label}
					</button>
				);
			})}
		</div>
	);
}
