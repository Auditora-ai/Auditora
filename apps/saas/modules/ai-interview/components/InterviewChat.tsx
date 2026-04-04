"use client";

import { useState, useRef, useEffect } from "react";
import { SendIcon, SparklesIcon, Zap } from "lucide-react";
import { TopicChips } from "./TopicChips";

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

interface SipocCoverage {
	suppliers: number;
	inputs: number;
	process: number;
	outputs: number;
	customers: number;
}

interface InterviewChatProps {
	messages: ChatMessage[];
	sending: boolean;
	error: string | null;
	completenessScore: number;
	sipocCoverage: SipocCoverage | null;
	readyForReveal: boolean;
	onSendMessage: (content: string) => void;
	onReveal: () => void;
	processName: string;
}

const SIPOC_DIMS = [
	{ key: "suppliers" as const, label: "S", fullLabel: "Proveedores", color: "#8B5CF6" },
	{ key: "inputs" as const, label: "I", fullLabel: "Entradas", color: "#3B82F6" },
	{ key: "process" as const, label: "P", fullLabel: "Proceso", color: "#F59E0B" },
	{ key: "outputs" as const, label: "O", fullLabel: "Salidas", color: "#22C55E" },
	{ key: "customers" as const, label: "C", fullLabel: "Clientes", color: "#EC4899" },
] as const;

export function InterviewChat({
	messages,
	sending,
	error,
	completenessScore,
	sipocCoverage,
	readyForReveal,
	onSendMessage,
	onReveal,
	processName,
}: InterviewChatProps) {
	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	function handleSend() {
		if (!input.trim() || sending) return;
		onSendMessage(input.trim());
		setInput("");
		inputRef.current?.focus();
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						<SparklesIcon className="size-4 sm:size-5 shrink-0"  />
						<h2 className="text-sm sm:text-lg font-semibold truncate text-foreground" >
							{processName}
						</h2>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{/* Completeness badge */}
						<div
							className="flex items-center gap-1 rounded-full px-2.5 py-1"
							className={completenessScore >= 70 ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}
						>
							<span className="text-[10px] sm:text-xs font-medium">
								{completenessScore}%
							</span>
						</div>
						{readyForReveal && (
							<button
								onClick={onReveal}
								className="rounded-md px-3 py-2 text-xs sm:text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 min-h-[36px] sm:min-h-[40px]"
								
							>
								Ver BPMN
							</button>
						)}
					</div>
				</div>

				{/* SIPOC coverage bar — methodology-visible */}
				{sipocCoverage && (
					<div className="mt-2 sm:mt-3">
						<div className="flex items-center gap-1 mb-1">
							<Zap className="size-2.5"  />
							<span className="text-[9px] font-bold uppercase tracking-widest" >
								Cobertura SIPOC
							</span>
						</div>
						<div className="flex items-center gap-2 sm:gap-3">
							{SIPOC_DIMS.map((dim) => {
								const val = sipocCoverage[dim.key];
								return (
									<div key={dim.key} className="flex items-center gap-1" title={dim.fullLabel}>
										<span
											className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
											style={{
												backgroundColor: val >= 70 ? `${dim.color}20` : val > 30 ? `${dim.color}10` : "#F1F5F9",
												color: val >= 70 ? dim.color : val > 30 ? "#D97706" : "#94A3B8",
												border: `1px solid ${val >= 70 ? `${dim.color}30` : "transparent"}`,
											}}
										>
											{dim.label}
										</span>
										<div className="h-1.5 w-8 sm:w-12 overflow-hidden rounded-full" >
											<div
												className="h-full rounded-full transition-all"
												style={{
													width: `${val}%`,
													backgroundColor: val >= 70 ? dim.color : "#D97706",
													transitionDuration: "500ms",
												}}
											/>
										</div>
										<span className="hidden sm:inline text-[9px] font-medium" >
											{dim.fullLabel}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Messages — full width on mobile */}
			<div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
				<div className="mx-auto max-w-2xl space-y-3 sm:space-y-4">
					{messages.map((msg, i) => (
						<div
							key={i}
							className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
						className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
							msg.role === "user"
								? "max-w-[85%] sm:max-w-[75%] bg-primary text-primary-foreground"
								: "max-w-[90%] sm:max-w-[80%] bg-muted border border-border text-foreground"
						}`}
							>
								{msg.content}
							</div>
						</div>
					))}

					{/* Topic chips — shown when no user messages yet */}
					{messages.filter((m) => m.role === "user").length === 0 && !sending && (
						<TopicChips
							onSelect={(topic) => {
								const msg = topic.type === "new"
									? "Quiero explorar un proceso nuevo en mi empresa."
									: `Quiero profundizar en el proceso de ${topic.label}.`;
								onSendMessage(msg);
							}}
						/>
					)}

					{sending && (
						<div className="flex justify-start">
							<div
								className="flex items-center gap-1 rounded-2xl px-4 py-3"
								
							>
								<span className="animate-bounce text-xs" style={{ animationDelay: "0ms" }}>●</span>
								<span className="animate-bounce text-xs" style={{ animationDelay: "150ms" }}>●</span>
								<span className="animate-bounce text-xs" style={{ animationDelay: "300ms" }}>●</span>
							</div>
						</div>
					)}

					{error && (
						<div className="flex justify-center">
							<span className="rounded-md px-3 py-1.5 text-xs" >
								{error}
							</span>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input — sticky bottom with safe area */}
			<div className="border-t border-border bg-background px-3 py-3 sm:px-6 sm:py-4 pb-safe" >
				<div className="mx-auto flex max-w-2xl items-center gap-2 sm:gap-3">
					<input
						ref={inputRef}
						type="text"
						enterKeyHint="send"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Escribe tu respuesta..."
						disabled={sending}
					className="flex-1 rounded-xl border border-border bg-muted text-foreground px-4 py-3 text-[16px] sm:text-sm outline-none transition-colors focus:border-primary focus:bg-primary/5 focus:ring-1 focus:ring-primary/30"
					style={{ minHeight: "48px" }}
					/>
					<button
						onClick={handleSend}
						disabled={!input.trim() || sending}
						className="flex items-center justify-center rounded-xl bg-primary px-5 text-primary-foreground transition-colors disabled:opacity-50 active:scale-95 min-h-[48px] min-w-[48px]"	
					>
						<SendIcon className="size-5" />
					</button>
				</div>
			</div>
		</div>
	);
}
