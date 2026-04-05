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
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { cn } from "@repo/ui";

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
			<div className="flex items-center gap-2 sm:gap-3 border-b border-border bg-background/95 backdrop-blur px-3 py-2 sm:px-6 sm:py-3">
				<Link
					href={`/${organizationSlug}/discovery`}
					className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:opacity-80 min-h-[48px] min-w-[48px] justify-center sm:justify-start sm:min-w-0"
				>
					<ArrowLeftIcon className="size-4" />
					<span className="hidden sm:inline">Sesiones</span>
				</Link>
				<span className="hidden sm:inline text-border">|</span>
				<span className="text-sm font-medium text-foreground">
					Entrevista IA
				</span>
				<Badge variant="secondary" className="hidden sm:inline-flex text-[9px] font-bold uppercase tracking-wider">
					SIPOC → BPMN 2.0
				</Badge>
				{phase === "chat" && (
					<Badge status="warning" className="ml-auto text-[10px] sm:text-xs border border-border">
						En progreso
					</Badge>
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
				<div className="flex h-full flex-col overflow-y-auto bg-background">
					{/* Diagram section */}
					<div className="border-b border-border p-4 sm:p-6">
						<div className="flex items-center gap-3 mb-4 flex-wrap">
							<h2 className="text-xl sm:text-2xl font-semibold text-foreground">
								Tu proceso: {processName}
							</h2>
							<Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">
								BPMN 2.0
							</Badge>
						</div>
						{completionData.bpmnXml ? (
							<InterviewBpmnViewer
								bpmnXml={completionData.bpmnXml}
								className="h-[300px] sm:h-[400px]"
							/>
						) : (
							<Card size="sm" className="shadow-none">
								<CardContent className="flex h-[200px] items-center justify-center">
									<span className="text-sm text-muted-foreground">No se pudo generar el diagrama</span>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Risk report section — FMEA style */}
					{completionData.risks && completionData.risks.length > 0 && (
						<div className="p-4 sm:p-6">
							<div className="flex items-center gap-3 mb-4 flex-wrap">
								<h2 className="text-xl sm:text-2xl font-semibold text-foreground">
									Riesgos Descubiertos
								</h2>
								<Badge variant="destructive" className="text-[9px] font-bold uppercase tracking-wider">
									Análisis FMEA
								</Badge>
							</div>

							{completionData.riskSummary && (
								<div className="mb-4 flex flex-wrap gap-3">
									<Card size="sm" className="rounded-lg py-3 shadow-none">
										<CardContent className="px-4 py-0">
											<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Score FMEA</span>
											<p className="text-lg font-semibold text-foreground">
												{completionData.riskSummary.totalRiskScore}
											</p>
										</CardContent>
									</Card>
									{completionData.riskSummary.criticalCount > 0 && (
										<Card size="sm" className="rounded-lg py-3 shadow-none border-destructive bg-destructive/5">
											<CardContent className="px-4 py-0">
												<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Críticos</span>
												<p className="text-lg font-semibold text-destructive">
													{completionData.riskSummary.criticalCount}
												</p>
											</CardContent>
										</Card>
									)}
									{completionData.riskSummary.topRiskArea && (
										<Card size="sm" className="rounded-lg py-3 shadow-none">
											<CardContent className="px-4 py-0">
												<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Área Principal</span>
												<p className="text-sm font-medium text-foreground">
													{completionData.riskSummary.topRiskArea}
												</p>
											</CardContent>
										</Card>
									)}
								</div>
							)}

							<div className="space-y-3">
								{completionData.risks.map((risk, i) => {
									const rpn = risk.severity * risk.probability;
									return (
										<Card
											key={i}
											size="sm"
											className="rounded-lg py-3 shadow-none border-border bg-muted"
										>
											<CardContent className="px-4 py-0">
												<div className="flex items-start justify-between gap-2">
													<h3 className="text-sm font-medium text-foreground">
														{risk.title}
													</h3>
													<div className="flex gap-1 shrink-0">
														<Badge
															variant="outline"
															className={cn(
																"rounded px-1.5 py-0.5 text-[10px] font-semibold",
																risk.severity >= 4
																	? "bg-destructive/10 text-destructive border-destructive/20"
																	: risk.severity >= 3
																		? "bg-amber-500/10 text-amber-500 border-amber-500/20"
																		: "bg-primary/10 text-primary border-primary/20",
															)}
														>
															S:{risk.severity}
														</Badge>
														<Badge
															variant="outline"
															className={cn(
																"rounded px-1.5 py-0.5 text-[10px] font-semibold",
																risk.probability >= 4
																	? "bg-destructive/10 text-destructive border-destructive/20"
																	: risk.probability >= 3
																		? "bg-amber-500/10 text-amber-500 border-amber-500/20"
																		: "bg-primary/10 text-primary border-primary/20",
															)}
														>
															P:{risk.probability}
														</Badge>
														<Badge
															variant="outline"
															className={cn(
																"rounded px-1.5 py-0.5 text-[10px] font-bold",
																rpn >= 16
																	? "bg-destructive/10 text-destructive border-destructive/20"
																	: rpn >= 12
																		? "bg-amber-500/10 text-amber-500 border-amber-500/20"
																		: "bg-primary/10 text-primary border-primary/20",
															)}
														>
															RPN:{rpn}
														</Badge>
													</div>
												</div>
												<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
													{risk.description}
												</p>
											</CardContent>
										</Card>
									);
								})}
							</div>

							{/* FMEA legend */}
							<div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
								<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									S=Severidad  P=Probabilidad  RPN=Número de Prioridad de Riesgo
								</span>
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="border-t border-border p-4 sm:p-6 pb-safe">
						<div className="flex flex-col sm:flex-row gap-3">
							{shareToken && (
								<Button
									variant="outline"
									onClick={() => {
										navigator.clipboard.writeText(
											`${window.location.origin}/share/${shareToken}`,
										);
									}}
									className="min-h-[48px]"
								>
									<ShareIcon className="size-4" />
									Compartir
								</Button>
							)}
							<Button asChild variant="default" className="min-h-[48px]">
								<Link href={`/${organizationSlug}/discovery`}>
									Volver a Descubrir
								</Link>
							</Button>
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
