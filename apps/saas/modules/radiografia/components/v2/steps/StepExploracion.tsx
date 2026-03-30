"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { IndustryInferenceResult } from "@radiografia/lib/industry-inference";
import type { SipocResult } from "@repo/ai";
import type { RiskData } from "@radiografia/lib/types";
import { ConversationChat, type ChatMessage, type CriticalProcess } from "../ConversationChat";
import { ExploracionSidebar } from "../ExploracionSidebar";

interface SipocCoverage {
	suppliers: number;
	inputs: number;
	process: number;
	outputs: number;
	customers: number;
}

interface StepExploracionProps {
	inferenceResult: IndustryInferenceResult | null;
	sipoc: SipocResult | null;
	risks: RiskData | null;
	selectedProcess: string;
	onSelectProcess: (name: string) => void;
	pipelineLoading: boolean;
	statusMessage: string;
	onViewResults: () => void;
}

export function StepExploracion({
	inferenceResult,
	sipoc,
	risks,
	selectedProcess,
	onSelectProcess,
	pipelineLoading,
	statusMessage,
	onViewResults,
}: StepExploracionProps) {
	const t = useTranslations("scan");

	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [chatLoading, setChatLoading] = useState(false);
	const [completenessScore, setCompletenessScore] = useState(0);
	const [sipocCoverage, setSipocCoverage] = useState<SipocCoverage | null>(null);
	const [hasInitialized, setHasInitialized] = useState(false);

	// Build initial messages when inference results arrive
	if (inferenceResult && !hasInitialized) {
		setHasInitialized(true);

		const processCards: CriticalProcess[] = inferenceResult.criticalProcesses.map((p) => ({
			name: p.name,
			description: p.description,
			riskLevel: p.riskLevel,
		}));

		setMessages([
			{
				role: "assistant",
				content: t("v2.chatIntro", { industry: inferenceResult.industry }),
				processCards,
			},
		]);

		// Auto-select the recommended process
		if (inferenceResult.selectedProcess && !selectedProcess) {
			onSelectProcess(inferenceResult.selectedProcess.name);
		}
	}

	// When a process is selected, add a confirmation message and first question
	const handleSelectProcess = useCallback((name: string) => {
		onSelectProcess(name);

		// Add selection confirmation
		setMessages((prev) => {
			// Avoid duplicate selection messages
			const lastMsg = prev[prev.length - 1];
			if (lastMsg?.content.includes(name) && lastMsg.role === "assistant") return prev;

			return [
				...prev,
				{
					role: "assistant",
					content: t("v2.chatProcessSelected", { process: name }),
				},
			];
		});
	}, [onSelectProcess, t]);

	const sendMessage = useCallback(async () => {
		if (!input.trim() || chatLoading || !selectedProcess) return;

		const userText = input.trim();
		setInput("");
		setMessages((prev) => [...prev, { role: "user", content: userText }]);
		setChatLoading(true);

		try {
			const res = await fetch("/api/public/scan/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userText }),
			});

			const data = await res.json();

			if (data.error) {
				setMessages((prev) => [...prev, { role: "assistant", content: data.error }]);
			} else {
				setMessages((prev) => [...prev, { role: "assistant", content: data.question }]);
				if (typeof data.completenessScore === "number") {
					setCompletenessScore(data.completenessScore);
				}
				if (data.sipocCoverage) {
					setSipocCoverage(data.sipocCoverage);
				}
			}
		} catch {
			setMessages((prev) => [...prev, { role: "assistant", content: t("connectionError") }]);
		} finally {
			setChatLoading(false);
		}
	}, [input, chatLoading, selectedProcess, t]);

	// Can view results when we have risks OR the user has chatted enough
	const canViewResults = risks !== null || completenessScore >= 50;

	// Show loading state while waiting for inference
	if (!inferenceResult && pipelineLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<div className="space-y-4 text-center">
					<div className="mx-auto flex size-12 items-center justify-center">
						<span className="relative flex size-4">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-orientation opacity-40" />
							<span className="relative inline-flex size-4 rounded-full bg-orientation" />
						</span>
					</div>
					<div>
						<p className="text-sm font-medium text-foreground">{statusMessage || t("v2.analyzingIndustry")}</p>
						<p className="mt-1 text-xs text-muted-foreground">{t("v2.exploracionLoading")}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-1 overflow-hidden">
			<ConversationChat
				messages={messages}
				input={input}
				onInputChange={setInput}
				onSendMessage={sendMessage}
				loading={chatLoading}
				selectedProcess={selectedProcess}
				onSelectProcess={handleSelectProcess}
			/>
			<ExploracionSidebar
				completenessScore={completenessScore}
				sipocCoverage={sipocCoverage}
				risks={risks}
				onViewResults={onViewResults}
				canViewResults={canViewResults}
				loading={pipelineLoading}
			/>
		</div>
	);
}
