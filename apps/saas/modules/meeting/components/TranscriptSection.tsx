"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	MessageSquareIcon,
	SendIcon,
	MicIcon,
	MicOffIcon,
	Loader2Icon,
	PencilIcon,
	TrashIcon,
	CheckIcon,
	XIcon,
	EyeOffIcon,
} from "lucide-react";
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
	const [processingText, setProcessingText] = useState<string | null>(null);
	const [interimText, setInterimText] = useState("");
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
		const text = message.trim();
		setSending(true);
		setProcessingText(text);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text }),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			setMessage("");
			// Keep processingText visible for a few seconds to show AI is working
			setTimeout(() => setProcessingText(null), 8000);
		} catch {
			toast.error("Error al enviar mensaje");
			setProcessingText(null);
		} finally {
			setSending(false);
		}
	}, [message, sessionId, sending]);

	const wantsListeningRef = useRef(false);

	const toggleVoice = useCallback(() => {
		if (listening) {
			wantsListeningRef.current = false;
			recognitionRef.current?.stop();
			setListening(false);
			setInterimText("");
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
		wantsListeningRef.current = true;

		recognition.onresult = (event: any) => {
			let finalTranscript = "";
			let interim = "";
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const result = event.results[i];
				if (result.isFinal) {
					finalTranscript += result[0].transcript;
				} else {
					interim += result[0].transcript;
				}
			}
			if (finalTranscript) {
				setMessage((prev) => (prev + " " + finalTranscript).trim());
				setInterimText("");
			} else if (interim) {
				setInterimText(interim);
			}
		};

		recognition.onaudiostart = () => {
			toast.success("Microfono activo — habla ahora", { duration: 2000 });
		};

		recognition.onerror = (event: any) => {
			console.error("[Voice] Recognition error:", event.error);
			if (event.error === "not-allowed" || event.error === "service-not-allowed") {
				toast.error("Permiso de microfono denegado");
				wantsListeningRef.current = false;
				setListening(false);
			}
			// For other errors (network, no-speech), onend will auto-restart
		};

		recognition.onend = () => {
			// Auto-restart if user still wants to listen (browser stops after silence)
			if (wantsListeningRef.current) {
				try {
					recognition.start();
				} catch {
					// Already started or destroyed
					setListening(false);
					wantsListeningRef.current = false;
				}
				return;
			}
			setListening(false);
		};

		try {
			recognition.start();
			setListening(true);
		} catch {
			toast.error("No se pudo iniciar el dictado");
			wantsListeningRef.current = false;
		}
	}, [listening]);

	return (
		<div className="flex h-full flex-col overflow-hidden">
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
							<TranscriptLine
								key={entry.id}
								entry={entry}
								sessionId={sessionId}
							/>
						))}
						{processingText && (
							<div className="rounded-lg px-2 py-1.5 animate-pulse">
								<div className="flex items-baseline gap-2">
									<span className="text-[10px] font-medium text-[#7C3AED]">IA</span>
									<Loader2Icon className="h-2.5 w-2.5 animate-spin text-[#64748B]" />
									<span className="text-[10px] text-[#64748B]">analizando</span>
								</div>
								<p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">{processingText}</p>
							</div>
						)}
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
						placeholder={
							listening
								? interimText || "Escuchando... habla ahora"
								: "Escribe una indicacion para la IA..."
						}
						className={`flex-1 rounded-lg bg-[#1E293B] px-3 py-2 text-[11px] text-[#F1F5F9] outline-none ring-1 focus:ring-[#2563EB] ${
							listening ? "ring-red-500/50 placeholder-[#94A3B8]" : "ring-[#334155] placeholder-[#64748B]"
						}`}
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

function TranscriptLine({ entry, sessionId }: { entry: TranscriptEntry; sessionId: string }) {
	const color = getSpeakerColor(entry.speaker);
	const time = formatTimestamp(entry.timestamp);
	const isManual = entry.source === "manual";
	const isEdited = !!entry.correctedText;
	const displayText = entry.correctedText || entry.text;

	const [editing, setEditing] = useState(false);
	const [editText, setEditText] = useState(displayText);
	const [saving, setSaving] = useState(false);
	const [hidden, setHidden] = useState(false);

	const handleEdit = async () => {
		if (!editText.trim()) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ entryId: entry.id, correctedText: editText.trim() }),
			});
			if (!res.ok) throw new Error();
			setEditing(false);
			toast.success("Texto corregido");
		} catch {
			toast.error("Error al editar");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setSaving(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ entryId: entry.id }),
			});
			if (!res.ok) throw new Error();
			setHidden(true);
			toast.success("Entrada eliminada");
		} catch {
			toast.error("Error al eliminar");
		} finally {
			setSaving(false);
		}
	};

	const handleIgnore = async () => {
		// Mark as ignored by setting correctedText to "[IGNORADO]"
		setSaving(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ entryId: entry.id, correctedText: "[IGNORADO]" }),
			});
			if (!res.ok) throw new Error();
			setHidden(true);
			toast.success("La IA ignorara esta entrada");
		} catch {
			toast.error("Error");
		} finally {
			setSaving(false);
		}
	};

	if (hidden) return null;

	return (
		<div className="group rounded-lg px-2 py-1.5 transition-colors duration-75 hover:bg-[#1E293B]">
			<div className="flex items-baseline gap-2">
				<span
					className="text-[10px] font-medium"
					style={{ color: isManual ? "#2563EB" : color }}
				>
					{isManual ? "Tu" : entry.speaker}
				</span>
				<span className="text-[10px] tabular-nums text-[#64748B]">{time}</span>
				{isManual && <span className="text-[9px] text-[#2563EB]/60">chat</span>}
				{isEdited && <span className="text-[9px] text-amber-500/60">editado</span>}

				{/* Action buttons — visible on hover */}
				<div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
					<button type="button" onClick={() => { setEditing(true); setEditText(displayText); }} className="rounded p-0.5 text-[#64748B] hover:text-white" title="Editar">
						<PencilIcon className="h-2.5 w-2.5" />
					</button>
					<button type="button" onClick={handleIgnore} disabled={saving} className="rounded p-0.5 text-[#64748B] hover:text-amber-400" title="Ignorar">
						<EyeOffIcon className="h-2.5 w-2.5" />
					</button>
					<button type="button" onClick={handleDelete} disabled={saving} className="rounded p-0.5 text-[#64748B] hover:text-red-400" title="Eliminar">
						<TrashIcon className="h-2.5 w-2.5" />
					</button>
				</div>
			</div>

			{editing ? (
				<div className="mt-1 flex gap-1">
					<input
						type="text"
						value={editText}
						onChange={(e) => setEditText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleEdit();
							if (e.key === "Escape") setEditing(false);
						}}
						autoFocus
						className="flex-1 rounded bg-[#1E293B] px-2 py-1 text-[11px] text-[#F1F5F9] outline-none ring-1 ring-[#334155] focus:ring-[#2563EB]"
					/>
					<button type="button" onClick={handleEdit} disabled={saving} className="rounded bg-[#2563EB] p-1 text-white disabled:opacity-50">
						{saving ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
					</button>
					<button type="button" onClick={() => setEditing(false)} className="rounded bg-[#334155] p-1 text-[#94A3B8]">
						<XIcon className="h-3 w-3" />
					</button>
				</div>
			) : (
				<p className="mt-0.5 text-xs leading-relaxed text-[#E2E8F0]">
					{displayText}
				</p>
			)}
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
