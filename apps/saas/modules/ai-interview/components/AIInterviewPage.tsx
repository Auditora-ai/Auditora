"use client";

import { useState, useCallback } from "react";
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
				className="flex items-center gap-3 border-b px-6 py-3"
				style={{ backgroundColor: "#0A1428", borderColor: "#1E293B" }}
			>
				<Link
					href={`/${organizationSlug}/sessions`}
					className="flex items-center gap-1 text-sm transition-colors hover:opacity-80"
					style={{ color: "#94A3B8" }}
				>
					<ArrowLeftIcon className="size-4" />
					Sesiones
				</Link>
				<span style={{ color: "#1E293B" }}>|</span>
				<span className="text-sm font-medium" style={{ color: "#F1F5F9" }}>
					Entrevista IA
				</span>
				{phase === "chat" && (
					<span
						className="ml-auto rounded-full px-2 py-0.5 text-xs"
						style={{ backgroundColor: "#111827", color: "#D97706", border: "1px solid #1E293B" }}
					>
						En progreso
					</span>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-hidden">
				{phase === "chat" && (
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
				)}

				{phase === "completing" && (
					<InterviewReveal
						sessionId={sessionId}
						shareToken={shareToken}
						onComplete={handleComplete}
					/>
				)}

				{phase === "results" && completionData && (
					<div className="flex h-full flex-col overflow-y-auto" style={{ backgroundColor: "#F8FAFC" }}>
						{/* Diagram section */}
						<div className="border-b p-6" style={{ borderColor: "#E2E8F0" }}>
							<h2
								className="mb-4 text-2xl"
								style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: "#0A1428" }}
							>
								Tu proceso: {processName}
							</h2>
							{completionData.bpmnXml ? (
								<InterviewBpmnViewer
									bpmnXml={completionData.bpmnXml}
									className="h-[400px]"
								/>
							) : (
								<div className="flex h-[200px] items-center justify-center rounded-lg border" style={{ borderColor: "#E2E8F0" }}>
									<span className="text-sm" style={{ color: "#64748B" }}>No se pudo generar el diagrama</span>
								</div>
							)}
						</div>

						{/* Risk report section */}
						{completionData.risks && completionData.risks.length > 0 && (
							<div className="p-6">
								<h2
									className="mb-4 text-2xl"
									style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: "#0A1428" }}
								>
									Riesgos Descubiertos
								</h2>

								{completionData.riskSummary && (
									<div className="mb-4 flex gap-4">
										<div className="rounded-lg border px-4 py-3" style={{ borderColor: "#E2E8F0" }}>
											<span className="text-xs" style={{ color: "#64748B" }}>Score Total</span>
											<p className="text-lg font-semibold" style={{ color: "#0A1428" }}>
												{completionData.riskSummary.totalRiskScore}
											</p>
										</div>
										{completionData.riskSummary.criticalCount > 0 && (
											<div className="rounded-lg border px-4 py-3" style={{ borderColor: "#DC2626", backgroundColor: "#FEF2F2" }}>
												<span className="text-xs" style={{ color: "#DC2626" }}>Críticos</span>
												<p className="text-lg font-semibold" style={{ color: "#DC2626" }}>
													{completionData.riskSummary.criticalCount}
												</p>
											</div>
										)}
										{completionData.riskSummary.topRiskArea && (
											<div className="rounded-lg border px-4 py-3" style={{ borderColor: "#E2E8F0" }}>
												<span className="text-xs" style={{ color: "#64748B" }}>Área Principal</span>
												<p className="text-sm font-medium" style={{ color: "#0A1428" }}>
													{completionData.riskSummary.topRiskArea}
												</p>
											</div>
										)}
									</div>
								)}

								<div className="space-y-3">
									{completionData.risks.map((risk, i) => (
										<div
											key={i}
											className="rounded-lg border p-4"
											style={{ borderColor: "#E2E8F0", backgroundColor: "#F1F5F9" }}
										>
											<div className="flex items-start justify-between">
												<h3 className="text-sm font-medium" style={{ color: "#0A1428" }}>
													{risk.title}
												</h3>
												<div className="flex gap-1">
													<span
														className="rounded px-1.5 py-0.5 text-xs"
														style={{
															backgroundColor: risk.severity >= 4 ? "#FEF2F2" : risk.severity >= 3 ? "#FEF3C7" : "#F0FDF4",
															color: risk.severity >= 4 ? "#DC2626" : risk.severity >= 3 ? "#D97706" : "#16A34A",
														}}
													>
														Sev: {risk.severity}
													</span>
													<span
														className="rounded px-1.5 py-0.5 text-xs"
														style={{
															backgroundColor: risk.probability >= 4 ? "#FEF2F2" : risk.probability >= 3 ? "#FEF3C7" : "#F0FDF4",
															color: risk.probability >= 4 ? "#DC2626" : risk.probability >= 3 ? "#D97706" : "#16A34A",
														}}
													>
														Prob: {risk.probability}
													</span>
												</div>
											</div>
											<p className="mt-1 text-xs leading-relaxed" style={{ color: "#64748B" }}>
												{risk.description}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="border-t p-6" style={{ borderColor: "#E2E8F0" }}>
							<div className="flex gap-3">
								{shareToken && (
									<button
										onClick={() => {
											navigator.clipboard.writeText(
												`${window.location.origin}/share/${shareToken}`,
											);
										}}
										className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
										style={{ borderColor: "#E2E8F0", color: "#3B8FE8" }}
									>
										<ShareIcon className="size-4" />
										Compartir
									</button>
								)}
								<Link
									href={`/${organizationSlug}/sessions`}
									className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white"
									style={{ backgroundColor: "#3B8FE8" }}
								>
									Volver a Sesiones
								</Link>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
