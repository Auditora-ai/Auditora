"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2Icon, AlertTriangleIcon, ShareIcon } from "lucide-react";
import type { InterviewCompletionStatus } from "@ai-interview/lib/interview-types";

interface InterviewRevealProps {
	sessionId: string;
	shareToken?: string;
	onComplete: (data: InterviewCompletionStatus) => void;
}

const STEP_LABELS: Record<string, string> = {
	knowledge: "Extrayendo conocimiento...",
	diagram: "Construyendo diagrama...",
	layout: "Organizando proceso...",
	risks: "Analizando riesgos...",
	complete: "¡Listo!",
};

export function InterviewReveal({ sessionId, shareToken, onComplete }: InterviewRevealProps) {
	const [status, setStatus] = useState<InterviewCompletionStatus>({
		status: "processing",
		step: "knowledge",
		progress: 0,
	});

	const pollStatus = useCallback(async () => {
		try {
			const res = await fetch(`/api/sessions/interview/${sessionId}/status`);
			const data = await res.json();
			setStatus(data);

			if (data.status === "done") {
				onComplete(data);
			}
		} catch {
			// Silent retry
		}
	}, [sessionId, onComplete]);

	useEffect(() => {
		// Start pipeline
		fetch(`/api/sessions/interview/${sessionId}/complete`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
		}).catch(() => {});

		// Poll for status
		const interval = setInterval(pollStatus, 2000);
		return () => clearInterval(interval);
	}, [sessionId, pollStatus]);

	if (status.status === "error") {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center gap-4" style={{ backgroundColor: "#FFFBF5" }}>
				<AlertTriangleIcon className="size-12" style={{ color: "#DC2626" }} />
				<p className="text-center text-sm" style={{ color: "#0A1428" }}>
					{status.error || "Error generando resultados"}
				</p>
				<button
					onClick={() => {
						setStatus({ status: "processing", step: "knowledge", progress: 0 });
						fetch(`/api/sessions/interview/${sessionId}/complete`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
						}).catch(() => {});
					}}
					className="rounded-md px-4 py-2 text-sm font-medium text-white"
					style={{ backgroundColor: "#00E5C0" }}
				>
					Reintentar
				</button>
			</div>
		);
	}

	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center gap-6" style={{ backgroundColor: "#FFFBF5" }}>
			<Loader2Icon className="size-12 animate-spin" style={{ color: "#D97706" }} />

			<div className="text-center">
				<p
					className="text-lg font-medium"
					style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: "#0A1428" }}
				>
					Generando tu radiografía de proceso
				</p>
				<p className="mt-1 text-sm" style={{ color: "#78716C" }}>
					{STEP_LABELS[status.step || "knowledge"]}
				</p>
			</div>

			{/* Progress bar */}
			<div className="w-64">
				<div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#E7E5E4" }}>
					<div
						className="h-full rounded-full transition-all"
						style={{
							width: `${status.progress || 0}%`,
							backgroundColor: "#D97706",
							transitionDuration: "500ms",
						}}
					/>
				</div>
				<p className="mt-1 text-center text-xs" style={{ color: "#94A3B8" }}>
					{status.progress || 0}%
				</p>
			</div>
		</div>
	);
}
