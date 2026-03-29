"use client";

import { useState, useCallback } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { SendIcon, SparklesIcon, Loader2Icon } from "lucide-react";

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	updatedFields?: string[];
}

interface ContextChatProps {
	processId: string;
	onContextUpdated: (update: Record<string, unknown>) => void;
}

export function ContextChat({ processId, onContextUpdated }: ContextChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);

	const send = useCallback(async () => {
		const text = input.trim();
		if (!text || loading) return;

		setInput("");
		setMessages((prev) => [...prev, { role: "user", content: text }]);
		setLoading(true);

		try {
			const res = await fetch(`/api/processes/${processId}/context-chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: text }),
			});

			if (!res.ok) throw new Error("API error");

			const data = await res.json();

			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: data.summary || "Procesado.",
					updatedFields: data.updatedFields,
				},
			]);

			if (data.updated && Object.keys(data.updated).length > 0) {
				onContextUpdated(data.updated);
			}
		} catch {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: "Error al procesar tu mensaje. Intenta de nuevo.",
				},
			]);
		} finally {
			setLoading(false);
		}
	}, [input, loading, processId, onContextUpdated]);

	return (
		<div className="space-y-3">
			{/* Intro hint when empty */}
			{messages.length === 0 && (
				<div className="flex items-start gap-2 rounded-lg bg-accent p-3">
					<SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
					<p className="text-xs text-chrome-text-secondary">
						Describe el proceso en lenguaje natural y la AI extraerá
						automáticamente la descripción, objetivos, triggers y outputs.
					</p>
				</div>
			)}

			{/* Messages */}
			{messages.length > 0 && (
				<div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border bg-secondary p-3">
					{messages.map((msg, i) => (
						<div
							key={i}
							className={`text-xs ${
								msg.role === "user"
									? "text-foreground"
									: "text-chrome-text-secondary"
							}`}
						>
							<span className="font-medium">
								{msg.role === "user" ? "Tú" : "AI"}:
							</span>{" "}
							{msg.content}
							{msg.updatedFields && msg.updatedFields.length > 0 && (
								<span className="ml-1 text-primary">
									✓ {msg.updatedFields.join(", ")}
								</span>
							)}
						</div>
					))}
					{loading && (
						<div className="flex items-center gap-1.5 text-xs text-chrome-text-secondary">
							<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
							Analizando...
						</div>
					)}
				</div>
			)}

			{/* Input */}
			<div className="flex gap-2">
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Ej: Este proceso maneja quejas del call center, lo dispara una llamada..."
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							send();
						}
					}}
					disabled={loading}
					className="flex-1 text-sm"
				/>
				<Button
					size="sm"
					onClick={send}
					disabled={!input.trim() || loading}
				>
					<SendIcon className="h-3.5 w-3.5" />
				</Button>
			</div>
		</div>
	);
}
