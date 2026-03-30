"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SendIcon, MicIcon, Loader2Icon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import {
	ExtractionCard,
	type ExtractedProcessData,
} from "@discovery/components/ExtractionCard";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	extractedProcesses?: ExtractedProcessData[];
}

interface DiscoveryChatProps {
	organizationId: string;
	initialMessage?: string;
	onProcessAccepted: () => void;
	onProcessRejected?: () => void;
}

export function DiscoveryChat({
	organizationId,
	initialMessage,
	onProcessAccepted,
	onProcessRejected,
}: DiscoveryChatProps) {
	const tv = useTranslations("scan");
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [threadId, setThreadId] = useState<string | null>(null);
	const [initialLoading, setInitialLoading] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const lastExtractionTime = useRef(0);
	const initialMessageSent = useRef(false);

	// Load existing thread
	useEffect(() => {
		async function loadThread() {
			try {
				const params = new URLSearchParams({ organizationId });
				const res = await fetch(`/api/discovery/chat?${params.toString()}`);
				if (res.ok) {
					const data = await res.json();
					setThreadId(data.thread.id);
					if (data.thread.messages.length > 0) {
						setMessages(
							data.thread.messages.map(
								(m: { id: string; role: string; content: string; extractedProcesses?: ExtractedProcessData[] }) => ({
									id: m.id,
									role: m.role as "user" | "assistant",
									content: m.content,
									extractedProcesses: m.extractedProcesses ?? undefined,
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
	}, [organizationId]);

	// Send initial context message once thread is loaded
	useEffect(() => {
		if (!initialLoading && initialMessage && !initialMessageSent.current && messages.length === 0) {
			initialMessageSent.current = true;
			sendMessage(initialMessage);
		}
	}, [initialLoading, initialMessage, messages.length]);

	// Auto-scroll
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const sendMessage = useCallback(
		async (text: string) => {
			if (!text.trim() || isLoading) return;

			const now = Date.now();
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
						organizationId,
						message: text,
						threadId,
					}),
				});

				if (!res.ok) throw new Error("Chat request failed");

				const data = await res.json();
				setThreadId(data.threadId);

				if (now - lastExtractionTime.current > 10000) {
					lastExtractionTime.current = Date.now();
				}

				const assistantMsg: Message = {
					id: data.message.id,
					role: "assistant",
					content: data.message.content,
					extractedProcesses: data.extractedProcesses?.length > 0 ? data.extractedProcesses : undefined,
				};
				setMessages((prev) => [...prev, assistantMsg]);
			} catch (error) {
				console.error("Chat error:", error);
				setMessages((prev) => [
					...prev,
					{ id: `error-${now}`, role: "assistant", content: tv("discovery.chatError") },
				]);
			} finally {
				setIsLoading(false);
			}
		},
		[isLoading, organizationId, threadId, tv],
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

	const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

			if (!res.ok) throw new Error("Transcription failed");

			const data = await res.json();
			const textToSend = data.chunks ? data.chunks[data.chunks.length - 1] : data.transcript;
			await sendMessage(textToSend);
		} catch (error) {
			console.error("Audio upload error:", error);
		} finally {
			setIsTranscribing(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleAcceptProcess = async (process: ExtractedProcessData) => {
		try {
			const res = await fetch("/api/discovery/accept", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId, process }),
			});

			if (!res.ok) {
				const error = await res.json();
				if (error.error === "duplicate") {
					// Could show toast
				}
				return;
			}

			onProcessAccepted();
		} catch (error) {
			console.error("Accept process error:", error);
		}
	};

	const handleRejectProcess = async (process: ExtractedProcessData) => {
		if (!threadId) return;
		try {
			await fetch("/api/discovery/reject", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ threadId, processName: process.name }),
			});
			onProcessRejected?.();
		} catch (error) {
			console.error("Reject process error:", error);
		}
	};

	return (
		<div className="flex flex-1 flex-col">
			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
				<div className="mx-auto max-w-2xl">
					{initialLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
						</div>
					) : messages.length === 0 && !initialMessage ? (
						<div className="rounded-xl border border-border bg-secondary p-4 text-sm leading-relaxed text-muted-foreground">
							{tv("discovery.chatWelcome")}
						</div>
					) : (
						<div className="flex flex-col gap-3">
							{messages.map((msg) => (
								<div key={msg.id} className="flex flex-col gap-2">
									<div
										className={
											msg.role === "user"
												? "ml-8 self-end rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground"
												: "mr-8 self-start rounded-2xl rounded-bl-sm border border-border bg-secondary px-4 py-3 text-sm text-foreground"
										}
									>
										{msg.content}
									</div>

									{/* Extraction cards */}
									{msg.extractedProcesses && msg.extractedProcesses.length > 0 && (
										<div className="mr-8 flex flex-col gap-2 self-start">
											{msg.extractedProcesses.map((proc, i) => (
												<ExtractionCard
													key={`${msg.id}-${i}`}
													process={proc}
													onAccept={handleAcceptProcess}
													onReject={handleRejectProcess}
													disabled={isLoading}
												/>
											))}
										</div>
									)}
								</div>
							))}

							{isLoading && (
								<div className="mr-8 self-start rounded-2xl border border-border bg-secondary px-4 py-3">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Loader2Icon className="size-4 animate-spin" />
										{tv("discovery.analyzing")}
									</div>
								</div>
							)}

							{isTranscribing && (
								<div className="mr-8 self-start rounded-2xl border border-border bg-secondary px-4 py-3">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Loader2Icon className="size-4 animate-spin" />
										{tv("discovery.transcribing")}
									</div>
								</div>
							)}

							<div ref={messagesEndRef} />
						</div>
					)}
				</div>
			</div>

			{/* Input area */}
			<div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
				<div className="mx-auto max-w-2xl">
					{/* Action buttons */}
					<div className="mb-2 flex gap-2">
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={isTranscribing}
							className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
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
					</div>

					{/* Text input */}
					<form onSubmit={handleSubmit} className="flex gap-2">
						<Textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={tv("discovery.chatPlaceholder")}
							rows={1}
							className="min-h-[44px] max-h-32 flex-1 resize-none"
						/>
						<Button
							type="submit"
							size="icon"
							disabled={!input.trim() || isLoading}
							className="size-11 shrink-0"
						>
							<SendIcon className="size-4" />
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
