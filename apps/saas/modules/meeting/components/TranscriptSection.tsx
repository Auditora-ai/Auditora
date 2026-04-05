"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { useTranslations } from "next-intl";
import { useLiveSessionContext } from "../context/LiveSessionContext";

interface TranscriptSectionProps {
	transcript: TranscriptEntry[];
}

export function TranscriptSection({ transcript }: TranscriptSectionProps) {
	const { sessionId } = useLiveSessionContext();
	const t = useTranslations("meetingModule");
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
			toast.error(t("errorSendMessage"));
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
			{/* Transcript list */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
				{transcript.length === 0 ? (
					<div className="flex h-full items-center justify-center p-4">
						<p className="text-center text-xs text-chrome-text-muted">
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
									<span className="text-[10px] font-medium text-violet-600">IA</span>
									<Loader2Icon className="h-3.5 w-3.5 animate-spin text-chrome-text-muted" />
									<span className="text-[10px] text-chrome-text-muted">analizando</span>
								</div>
								<p className="mt-0.5 text-xs leading-relaxed text-chrome-text-secondary">{processingText}</p>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Chat input */}
			<div className="border-t border-chrome-border p-2">
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={toggleVoice}
						className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
							listening
								? "bg-red-500/20 text-red-400 animate-pulse"
								: "text-chrome-text-muted hover:bg-chrome-raised hover:text-chrome-text-secondary"
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
						className={`flex-1 rounded-lg bg-chrome-raised px-3 py-2 text-[11px] text-chrome-text outline-none ring-1 focus:ring-primary ${
							listening ? "ring-red-500/50 placeholder-chrome-text-secondary" : "ring-chrome-border placeholder-chrome-text-muted"
						}`}
					/>
					<button
						type="button"
						onClick={handleSend}
						disabled={!message.trim() || sending}
						className="flex-shrink-0 rounded-lg bg-primary p-2 text-white transition-colors hover:bg-action-hover disabled:opacity-40"
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
	const t = useTranslations("meetingModule");
	const tc = useTranslations("common");
	const color = getSpeakerColor(entry.speaker);
	const time = formatTimestamp(entry.timestamp);
	const isManual = entry.source === "manual";
	const corrected = entry.correctedText;
	const isAiResult = isManual && corrected && (corrected.startsWith("[✓") || corrected.startsWith("[—") || corrected.startsWith("[ERROR"));
	const isEdited = !!corrected && !isAiResult;
	const displayText = isAiResult ? entry.text : (corrected || entry.text);
	const aiStatus = isAiResult ? corrected : null;

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
			toast.error(t("errorEdit"));
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
			toast.error(t("errorDelete"));
		} finally {
			setSaving(false);
		}
	};

	const handleRetry = async () => {
		setSaving(true);
		try {
			// Clear the AI result and re-send the text
			await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ entryId: entry.id, correctedText: "" }),
			});
			// Re-trigger extraction by posting the same text again
			await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: entry.text }),
			});
			toast.success("Re-procesando...");
		} catch {
			toast.error(t("errorRetry"));
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
		<div className="group rounded-lg px-2 py-1.5 transition-colors duration-75 hover:bg-chrome-raised">
			<div className="flex items-baseline gap-2">
				<span
					className="text-[10px] font-medium"
					style={{ color: isManual ? "var(--primary)" : color }}
				>
					{isManual ? "Tu" : entry.speaker}
				</span>
				<span className="text-[10px] tabular-nums text-chrome-text-muted">{time}</span>
				{isManual && <span className="text-[9px] text-primary/60">chat</span>}
				{isEdited && <span className="text-[9px] text-amber-500/60">editado</span>}

				{/* Action buttons — visible on hover */}
				<div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
					<button type="button" onClick={() => { setEditing(true); setEditText(displayText); }} className="rounded p-0.5 text-chrome-text-muted hover:text-white" title={tc("edit")}>
						<PencilIcon className="h-3.5 w-3.5" />
					</button>
					<button type="button" onClick={handleIgnore} disabled={saving} className="rounded p-0.5 text-chrome-text-muted hover:text-amber-400" title="Ignorar">
						<EyeOffIcon className="h-3.5 w-3.5" />
					</button>
					<button type="button" onClick={handleDelete} disabled={saving} className="rounded p-0.5 text-chrome-text-muted hover:text-red-400" title={tc("delete")}>
						<TrashIcon className="h-3.5 w-3.5" />
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
						className="flex-1 rounded bg-chrome-raised px-2 py-1 text-[11px] text-chrome-text outline-none ring-1 ring-chrome-border focus:ring-primary"
					/>
					<button type="button" onClick={handleEdit} disabled={saving} className="rounded bg-primary p-1 text-white disabled:opacity-50">
						{saving ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <CheckIcon className="h-3.5 w-3.5" />}
					</button>
					<button type="button" onClick={() => setEditing(false)} className="rounded bg-chrome-hover p-1 text-chrome-text-secondary">
						<XIcon className="h-3.5 w-3.5" />
					</button>
				</div>
			) : (
				<>
					<p className="mt-0.5 text-xs leading-relaxed text-chrome-text-secondary">
						{displayText}
					</p>
					{aiStatus && (
						<div className="mt-1 flex items-center gap-1.5">
							<span className={`text-[10px] ${
								aiStatus.startsWith("[✓") ? "text-green-400" :
								aiStatus.startsWith("[ERROR") ? "text-red-400" :
								"text-chrome-text-muted"
							}`}>
								{aiStatus}
							</span>
							<button
								type="button"
								onClick={handleRetry}
								disabled={saving}
								className="text-[9px] text-chrome-text-muted hover:text-primary"
								title="Re-procesar con IA"
							>
								↻ reintentar
							</button>
						</div>
					)}
					{isManual && !aiStatus && !isEdited && (
						<span className="mt-0.5 block text-[10px] text-chrome-text-muted animate-pulse">procesando...</span>
					)}
				</>
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
