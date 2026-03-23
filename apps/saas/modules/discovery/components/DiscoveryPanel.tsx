"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import {
	ArrowUpIcon,
	XIcon,
	Loader2Icon,
	MicIcon,
	PaperclipIcon,
	LinkIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ExtractionCard,
	type ExtractedProcessData,
} from "./ExtractionCard";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	extractedProcesses?: ExtractedProcessData[];
	audioFileUrl?: string;
}

interface DiscoveryPanelProps {
	projectId: string;
	clientName?: string;
	onClose: () => void;
	onProcessAccepted?: () => void;
}

export function DiscoveryPanel({
	projectId,
	clientName,
	onClose,
	onProcessAccepted,
}: DiscoveryPanelProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [threadId, setThreadId] = useState<string | null>(null);
	const [initialLoading, setInitialLoading] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const lastExtractionTime = useRef(0);

	// Load existing thread
	useEffect(() => {
		async function loadThread() {
			try {
				const res = await fetch(
					`/api/discovery/chat?projectId=${projectId}`,
				);
				if (res.ok) {
					const data = await res.json();
					setThreadId(data.thread.id);
					if (data.thread.messages.length > 0) {
						setMessages(
							data.thread.messages.map(
								(m: {
									id: string;
									role: string;
									content: string;
									extractedProcesses?: ExtractedProcessData[];
								}) => ({
									id: m.id,
									role: m.role as "user" | "assistant",
									content: m.content,
									extractedProcesses:
										m.extractedProcesses ?? undefined,
								}),
							),
						);
					}
				}
			} catch (error) {
				console.error("Failed to load discovery thread:", error);
			} finally {
				setInitialLoading(false);
			}
		}
		loadThread();
	}, [projectId]);

	// Auto-scroll
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const sendMessage = useCallback(
		async (text: string) => {
			if (!text.trim() || isLoading) return;

			// Cooldown: 10 seconds between extractions
			const now = Date.now();
			const shouldExtract =
				text.length > 20 &&
				now - lastExtractionTime.current > 10000;

			// Add user message optimistically
			const userMsg: Message = {
				id: `temp-${now}`,
				role: "user",
				content: text,
			};
			setMessages((prev) => [...prev, userMsg]);
			setInput("");
			setIsLoading(true);

			try {
				const res = await fetch("/api/discovery/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						projectId,
						message: text,
						threadId,
					}),
				});

				if (!res.ok) throw new Error("Chat request failed");

				const data = await res.json();
				setThreadId(data.threadId);

				if (shouldExtract) {
					lastExtractionTime.current = Date.now();
				}

				const assistantMsg: Message = {
					id: data.message.id,
					role: "assistant",
					content: data.message.content,
					extractedProcesses:
						data.extractedProcesses?.length > 0
							? data.extractedProcesses
							: undefined,
				};
				setMessages((prev) => [...prev, assistantMsg]);
			} catch (error) {
				console.error("Chat error:", error);
				setMessages((prev) => [
					...prev,
					{
						id: `error-${now}`,
						role: "assistant",
						content:
							"Error al procesar el mensaje. Intenta de nuevo.",
					},
				]);
			} finally {
				setIsLoading(false);
			}
		},
		[isLoading, projectId, threadId],
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		sendMessage(input);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage(input);
		}
	};

	const handleAudioUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsTranscribing(true);
		const formData = new FormData();
		formData.append("audio", file);

		try {
			const res = await fetch("/api/discovery/transcribe", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Transcription failed");
			}

			const data = await res.json();

			// Send the last chunk (or full transcript if short) as a chat message
			const textToSend = data.chunks
				? data.chunks[data.chunks.length - 1]
				: data.transcript;

			// Add audio indicator message
			setMessages((prev) => [
				...prev,
				{
					id: `audio-${Date.now()}`,
					role: "user",
					content: `🎤 Audio transcrito (${Math.round(data.duration || 0)}s, ${data.wordCount} palabras):\n\n${textToSend}`,
					audioFileUrl: file.name,
				},
			]);

			// Send to extraction pipeline
			await sendMessage(textToSend);
		} catch (error) {
			console.error("Audio upload error:", error);
			setMessages((prev) => [
				...prev,
				{
					id: `error-${Date.now()}`,
					role: "assistant",
					content: `Error al transcribir: ${error instanceof Error ? error.message : "Error desconocido"}`,
				},
			]);
		} finally {
			setIsTranscribing(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleAcceptProcess = async (process: ExtractedProcessData) => {
		try {
			const res = await fetch("/api/discovery/accept", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ projectId, process }),
			});

			if (!res.ok) {
				const error = await res.json();
				if (error.error === "duplicate") {
					alert(error.message);
				}
				return;
			}

			onProcessAccepted?.();
		} catch (error) {
			console.error("Accept process error:", error);
		}
	};

	return (
		<div className="fixed inset-y-0 right-0 z-50 flex w-[420px] flex-col bg-[#0F172A] text-slate-100 shadow-[-4px_0_24px_rgba(0,0,0,0.3)] max-md:w-full">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
				<div>
					<h2 className="text-base font-semibold">Discovery</h2>
					{clientName && (
						<p className="text-xs text-slate-400">{clientName}</p>
					)}
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="text-slate-400 hover:text-slate-200"
				>
					<XIcon className="size-5" />
				</Button>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-5 py-4">
				{initialLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2Icon className="size-5 animate-spin text-slate-400" />
					</div>
				) : messages.length === 0 ? (
					<div className="rounded-lg bg-[#1E293B] p-4 text-sm leading-relaxed text-slate-300">
						Hola! Estoy lista para ayudarte a descubrir procesos.
						Puedes describir los procesos por texto, enviarme un
						audio, o subir un documento. ¿Qué sabes sobre esta
						empresa?
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{messages.map((msg) => (
							<div key={msg.id} className="flex flex-col gap-2">
								<div
									className={
										msg.role === "user"
											? "ml-8 self-end rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-white"
											: "mr-8 self-start rounded-lg rounded-bl-sm bg-[#1E293B] px-3 py-2 text-sm text-slate-200"
									}
								>
									{msg.content}
								</div>

								{/* Extraction cards */}
								{msg.extractedProcesses &&
									msg.extractedProcesses.length > 0 && (
										<div className="mr-8 flex flex-col gap-2 self-start">
											{msg.extractedProcesses.map(
												(proc, i) => (
													<ExtractionCard
														key={`${msg.id}-${i}`}
														process={proc}
														onAccept={
															handleAcceptProcess
														}
														onReject={() => {}}
														disabled={isLoading}
													/>
												),
											)}
										</div>
									)}
							</div>
						))}

						{isLoading && (
							<div className="mr-8 self-start rounded-lg bg-[#1E293B] px-4 py-2">
								<div className="flex items-center gap-2 text-sm text-slate-400">
									<Loader2Icon className="size-4 animate-spin" />
									Analizando...
								</div>
							</div>
						)}

						{isTranscribing && (
							<div className="mr-8 self-start rounded-lg bg-[#1E293B] px-4 py-2">
								<div className="flex items-center gap-2 text-sm text-slate-400">
									<Loader2Icon className="size-4 animate-spin" />
									Transcribiendo audio...
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* Input area */}
			<div className="border-t border-slate-700 p-4">
				{/* Action buttons */}
				<div className="mb-2 flex gap-2">
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={isTranscribing}
						className="flex items-center gap-1 rounded-md border border-slate-600 bg-[#1E293B] px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 disabled:opacity-50"
					>
						<MicIcon className="size-3" />
						Audio
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/mp3,audio/webm"
						onChange={handleAudioUpload}
						className="hidden"
					/>
					<button
						type="button"
						className="flex items-center gap-1 rounded-md border border-slate-600 bg-[#1E293B] px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200"
					>
						<PaperclipIcon className="size-3" />
						Archivo
					</button>
					<button
						type="button"
						className="flex items-center gap-1 rounded-md border border-slate-600 bg-[#1E293B] px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200"
					>
						<LinkIcon className="size-3" />
						Reunión
					</button>
				</div>

				{/* Text input */}
				<form onSubmit={handleSubmit} className="flex gap-2">
					<Textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Describe procesos, haz preguntas, o pega notas..."
						rows={1}
						className="min-h-[40px] flex-1 resize-none border-slate-600 bg-[#1E293B] text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary"
					/>
					<Button
						type="submit"
						size="icon"
						disabled={!input.trim() || isLoading}
						className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90"
					>
						<ArrowUpIcon className="size-4" />
					</Button>
				</form>
			</div>
		</div>
	);
}
