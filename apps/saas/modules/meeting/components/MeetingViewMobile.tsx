"use client";

import { useEffect, useRef, useState } from "react";
import {
	MicIcon,
	MicOffIcon,
	PhoneOffIcon,
	SparklesIcon,
	MonitorIcon,
	Loader2Icon,
	WifiIcon,
	WifiOffIcon,
	SendIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import { getSpeakerColor } from "../lib/speaker-colors";
import type { TranscriptEntry } from "../types";
import { toast } from "sonner";

/**
 * Mobile-optimized MeetingView for live sessions.
 *
 * Shows a simplified UI focused on the transcript — the most useful
 * thing on mobile during a live session. No BPMN canvas.
 * The facilitator uses desktop; this is for participants on their phone.
 */
export function MeetingViewMobile() {
	const {
		sessionId,
		sessionStatus,
		connectionStatus,
		transcript,
		nodes,
		endSession,
	} = useLiveSessionContext();

	// Duration timer
	const [elapsed, setElapsed] = useState(0);
	const startRef = useRef(Date.now());

	useEffect(() => {
		if (sessionStatus !== "ACTIVE") return;
		const interval = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
		}, 1000);
		return () => clearInterval(interval);
	}, [sessionStatus]);

	const formatDuration = (secs: number) => {
		const h = Math.floor(secs / 3600);
		const m = Math.floor((secs % 3600) / 60);
		const s = secs % 60;
		if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
		return `${m}:${String(s).padStart(2, "0")}`;
	};

	// Auto-scroll transcript
	const scrollRef = useRef<HTMLDivElement>(null);
	const prevCountRef = useRef(0);

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

	// Last extracted node for floating chip
	const lastNode = nodes.length > 0 ? nodes[nodes.length - 1] : null;
	const [showChip, setShowChip] = useState(false);
	const prevNodesLenRef = useRef(0);

	useEffect(() => {
		if (nodes.length > prevNodesLenRef.current && nodes.length > 0) {
			setShowChip(true);
			const timer = setTimeout(() => setShowChip(false), 4000);
			prevNodesLenRef.current = nodes.length;
			return () => clearTimeout(timer);
		}
		prevNodesLenRef.current = nodes.length;
	}, [nodes.length]);

	// Microphone (browser speech recognition for manual input)
	const [listening, setListening] = useState(false);
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [interimText, setInterimText] = useState("");
	const recognitionRef = useRef<any>(null);
	const wantsListeningRef = useRef(false);

	const toggleVoice = () => {
		if (listening) {
			wantsListeningRef.current = false;
			recognitionRef.current?.stop();
			setListening(false);
			setInterimText("");
			return;
		}

		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) {
			toast.error("Voice dictation not supported in this browser");
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

		recognition.onerror = (event: any) => {
			if (event.error === "not-allowed" || event.error === "service-not-allowed") {
				toast.error("Microphone permission denied");
				wantsListeningRef.current = false;
				setListening(false);
			}
		};

		recognition.onend = () => {
			if (wantsListeningRef.current) {
				try {
					recognition.start();
				} catch {
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
			toast.success("Microphone active", { duration: 2000 });
		} catch {
			toast.error("Could not start dictation");
			wantsListeningRef.current = false;
		}
	};

	const handleSend = async () => {
		if (!message.trim() || !sessionId || sending) return;
		const text = message.trim();
		setSending(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text }),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			setMessage("");
		} catch {
			toast.error("Failed to send message");
		} finally {
			setSending(false);
		}
	};

	// Status indicator
	const statusColor =
		sessionStatus === "ACTIVE"
			? "bg-green-500"
			: sessionStatus === "CONNECTING"
				? "bg-amber-500"
				: "bg-red-500";

	const connectionIcon =
		connectionStatus === "connected" ? (
			<WifiIcon className="h-4 w-4 text-green-400" />
		) : connectionStatus === "reconnecting" ? (
			<WifiIcon className="h-4 w-4 text-amber-400 animate-pulse" />
		) : (
			<WifiOffIcon className="h-4 w-4 text-red-400" />
		);

	return (
		<div className="flex h-[100dvh] flex-col bg-chrome-base text-chrome-text">
			{/* ─── Header ─── */}
			<header className="flex items-center justify-between border-b border-chrome-border bg-chrome-raised px-4 py-3">
				<div className="flex items-center gap-3 min-w-0">
					<div className="flex items-center gap-2">
						<span className={`h-2.5 w-2.5 rounded-full ${statusColor} ${sessionStatus === "ACTIVE" ? "animate-pulse" : ""}`} />
						{connectionIcon}
					</div>
					<div className="min-w-0">
						<h1 className="truncate text-sm font-semibold text-chrome-text">
							Live Session
						</h1>
						<p className="text-xs text-chrome-text-muted">
							{sessionStatus === "ACTIVE" ? "Recording" : sessionStatus}
						</p>
					</div>
				</div>
				<div className="flex-shrink-0 rounded-full bg-chrome-base px-3 py-1">
					<span className="text-sm font-mono tabular-nums text-chrome-text-secondary">
						{formatDuration(elapsed)}
					</span>
				</div>
			</header>

			{/* ─── Info banner (no BPMN on mobile) ─── */}
			<div className="flex items-center gap-2 border-b border-chrome-border bg-chrome-base/80 px-4 py-2">
				<MonitorIcon className="h-4 w-4 flex-shrink-0 text-chrome-text-muted" />
				<p className="text-xs text-chrome-text-muted">
					Diagram is being built in real-time. View it on desktop.
				</p>
			</div>

			{/* ─── Floating chip for new nodes ─── */}
			{showChip && lastNode && (
				<div className="absolute left-4 right-4 top-[120px] z-30 animate-in slide-in-from-top-2 fade-in duration-300">
					<div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 shadow-lg backdrop-blur-sm">
						<SparklesIcon className="h-4 w-4 flex-shrink-0 text-primary" />
						<span className="truncate text-sm font-medium text-primary">
							New: {lastNode.label}
						</span>
					</div>
				</div>
			)}

			{/* ─── Transcript (main content) ─── */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto">
				{transcript.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 p-6">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-chrome-raised">
							<MicIcon className="h-8 w-8 text-chrome-text-muted" />
						</div>
						<p className="text-center text-sm text-chrome-text-muted">
							Waiting for the session to begin...
						</p>
						<p className="text-center text-xs text-chrome-text-muted">
							The transcript will appear here as people speak.
						</p>
					</div>
				) : (
					<div className="space-y-1 p-4">
						{transcript.map((entry) => (
							<MobileTranscriptLine key={entry.id} entry={entry} />
						))}
					</div>
				)}
			</div>

			{/* ─── Chat input ─── */}
			<div className="border-t border-chrome-border bg-chrome-raised px-4 py-2">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={toggleVoice}
						className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
							listening
								? "bg-red-500/20 text-red-400 animate-pulse"
								: "bg-chrome-base text-chrome-text-muted active:bg-chrome-hover"
						}`}
						aria-label={listening ? "Stop dictation" : "Start dictation"}
					>
						{listening ? <MicOffIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />}
					</button>
					<input
						type="text"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
						placeholder={
							listening
								? interimText || "Listening... speak now"
								: "Type a message for the AI..."
						}
						className={`flex-1 rounded-xl bg-chrome-base px-4 py-3 text-sm text-chrome-text outline-none ring-1 focus:ring-primary ${
							listening ? "ring-red-500/50 placeholder-chrome-text-secondary" : "ring-chrome-border placeholder-chrome-text-muted"
						}`}
					/>
					<button
						type="button"
						onClick={handleSend}
						disabled={!message.trim() || sending}
						className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors active:bg-action-hover disabled:opacity-40"
						aria-label="Send message"
					>
						{sending ? (
							<Loader2Icon className="h-5 w-5 animate-spin" />
						) : (
							<SendIcon className="h-5 w-5" />
						)}
					</button>
				</div>
			</div>

			{/* ─── Bottom toolbar ─── */}
			<div className="flex items-center justify-between border-t border-chrome-border bg-chrome-raised px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
				{/* Mic toggle */}
				<button
					type="button"
					onClick={toggleVoice}
					className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
						listening
							? "bg-red-500 text-white"
							: "bg-chrome-base text-chrome-text-secondary active:bg-chrome-hover"
					}`}
					aria-label={listening ? "Stop microphone" : "Start microphone"}
				>
					{listening ? <MicOffIcon className="h-6 w-6" /> : <MicIcon className="h-6 w-6" />}
				</button>

				{/* Node count badge */}
				<div className="flex items-center gap-2 rounded-full bg-chrome-base px-4 py-2">
					<SparklesIcon className="h-4 w-4 text-primary" />
					<span className="text-sm font-medium tabular-nums text-chrome-text-secondary">
						{nodes.length} node{nodes.length !== 1 ? "s" : ""} extracted
					</span>
				</div>

				{/* End Session */}
				<Button
					variant="destructive"
					size="sm"
					onClick={endSession}
					className="flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-medium"
				>
					<PhoneOffIcon className="h-5 w-5" />
					End
				</Button>
			</div>
		</div>
	);
}

/* ─── Mobile transcript line ─── */
function MobileTranscriptLine({ entry }: { entry: TranscriptEntry }) {
	const color = getSpeakerColor(entry.speaker);
	const time = formatTime(entry.timestamp);
	const isManual = entry.source === "manual";
	const corrected = entry.correctedText;
	const isAiResult = isManual && corrected && (corrected.startsWith("[✓") || corrected.startsWith("[—") || corrected.startsWith("[ERROR"));
	const displayText = isAiResult ? entry.text : (corrected || entry.text);
	const aiStatus = isAiResult ? corrected : null;

	return (
		<div className="rounded-xl px-3 py-2.5 active:bg-chrome-raised transition-colors">
			<div className="flex items-baseline gap-2">
				<span
					className="text-xs font-semibold"
					style={{ color: isManual ? "#3B8FE8" : color }}
				>
					{isManual ? "You" : entry.speaker}
				</span>
				<span className="text-[11px] tabular-nums text-chrome-text-muted">{time}</span>
				{isManual && <span className="text-[10px] text-primary/60">chat</span>}
			</div>
			<p className="mt-1 text-sm leading-relaxed text-chrome-text-secondary">
				{displayText}
			</p>
			{aiStatus && (
				<span className={`mt-1 block text-xs ${
					aiStatus.startsWith("[✓") ? "text-green-400" :
					aiStatus.startsWith("[ERROR") ? "text-red-400" :
					"text-chrome-text-muted"
				}`}>
					{aiStatus}
				</span>
			)}
			{isManual && !aiStatus && !corrected && (
				<span className="mt-1 block text-xs text-chrome-text-muted animate-pulse">processing...</span>
			)}
		</div>
	);
}

function formatTime(ts: number): string {
	if (!ts) return "";
	const date = new Date(ts);
	const h = date.getHours().toString().padStart(2, "0");
	const m = date.getMinutes().toString().padStart(2, "0");
	return `${h}:${m}`;
}
