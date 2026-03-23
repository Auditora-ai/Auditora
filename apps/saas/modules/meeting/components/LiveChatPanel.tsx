"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import {
	ArrowUpIcon,
	Loader2Icon,
	PaperclipIcon,
	InfoIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ExtractionCard,
	type ExtractedProcessData,
} from "../../discovery/components/ExtractionCard";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	extractedProcesses?: ExtractedProcessData[];
}

interface TranscriptEntry {
	id: string;
	speaker: string;
	text: string;
	timestamp: number;
}

interface LiveChatPanelProps {
	organizationId: string;
	sessionId: string;
	transcript: TranscriptEntry[];
	sessionEnded?: boolean;
	onNewMessage?: () => void;
	onProcessAccepted?: () => void;
}

function serializeTranscript(entries: TranscriptEntry[], limit = 50): string {
	const recent = entries.slice(-limit);
	return recent.map((e) => `${e.speaker}: ${e.text}`).join("\n");
}

export function LiveChatPanel({
	organizationId,
	sessionId,
	transcript,
	sessionEnded = false,
	onNewMessage,
	onProcessAccepted,
}: LiveChatPanelProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [threadId, setThreadId] = useState<string | null>(null);
	const [initialLoading, setInitialLoading] = useState(true);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Load existing thread
	useEffect(() => {
		async function loadThread() {
			try {
				const res = await fetch(
					`/api/discovery/chat?organizationId=${organizationId}&sessionId=${sessionId}`,
				);
				if (res.ok) {
					const data = await res.json();
					setThreadId(data.thread.id);
					if (data.thread.messages.length > 0) {
						setMessages(
							data.thread.messages.map(
								(m: { id: string; role: string; content: string; extractedProcesses?: unknown }) => ({
									id: m.id,
									role: m.role as "user" | "assistant",
									content: m.content,
									extractedProcesses: m.extractedProcesses as ExtractedProcessData[] | undefined,
								}),
							),
						);
					}
				}
			} catch (err) {
				console.error("[LiveChatPanel] Failed to load thread:", err);
			} finally {
				setInitialLoading(false);
			}
		}
		loadThread();
	}, [organizationId]);

	// Auto-scroll on new messages (scoped to messages container only)
	useEffect(() => {
		const container = messagesContainerRef.current;
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	}, [messages]);

	const sendMessage = useCallback(
		async (text: string) => {
			if (!text.trim() || isLoading) return;

			const userMessage: Message = {
				id: `temp-${Date.now()}`,
				role: "user",
				content: text.trim(),
			};
			setMessages((prev) => [...prev, userMessage]);
			setInput("");
			setIsLoading(true);

			try {
				const transcriptContext = serializeTranscript(transcript);

				const res = await fetch("/api/discovery/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						message: text.trim(),
						threadId,
						sessionId,
						transcriptContext,
					}),
				});

				if (!res.ok) throw new Error("Chat API failed");

				const data = await res.json();
				setThreadId(data.threadId);

				const assistantMessage: Message = {
					id: data.message.id,
					role: "assistant",
					content: data.message.content,
					extractedProcesses:
						data.extractedProcesses?.length > 0
							? data.extractedProcesses
							: undefined,
				};
				setMessages((prev) => [...prev, assistantMessage]);
				onNewMessage?.();
			} catch (err) {
				console.error("[LiveChatPanel] Send failed:", err);
				const errorMessage: Message = {
					id: `error-${Date.now()}`,
					role: "assistant",
					content:
						"Error al procesar el mensaje. Intenta de nuevo.",
				};
				setMessages((prev) => [...prev, errorMessage]);
			} finally {
				setIsLoading(false);
			}
		},
		[isLoading, threadId, sessionId, transcript, onNewMessage],
	);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage(input);
		}
	};

	const handleRejectProcess = async (process: ExtractedProcessData) => {
		if (!threadId) return;
		try {
			await fetch("/api/discovery/reject", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					threadId,
					processName: process.name,
				}),
			});
		} catch (err) {
			console.error("[LiveChatPanel] Reject failed:", err);
		}
	};

	const handleAcceptProcess = async (process: ExtractedProcessData) => {
		try {
			await fetch("/api/discovery/accept", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId,
					process,
				}),
			});
			onProcessAccepted?.();
		} catch (err) {
			console.error("[LiveChatPanel] Accept failed:", err);
		}
	};

	if (initialLoading) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				<Loader2Icon className="h-5 w-5 animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Session context banner */}
			{!sessionEnded && transcript.length > 0 && (
				<div className="flex items-center gap-1.5 border-b border-border bg-primary/5 px-3 py-1.5 text-xs text-muted-foreground">
					<InfoIcon className="h-3 w-3 flex-shrink-0" />
					<span>
						La IA tiene acceso a la transcripcion en vivo ({transcript.length} entradas)
					</span>
				</div>
			)}
			{sessionEnded && (
				<div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
					<InfoIcon className="h-3 w-3 flex-shrink-0" />
					<span>Sesion finalizada — transcripcion congelada</span>
				</div>
			)}

			{/* Messages */}
			<div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3">
				{messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
						<p className="font-medium">Chat IA</p>
						<p className="max-w-[200px] text-xs">
							Pregunta sobre la reunion o pide extraer procesos de la conversacion
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{messages.map((msg) => (
							<div key={msg.id}>
								<div
									className={`rounded-lg px-3 py-2 text-sm ${
										msg.role === "user"
											? "ml-6 bg-primary text-primary-foreground"
											: "mr-6 bg-muted text-foreground"
									}`}
								>
									{msg.content}
								</div>
								{msg.extractedProcesses?.map((proc, i) => (
									<div key={`${msg.id}-proc-${i}`} className="mt-2">
										<ExtractionCard
											process={proc}
											onAccept={() => handleAcceptProcess(proc)}
											onReject={handleRejectProcess}
										/>
									</div>
								))}
							</div>
						))}
						<div />
					</div>
				)}
			</div>

			{/* Input */}
			<div className="border-t border-border p-2">
				<div className="flex items-end gap-1.5">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 flex-shrink-0"
						onClick={() => fileInputRef.current?.click()}
					>
						<PaperclipIcon className="h-4 w-4" />
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						className="hidden"
						accept="audio/*,.pdf,.doc,.docx"
					/>
					<Textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Pregunta sobre la reunion..."
						className="min-h-[36px] max-h-[120px] resize-none text-sm"
						rows={1}
					/>
					<Button
						size="icon"
						className="h-8 w-8 flex-shrink-0"
						onClick={() => sendMessage(input)}
						disabled={!input.trim() || isLoading}
					>
						{isLoading ? (
							<Loader2Icon className="h-4 w-4 animate-spin" />
						) : (
							<ArrowUpIcon className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
