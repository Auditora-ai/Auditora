"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { InterviewChat } from "./InterviewChat";
import { InterviewReveal } from "./InterviewReveal";
import { InterviewBpmnViewer } from "./InterviewBpmnViewer";
import { useInterviewChat } from "@ai-interview/hooks/useInterviewChat";
import type { InterviewCompletionStatus } from "@ai-interview/lib/interview-types";
import { ArrowLeftIcon, ShareIcon } from "lucide-react";
import Link from "next/link";

type InterviewPhase = "chat" | "completing" | "results";

interface AIInterviewPageProps {
	sessionId: string;
	processName: string;
	organizationSlug: string;
	shareToken?: string;
	initialMessages?: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
}

export function AIInterviewPage({
	sessionId,
	processName,
	organizationSlug,
	shareToken,
	initialMessages,
}: AIInterviewPageProps) {
	const [phase, setPhase] = useState<InterviewPhase>(
		initialMessages && initialMessages.length > 0 ? "chat" : "chat",
	);
	const [completionData, setCompletionData] = useState<InterviewCompletionStatus | null>(null);

	const {
		messages,
		completenessScore,
		sipocCoverage,
		readyForReveal,
		ghostNodes,
		sending,
		error,
		sendMessage,
	} = useInterviewChat(sessionId, { initialMessages });

	const handleReveal = useCallback(() => {
		setPhase("completing");
	}, []);

	const handleComplete = useCallback((data: InterviewCompletionStatus) => {
		setCompletionData(data);
		setPhase("results");
	}, []);

	return (
		<div className="flex h-screen flex-col">
			{/* Top nav */}
			<div
				className="flex items-center gap-2 sm:gap-3 border-b px-3 py-2 sm:px-6 sm:py-3"
				style={{ backgroundColor: "#0A1428", borderColor: "#1E293B" }}
			>
				<Link
					href={`/${organizationSlug}/descubrir`}
					className="flex items-center gap-1 text-sm transition-colors hover:opacity-80 min-h-[36px] min-w-[36px] justify-center sm:justify-start sm:min-w-0"
					style={{ color: "#94A3B8" }}
				>
					<ArrowLeftIcon className="size-4" />
					<span className="hidden sm:inline">Sesiones</span>
				</Link>
				<span style={{ color: "#1E293B" }} className="hidden sm:inline">|</span>
				<span className="text-sm font-medium" style={{ color: "#F1F5F9" }}>
					Entrevista IA
				</span>
				<span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
					style={{ backgroundColor: "#1E293B", color: "#3B8FE8" }}
				>
					SIPOC → BPMN 2.0
				</span>
				{phase === "chat" && (
					<span
						className="ml-auto rounded-full px-2 py-0.5 text-[10px] sm:text-xs"
						style={{ backgroundColor: "#111827", color: "#D97706", border: "1px solid #1E293B" }}
					>
						En progreso
					</span>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-hidden">
				<AnimatePresence mode="wait">
				{phase === "chat" && (
					<motion.div
						key="chat"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="h-full"
					>
					<InterviewChat
						messages={messages}
						sending={sending}
						error={error}
						completenessScore={completenessScore}
						sipocCoverage={sipocCoverage}
						readyForReveal={readyForReveal}
						onSendMessage={sendMessage}
						onReveal={handleReveal}
						processName={processName}
					/>
					</motion.div>
				)}

				{phase === "completing" && (
					<motion.div
						key="completing"
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
						className="h-full"
					>
					<InterviewReveal
						sessionId={sessionId}
						shareToken={shareToken}
						onComplete={handleComplete}
					/>
					</motion.div>
				)}

				{phase === "results" && completionData && (
					<motion.div
						key="results"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className="h-full"
					>
				<div className="flex h-full flex-col overflow-y-auto" style={{ backgroundColor: "#F8FAFC" }}>
					{/* Diagram section */}
					<div className="border-b p-4 sm:p-6" style={{ borderColor: "#E2E8F0" }}>
						<div className="flex items-center gap-3 mb-4 flex-wrap">
							<h2
								className="text-xl sm:text-2xl font-semibold"
								style={{ color: "#0A1428" }}
							>
								Tu proceso: {processName}
							</h2>
							<span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
								style={{ backgroundColor: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}
							>
								BPMN 2.0
							</span>
						</div>
						{completionData.bpmnXml ? (
							<InterviewBpmnViewer
								bpmnXml={completionData.bpmnXml}
								className="h-[300px] sm:h-[400px]"
							/>
						) : (
							<div className="flex h-[200px] items-center justify-center rounded-lg border" style={{ borderColor: "#E2E8F0" }}>
								<span className="text-sm" style={{ color: "#64748B" }}>No se pudo generar el diagrama</span>
							</div>
						)}
					</div>

					{/* Risk report section — FMEA style */}
					{completionData.risks && completionData.risks.length > 0 && (
						<div className="p-4 sm:p-6">
							<div className="flex items-center gap-3 mb-4 flex-wrap">
								<h2
									className="text-xl sm:text-2xl font-semibold"
									style={{ color: "#0A1428" }}
								>
									Riesgos Descubiertos
								</h2>
								<span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
									style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
								>
									Análisis FMEA
								</span>
							</div>

							{completionData.riskSummary && (
								<div className="mb-4 flex flex-wrap gap-3">
									<div className="rounded-lg border px-4 py-3" style={{ borderColor: "#E2E8F0" }}>
										<span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#64748B" }}>Score FMEA</span>
										<p className="text-lg font-semibold" style={{ color: "#0A1428" }}>
											{completionData.riskSummary.totalRiskScore}
										</p>
									</div>
									{completionData.riskSummary.criticalCount > 0 && (
										<div className="rounded-lg border px-4 py-3" style={{ borderColor: "#DC2626", backgroundColor: "#FEF2F2" }}>
											<span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#DC2626" }}>Críticos</span>
											<p className="text-lg font-semibold" style={{ color: "#DC2626" }}>
												{completionData.riskSummary.criticalCount}
											</p>
										</div>
									)}
									{completionData.riskSummary.topRiskArea && (
										<div className="rounded-lg border px-4 py-3" style={{ borderColor: "#E2E8F0" }}>
											<span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#64748B" }}>Área Principal</span>
											<p className="text-sm font-medium" style={{ color: "#0A1428" }}>
												{completionData.riskSummary.topRiskArea}
											</p>
										</div>
									)}
								</div>
							)}

							<div className="space-y-3">
								{completionData.risks.map((risk, i) => {
									const rpn = risk.severity * risk.probability;
									const rpnColor = rpn >= 16 ? "#DC2626" : rpn >= 9 ? "#F97316" : rpn >= 4 ? "#D97706" : "#16A34A";
									const rpnBg = rpn >= 16 ? "#FEF2F2" : rpn >= 9 ? "#FFF7ED" : rpn >= 4 ? "#FEF3C7" : "#F0FDF4";
									return (
										<div
											key={i}
											className="rounded-lg border p-4"
											style={{ borderColor: "#E2E8F0", backgroundColor: "#F1F5F9" }}
										>
											<div className="flex items-start justify-between gap-2">
												<h3 className="text-sm font-medium" style={{ color: "#0A1428" }}>
													{risk.title}
												</h3>
												<div className="flex gap-1 shrink-0">
													<span
														className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
														style={{
															backgroundColor: risk.severity >= 4 ? "#FEF2F2" : risk.severity >= 3 ? "#FEF3C7" : "#F0FDF4",
															color: risk.severity >= 4 ? "#DC2626" : risk.severity >= 3 ? "#D97706" : "#16A34A",
														}}
													>
														S:{risk.severity}
													</span>
													<span
														className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
														style={{
															backgroundColor: risk.probability >= 4 ? "#FEF2F2" : risk.probability >= 3 ? "#FEF3C7" : "#F0FDF4",
															color: risk.probability >= 4 ? "#DC2626" : risk.probability >= 3 ? "#D97706" : "#16A34A",
														}}
													>
														P:{risk.probability}
													</span>
													<span
														className="rounded px-1.5 py-0.5 text-[10px] font-bold"
														style={{ backgroundColor: rpnBg, color: rpnColor }}
													>
														RPN:{rpn}
													</span>
												</div>
											</div>
											<p className="mt-1 text-xs leading-relaxed" style={{ color: "#64748B" }}>
												{risk.description}
											</p>
										</div>
									);
								})}
							</div>

							{/* FMEA legend */}
							<div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "#E2E8F0" }}>
								<span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
									S=Severidad  P=Probabilidad  RPN=Número de Prioridad de Riesgo
								</span>
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="border-t p-4 sm:p-6 pb-safe" style={{ borderColor: "#E2E8F0" }}>
						<div className="flex flex-col sm:flex-row gap-3">
							{shareToken && (
								<button
									onClick={() => {
										navigator.clipboard.writeText(
											`${window.location.origin}/share/${shareToken}`,
										);
									}}
									className="flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80 min-h-[44px]"
									style={{ borderColor: "#E2E8F0", color: "#3B8FE8" }}
								>
									<ShareIcon className="size-4" />
									Compartir
								</button>
							)}
							<Link
								href={`/${organizationSlug}/descubrir`}
								className="flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white min-h-[44px]"
								style={{ backgroundColor: "#3B8FE8" }}
							>
								Volver a Descubrir
							</Link>
						</div>
					</div>
				</div>
				</motion.div>
				)}
				</AnimatePresence>
			</div>
		</div>
	);
}
