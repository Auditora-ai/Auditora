"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SparklesIcon, TelescopeIcon, MicroscopeIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import type { DiagramNode } from "@repo/process-engine";
import { useLiveSessionContext } from "../context/LiveSessionContext";

const GAP_LABEL_KEYS: Record<string, string> = {
	missing_role: "teleprompter.gapRoles",
	missing_supplier: "teleprompter.gapSuppliers",
	missing_input: "teleprompter.gapInputs",
	missing_output: "teleprompter.gapOutputs",
	missing_customer: "teleprompter.gapCustomers",
	missing_trigger: "teleprompter.gapTriggers",
	missing_decision: "teleprompter.gapDecisions",
	missing_exception: "teleprompter.gapExceptions",
	missing_sla: "teleprompter.gapTimelines",
	missing_system: "teleprompter.gapSystems",
	general_exploration: "teleprompter.gapExploration",
};

const QUESTION_MODES = [
	{ key: "explore", labelKey: "teleprompter.modeExplore", icon: TelescopeIcon, hintKey: "teleprompter.modeExploreHint" },
	{ key: "deepen", labelKey: "teleprompter.modeDeepen", icon: MicroscopeIcon, hintKey: "teleprompter.modeDeepenHint" },
	{ key: "validate", labelKey: "teleprompter.modeValidate", icon: ShieldCheckIcon, hintKey: "teleprompter.modeValidateHint" },
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
	{ key: "suppliers", label: "S", fullLabelKey: "teleprompter.sipocSuppliers", color: "#3B82F6" },
	{ key: "inputs", label: "I", fullLabelKey: "teleprompter.sipocInputs", color: "#7C3AED" },
	{ key: "process", label: "P", fullLabelKey: "teleprompter.sipocProcess", color: "#16A34A" },
	{ key: "outputs", label: "O", fullLabelKey: "teleprompter.sipocOutputs", color: "#EAB308" },
	{ key: "customers", label: "C", fullLabelKey: "teleprompter.sipocCustomers", color: "#DC2626" },
];

interface SipocQuestion {
	dimension: string;
	questionKey: string;
	color: string;
	/** Check if this question is resolved by analyzing current diagram nodes */
	isResolved: (nodes: DiagramNode[]) => boolean;
}

const DEFAULT_SIPOC_QUESTIONS: SipocQuestion[] = [
	{
		dimension: "S",
		questionKey: "teleprompter.q1",
		color: "#3B82F6",
		isResolved: (nodes) => {
			const lanes = new Set(nodes.filter((n) => n.lane && n.state !== "rejected").map((n) => n.lane));
			return lanes.size >= 2;
		},
	},
	{
		dimension: "I",
		questionKey: "teleprompter.q2",
		color: "#7C3AED",
		isResolved: (nodes) => {
			return nodes.some((n) =>
				isStartType(n.type) && n.label.length > 6 && n.label.toLowerCase() !== "inicio"
			);
		},
	},
	{
		dimension: "P",
		questionKey: "teleprompter.q3",
		color: "#16A34A",
		isResolved: (nodes) => {
			return nodes.filter((n) => isTaskType(n.type) && n.state !== "rejected").length >= 3;
		},
	},
	{
		dimension: "O",
		questionKey: "teleprompter.q4",
		color: "#EAB308",
		isResolved: (nodes) => {
			return nodes.some((n) =>
				isEndType(n.type) && n.label.length > 3 && n.label.toLowerCase() !== "fin"
			);
		},
	},
	{
		dimension: "C",
		questionKey: "teleprompter.q5",
		color: "#DC2626",
		isResolved: (nodes) => {
			const lanes = new Set(nodes.filter((n) => n.lane && n.state !== "rejected").map((n) => n.lane));
			const hasEndInLane = nodes.some((n) => isEndType(n.type) && n.lane);
			return lanes.size >= 2 && hasEndInLane;
		},
	},
	{
		dimension: "P",
		questionKey: "teleprompter.q6",
		color: "#16A34A",
		isResolved: (nodes) => {
			return nodes.some((n) => isGatewayType(n.type) && n.state !== "rejected");
		},
	},
	{
		dimension: "P",
		questionKey: "teleprompter.q7",
		color: "#16A34A",
		isResolved: (nodes) => {
			return nodes.filter((n) => isGatewayType(n.type) && n.state !== "rejected").length >= 2;
		},
	},
	{
		dimension: "I",
		questionKey: "teleprompter.q8",
		color: "#7C3AED",
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
	const t = useTranslations("meeting");
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
			toast.error(t("toast.answerError"));
		} finally {
			setSending(false);
		}
	}, [sessionId, answerText, currentQuestion, sending, t]);

	const handleAnswer = useCallback(async (questionIdx: number) => {
		if (!sessionId || !answerText.trim() || sending) return;
		const questionKey = DEFAULT_SIPOC_QUESTIONS[questionIdx]?.questionKey || "";
		const question = t(questionKey);
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
			toast.error(t("toast.answerError"));
		} finally {
			setSending(false);
		}
	}, [sessionId, answerText, sending, t]);

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
				<div className="flex items-center gap-2 border-b border-chrome-border px-3 py-2">
					<SparklesIcon className="h-3.5 w-3.5 text-primary" />
					<span className="font-display text-sm text-chrome-text-secondary">
						{t("teleprompter.header")}
					</span>
					{gapType && (
						<span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
							{GAP_LABEL_KEYS[gapType] ? t(GAP_LABEL_KEYS[gapType]) : gapType}
						</span>
					)}
					{!gapType && (
						<span className="ml-auto rounded-full bg-chrome-hover px-2 py-0.5 text-[10px] font-medium text-chrome-text-muted">
							SIPOC
						</span>
					)}
				</div>
			)}

			{/* SIPOC Coverage bars — always visible */}
			<div className="flex items-end gap-1 border-b border-chrome-border/50 px-3 py-2">
				{SIPOC_DIMENSIONS.map((dim) => {
					const pct = coverage[dim.key] ?? 0;
					return (
						<div key={dim.key} className="flex flex-1 flex-col items-center gap-1" title={`${t(dim.fullLabelKey)}: ${pct}%`}>
							<div className="h-8 w-full overflow-hidden rounded bg-chrome-raised">
								<div
									className="w-full rounded transition-all duration-500 ease-out"
									style={{
										height: `${Math.max(pct, 2)}%`,
										backgroundColor: pct > 0 ? dim.color : "var(--chrome-border)",
										marginTop: `${100 - Math.max(pct, 2)}%`,
									}}
								/>
							</div>
							<span className="text-[9px] font-medium" style={{ color: pct > 0 ? dim.color : "var(--chrome-text-muted)" }}>
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
						<p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-chrome-text-muted">
							{t("teleprompter.processQuestions")}
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
								const dimColor = SIPOC_DIMENSIONS.find((d) => d.label === dimLabel)?.color || "#3B8FE8";
								return (
									<div key={`ai-${i}`}>
										<button
											type="button"
											onClick={() => {
												if (expandedQ === 200 + i) { setExpandedQ(null); }
												else { setExpandedQ(200 + i); setAnswerText(""); }
											}}
											className="group flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-chrome-raised"
										>
											<span
												className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
												style={{ backgroundColor: dimColor }}
											>
												{dimLabel}
											</span>
											<span className="text-[11px] leading-relaxed text-chrome-text-secondary">{q}</span>
										</button>
										{expandedQ === 200 + i && (
											<div className="ml-6 mt-1 flex gap-1.5 pb-1">
												<input
													type="text"
													value={answerText}
													onChange={(e) => setAnswerText(e.target.value)}
													onKeyDown={(e) => e.key === "Enter" && handleAnswerAiQuestion(q)}
													placeholder={t("teleprompter.answerPlaceholder")}
													autoFocus
													className="flex-1 rounded-lg bg-chrome-raised px-2.5 py-1.5 text-[11px] text-chrome-text placeholder-chrome-text-muted outline-none ring-1 ring-chrome-border focus:ring-primary"
												/>
												<button type="button" onClick={() => handleAnswerAiQuestion(q)} disabled={!answerText.trim()} className="rounded-lg bg-primary px-2 py-1.5 text-[10px] font-medium text-white disabled:opacity-40">+</button>
											</div>
										)}
									</div>
								);
							})}
						{answeredAiQuestions.size > 0 && (
							<p className="mt-2 text-center text-[10px] text-chrome-text-muted">
								{t("teleprompter.answeredCount", { count: answeredAiQuestions.size })}
							</p>
						)}
					</div>
				) : (
					/* Default SIPOC-based questions before AI kicks in */
					<div className="space-y-1.5">
						<p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-chrome-text-muted">
							{answeredQuestions.size > 0
								? t("teleprompter.sipocQuestionsProgress", { answered: answeredQuestions.size, total: DEFAULT_SIPOC_QUESTIONS.length })
								: t("teleprompter.sipocQuestionsInitial")}
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
									className="group flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-chrome-raised"
								>
									<span
										className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
										style={{ backgroundColor: q.color }}
									>
										{q.dimension}
									</span>
									<span className="text-[11px] leading-relaxed text-chrome-text-secondary group-hover:text-chrome-text-secondary">
										{t(q.questionKey)}
									</span>
								</button>
								{expandedQ === i && (
									<div className="ml-6 mt-1 flex gap-1.5 pb-1">
										<input
											type="text"
											value={answerText}
											onChange={(e) => setAnswerText(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && handleAnswer(i)}
											placeholder={t("teleprompter.answerPlaceholder")}
											autoFocus
											className="flex-1 rounded-lg bg-chrome-raised px-2.5 py-1.5 text-[11px] text-chrome-text placeholder-chrome-text-muted outline-none ring-1 ring-chrome-border focus:ring-primary"
										/>
										<button
											type="button"
											onClick={() => handleAnswer(i)}
											disabled={!answerText.trim()}
											className="rounded-lg bg-primary px-2 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-action-hover disabled:opacity-40"
										>
											+
										</button>
									</div>
								)}
							</div>
						);
						})}
						{answeredQuestions.size > 0 && answeredQuestions.size === DEFAULT_SIPOC_QUESTIONS.length && (
							<p className="mt-3 text-center text-[10px] text-success">
								{t("teleprompter.allSipocAnswered")}
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function QuestionModePills() {
	const t = useTranslations("meeting");
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
		const modeConfig = QUESTION_MODES.find((m) => m.key === newMode);
		const label = modeConfig ? t(modeConfig.labelKey) : newMode;
		toast.loading(t("toast.modeChanging", { label }), { id: "mode-change" });
		try {
			// Save mode
			await fetch(`/api/sessions/${sessionId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ questionMode: newMode }),
			});
			// Regenerate questions with new mode
			await fetch(`/api/sessions/${sessionId}/regenerate-questions`, { method: "POST" });
			toast.success(t("toast.modeChanged", { label }), { id: "mode-change", duration: 3000 });
		} catch {
			toast.error(t("toast.modeError"), { id: "mode-change" });
		}
		finally { setSaving(false); }
	}, [sessionId, mode, saving, t]);

	return (
		<div className="flex items-center gap-1 border-b border-chrome-border/50 px-3 py-1.5">
			{QUESTION_MODES.map((m) => {
				const Icon = m.icon;
				const active = mode === m.key;
				return (
					<button
						key={m.key}
						type="button"
						onClick={() => handleChange(m.key)}
						title={t(m.hintKey)}
						className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[10px] font-medium transition-colors ${
							active
								? "bg-primary/15 text-primary"
								: "text-chrome-text-muted hover:bg-chrome-raised hover:text-chrome-text-secondary"
						}`}
					>
						<Icon className="h-3.5 w-3.5" />
						{t(m.labelKey)}
					</button>
				);
			})}
		</div>
	);
}
