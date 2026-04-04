"use client";

import { useState, useRef, useEffect } from "react";
import { SendIcon, SparklesIcon } from "lucide-react";
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

	const sipocDimensions = sipocCoverage
		? [
			{ label: "S", value: sipocCoverage.suppliers, name: "Suppliers" },
			{ label: "I", value: sipocCoverage.inputs, name: "Inputs" },
			{ label: "P", value: sipocCoverage.process, name: "Process" },
			{ label: "O", value: sipocCoverage.outputs, name: "Outputs" },
			{ label: "C", value: sipocCoverage.customers, name: "Customers" },
		]
		: null;

	return (
		<div className="flex h-full flex-col" style={{ backgroundColor: "#F8FAFC" }}>
			{/* Header */}
			<div className="border-b px-6 py-4" style={{ borderColor: "#E2E8F0" }}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<SparklesIcon className="size-5" style={{ color: "#D97706" }} />
						<h2 className="text-lg font-semibold" style={{ color: "#0A1428" }}>
							{processName}
						</h2>
					</div>
					<div className="flex items-center gap-3">
						{/* Completeness badge */}
						<div
							className="flex items-center gap-2 rounded-full px-3 py-1"
							style={{
								backgroundColor: completenessScore >= 70 ? "#F0FDF4" : "#FEF3C7",
								color: completenessScore >= 70 ? "#16A34A" : "#D97706",
							}}
						>
							<span className="text-xs font-medium">
								{completenessScore}%
							</span>
						</div>
						{readyForReveal && (
							<button
								onClick={onReveal}
								className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
								style={{ backgroundColor: "#3B8FE8" }}
							>
								Ver Diagrama
							</button>
						)}
					</div>
				</div>

				{/* SIPOC bar */}
				{sipocDimensions && (
					<div className="mt-3 flex items-center gap-4">
						{sipocDimensions.map((dim) => (
							<div key={dim.label} className="flex items-center gap-1.5">
								<span
									className="text-xs font-medium"
									style={{
										color: dim.value >= 70 ? "#16A34A" : dim.value > 30 ? "#D97706" : "#94A3B8",
									}}
								>
									{dim.label}
								</span>
								<div className="h-1 w-12 overflow-hidden rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
									<div
										className="h-full rounded-full transition-all"
										style={{
											width: `${dim.value}%`,
											backgroundColor: dim.value >= 70 ? "#16A34A" : "#D97706",
											transitionDuration: "500ms",
										}}
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-6 py-4">
				<div className="mx-auto max-w-2xl space-y-4">
					{messages.map((msg, i) => (
						<div
							key={i}
							className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className="max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed"
					style={
							msg.role === "user"
								? { backgroundColor: "#3B8FE8", color: "#FFFFFF" }
								: { backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0", color: "#0A1428" }
						}
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
								className="flex items-center gap-1 rounded-lg px-4 py-3"
								style={{ backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0" }}
							>
								<span className="animate-bounce text-xs" style={{ color: "#94A3B8", animationDelay: "0ms" }}>●</span>
								<span className="animate-bounce text-xs" style={{ color: "#94A3B8", animationDelay: "150ms" }}>●</span>
								<span className="animate-bounce text-xs" style={{ color: "#94A3B8", animationDelay: "300ms" }}>●</span>
							</div>
						</div>
					)}

					{error && (
						<div className="flex justify-center">
							<span className="rounded-md px-3 py-1 text-xs" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
								{error}
							</span>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input */}
			<div className="border-t px-6 py-4" style={{ borderColor: "#E2E8F0" }}>
				<div className="mx-auto flex max-w-2xl items-center gap-3">
				<input
					ref={inputRef}
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Escribe tu respuesta..."
					disabled={sending}
					className="flex-1 rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-[#3B8FE8] focus:bg-[#EFF6FF] focus:ring-1 focus:ring-[#3B8FE8]/30"
					style={{
						backgroundColor: "#F1F5F9",
						borderColor: "#E2E8F0",
						color: "#0A1428",
						minHeight: "44px",
					}}
				/>
					<button
						onClick={handleSend}
						disabled={!input.trim() || sending}
						className="flex items-center justify-center rounded-lg px-5 text-white transition-colors disabled:opacity-50"
						style={{ backgroundColor: "#3B8FE8", minHeight: "44px" }}
					>
						<SendIcon className="size-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
