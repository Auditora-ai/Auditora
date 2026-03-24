"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquareIcon, SendIcon, MicIcon, MicOffIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import type { TranscriptEntry } from "../types";
import { getSpeakerColor } from "../lib/speaker-colors";
import { useLiveSessionContext } from "../context/LiveSessionContext";

interface TranscriptSectionProps {
	transcript: TranscriptEntry[];
}

export function TranscriptSection({ transcript }: TranscriptSectionProps) {
	const { sessionId } = useLiveSessionContext();
	const scrollRef = useRef<HTMLDivElement>(null);
	const prevCountRef = useRef(0);
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [listening, setListening] = useState(false);
	const recognitionRef = useRef<any>(null);

	// Auto-scroll on new entries
	useEffect(() => {
		if (transcript.length > prevCountRef.current && scrollRef.current) {
			requestAnimationFrame(() => {
				scrollRef.current?.scrollTo({
					top: scrollRef.current.scrollHeight,
					behavior: "smooth",
				});
			});
		}
		prevCountRef.current = transcript.length;
	}, [transcript.length]);

	const handleSend = useCallback(async () => {
		if (!message.trim() || !sessionId || sending) return;
		setSending(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: message.trim() }),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			setMessage("");
			toast.success("IA procesando indicacion...");
		} catch {
			toast.error("Error al enviar mensaje");
		} finally {
			setSending(false);
		}
	}, [message, sessionId, sending]);

	const toggleVoice = useCallback(() => {
		if (listening) {
			recognitionRef.current?.stop();
			setListening(false);
			return;
		}

		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) {
			toast.error("Dictado por voz no soportado en este navegador");
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = "es-MX";
		recognition.continuous = true;
		recognition.interimResults = true;
		recognitionRef.current = recognition;

		recognition.onresult = (event: any) => {
			let finalTranscript = "";
			let interimTranscript = "";
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const result = event.results[i];
				if (result.isFinal) {
					finalTranscript += result[0].transcript;
				} else {
					interimTranscript += result[0].transcript;
				}
			}
			if (finalTranscript) {
				setMessage((prev) => (prev + " " + finalTranscript).trim());
			}
		};

		recognition.onerror = () => {
			setListening(false);
		};

		recognition.onend = () => {
			setListening(false);
		};

		recognition.start();
		setListening(true);
	}, [listening]);

	return (
		<div className="flex flex-col overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-[#334155] px-3 py-2">
				<MessageSquareIcon className="h-3.5 w-3.5 text-[#64748B]" />
				<span className="text-xs font-medium text-[#94A3B8]">
					Transcripcion en vivo
				</span>
				{transcript.length > 0 && (
					<span className="ml-auto text-[10px] tabular-nums text-[#64748B]">
						{transcript.length}
					</span>
				)}
			</div>

			{/* Transcript list */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
				{transcript.length === 0 ? (
					<div className="flex h-full items-center justify-center p-4">
						<p className="text-center text-xs text-[#64748B]">
							Escribe o dicta indicaciones para el diagrama
						</p>
					</div>
				) : (
					<div className="space-y-0.5 p-2">
						{transcript.map((entry) => (
							<TranscriptLine key={entry.id} entry={entry} />
						))}
					</div>
				)}
			</div>

			{/* Chat input */}
			<div className="border-t border-[#334155] p-2">
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={toggleVoice}
						className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
							listening
								? "bg-red-500/20 text-red-400 animate-pulse"
								: "text-[#64748B] hover:bg-[#1E293B] hover:text-[#94A3B8]"
						}`}
						title={listening ? "Detener dictado" : "Dictado por voz"}
					>
						{listening ? <MicOffIcon className="h-3.5 w-3.5" /> : <MicIcon className="h-3.5 w-3.5" />}
					</button>
					<input
						type="text"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
						placeholder={listening ? "Escuchando..." : "Escribe una indicacion para la IA..."}
						className="flex-1 rounded-lg bg-[#1E293B] px-3 py-2 text-[11px] text-[#F1F5F9] placeholder-[#64748B] outline-none ring-1 ring-[#334155] focus:ring-[#2563EB]"
					/>
					<button
						type="button"
						onClick={handleSend}
						disabled={!message.trim() || sending}
						className="flex-shrink-0 rounded-lg bg-[#2563EB] p-2 text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-40"
					>
						{sending ? (
							<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
						) : (
							<SendIcon className="h-3.5 w-3.5" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

function TranscriptLine({ entry }: { entry: TranscriptEntry }) {
	const color = getSpeakerColor(entry.speaker);
	const time = formatTimestamp(entry.timestamp);
	const isManual = entry.source === "manual";

	return (
		<div className={`group rounded-lg px-2 py-1.5 transition-colors duration-75 hover:bg-[#1E293B] ${
			isManual ? "border-l-2 border-[#2563EB]/50 bg-[#2563EB]/5" : ""
		}`}>
			<div className="flex items-baseline gap-2">
				<span
					className="text-[10px] font-medium"
					style={{ color: isManual ? "#2563EB" : color }}
				>
					{isManual ? "Tu" : entry.speaker}
				</span>
				<span className="text-[10px] tabular-nums text-[#64748B]">{time}</span>
				{isManual && (
					<span className="text-[9px] text-[#2563EB]/60">chat</span>
				)}
			</div>
			<p className="mt-0.5 text-xs leading-relaxed text-[#E2E8F0]">
				{entry.text}
			</p>
		</div>
	);
}

function formatTimestamp(ts: number): string {
	if (!ts) return "";
	const date = new Date(ts);
	const h = date.getHours().toString().padStart(2, "0");
	const m = date.getMinutes().toString().padStart(2, "0");
	const s = date.getSeconds().toString().padStart(2, "0");
	return `${h}:${m}:${s}`;
}
