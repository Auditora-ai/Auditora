"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ConfidenceMeter } from "./ConfidenceMeter";

interface SipocCoverage {
	suppliers: number;
	inputs: number;
	process: number;
	outputs: number;
	customers: number;
}

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

interface DeepConversationProps {
	processName: string;
	industry: string;
	onRevealReady: () => void;
}

export function DeepConversation({ processName, industry, onRevealReady }: DeepConversationProps) {
	const t = useTranslations("scan");
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			role: "assistant",
			content: t("deepenIntro", { process: processName }),
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [completenessScore, setCompletenessScore] = useState(0);
	const [sipocCoverage, setSipocCoverage] = useState<SipocCoverage | null>(null);
	const [readyForReveal, setReadyForReveal] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	async function sendMessage() {
		if (!input.trim() || loading) return;

		const userMessage = input.trim();
		setInput("");
		setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
		setLoading(true);

		try {
			const res = await fetch("/api/public/scan/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userMessage }),
			});

			const data = await res.json();

			if (data.error) {
				setMessages((prev) => [...prev, { role: "assistant", content: data.error }]);
				if (data.limitReached || data.readyForReveal) setReadyForReveal(true);
			} else {
				setMessages((prev) => [...prev, { role: "assistant", content: data.question }]);
				setCompletenessScore(data.completenessScore);
				if (data.sipocCoverage) setSipocCoverage(data.sipocCoverage);
				if (data.readyForReveal) setReadyForReveal(true);
			}
		} catch {
			setMessages((prev) => [...prev, { role: "assistant", content: t("connectionError") }]);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen bg-background">
			{/* Chat area */}
			<div className="flex flex-1 flex-col">
				{/* Header */}
				<div className="border-b border-border px-6 py-4">
					<div className="flex items-center gap-2">
						<span className="rounded-full border border-[#D97706] px-2 py-0.5 text-xs text-[#D97706]">
							{industry}
						</span>
						<h2 className="text-lg font-semibold text-foreground">
							{processName}
						</h2>
					</div>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto px-6 py-4">
					<div className="mx-auto max-w-2xl space-y-4">
						{messages.map((msg, i) => (
							<div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
								<div
									className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
										msg.role === "user"
											? "bg-primary text-primary-foreground"
											: "border border-border bg-secondary text-foreground"
									}`}
								>
									{msg.content}
								</div>
							</div>
						))}
						{loading && (
							<div className="flex justify-start">
								<div className="rounded-lg border border-border bg-secondary px-4 py-3">
									<span className="flex gap-1">
										<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
										<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
										<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
									</span>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>
				</div>

				{/* Input */}
				<div className="border-t border-border px-6 py-4">
					<div className="mx-auto flex max-w-2xl gap-3">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && sendMessage()}
							placeholder={t("writeResponse")}
							disabled={loading}
							className="flex-1 rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-accent"
						/>
						<button
							type="button"
							onClick={sendMessage}
							disabled={!input.trim() || loading}
							className="min-h-[44px] rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors disabled:opacity-50"
						>
							{t("send")}
						</button>
					</div>
				</div>
			</div>

			{/* Sidebar with confidence meter — intentionally dark (chrome zone) */}
			<div className="w-64 border-l border-border bg-card px-4 py-6">
				<h3 className="mb-4 text-sm font-medium text-card-foreground">
					{t("processCoverage")}
				</h3>

				<ConfidenceMeter score={completenessScore} coverage={sipocCoverage} threshold={70} />

				{readyForReveal ? (
					<button
						type="button"
						onClick={onRevealReady}
						className="mt-6 min-h-[44px] w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
					>
						{t("viewDiagram")}
					</button>
				) : (
					<button
						type="button"
						onClick={onRevealReady}
						className="mt-6 min-h-[44px] w-full text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
					>
						{t("skipToResults")}
					</button>
				)}
			</div>
		</div>
	);
}
