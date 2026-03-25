"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SendIcon, Loader2Icon, SparklesIcon } from "lucide-react";

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	suggestions?: Array<{
		name: string;
		confidence: number;
		sessionType?: string;
	}>;
}

interface ProcessDiscoveryChatProps {
	onSelectProcess: (name: string, sessionType: string) => void;
}

export function ProcessDiscoveryChat({ onSelectProcess }: ProcessDiscoveryChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			role: "assistant",
			content:
				"Hola, soy tu asistente de descubrimiento. Cuéntame sobre el proceso que quieres levantar: ¿qué hace?, ¿quién lo ejecuta?, ¿cuál es el objetivo principal?",
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const scrollToBottom = useCallback(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const handleSend = async () => {
		const text = input.trim();
		if (!text || loading) return;

		const userMessage: ChatMessage = { role: "user", content: text };
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch("/api/sessions/discover-process", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [...messages, userMessage].map((m) => ({
						role: m.role,
						content: m.content,
					})),
				}),
			});

			if (!res.ok) throw new Error("Error en el servidor");

			const data = await res.json() as {
				response: string;
				suggestion: {
					suggestedProcess: string;
					area: string;
					sessionType: string;
					confidence: number;
					isExisting: boolean;
				} | null;
			};

			const suggestion = data.suggestion
				? { name: data.suggestion.suggestedProcess, confidence: data.suggestion.confidence, sessionType: data.suggestion.sessionType }
				: null;

			const assistantMessage: ChatMessage = {
				role: "assistant",
				content: data.response,
				suggestions: suggestion ? [suggestion] : undefined,
			};

			setMessages((prev) => [...prev, assistantMessage]);

			// Auto-select when AI is very confident (user already confirmed)
			if (suggestion && suggestion.confidence >= 0.85) {
				onSelectProcess(suggestion.name, suggestion.sessionType ?? "DISCOVERY");
			}
		} catch {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: "Lo siento, hubo un error. Intenta de nuevo.",
				},
			]);
		} finally {
			setLoading(false);
			inputRef.current?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Messages */}
			<div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-1 py-3">
				{messages.map((msg, i) => (
					<div key={i}>
						<div
							className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
									msg.role === "user"
										? "bg-[#2563EB] text-white"
										: "bg-[#1E293B] text-[#F1F5F9]"
								}`}
							>
								{msg.content}
							</div>
						</div>

						{/* Process suggestions */}
						{msg.suggestions && msg.suggestions.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-2 pl-1">
								{msg.suggestions
									.filter((s) => s.confidence > 0.7)
									.map((suggestion, j) => (
										<button
											key={j}
											type="button"
											onClick={() =>
												onSelectProcess(
													suggestion.name,
													suggestion.sessionType ?? "DISCOVERY",
												)
											}
											className="inline-flex items-center gap-1.5 rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/10 px-3 py-1.5 text-sm font-medium text-[#60A5FA] transition-colors hover:bg-[#2563EB]/20"
										>
											<SparklesIcon className="h-3.5 w-3.5" />
											{suggestion.name}
										</button>
									))}
							</div>
						)}
					</div>
				))}

				{loading && (
					<div className="flex justify-start">
						<div className="flex items-center gap-2 rounded-xl bg-[#1E293B] px-4 py-2.5 text-sm text-[#64748B]">
							<Loader2Icon className="h-4 w-4 animate-spin" />
							Analizando...
						</div>
					</div>
				)}
			</div>

			{/* Input */}
			<div className="border-t border-[#334155] pt-3">
				<div className="flex items-center gap-2">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Describe el proceso..."
						disabled={loading}
						className="flex-1 rounded-lg border border-[#334155] bg-[#1E293B] px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:opacity-50"
					/>
					<button
						type="button"
						onClick={handleSend}
						disabled={!input.trim() || loading}
						className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#2563EB] text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
					>
						<SendIcon className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
