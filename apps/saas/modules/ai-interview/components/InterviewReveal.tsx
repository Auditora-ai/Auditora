"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2Icon, AlertTriangleIcon } from "lucide-react";
import type { InterviewCompletionStatus } from "@ai-interview/lib/interview-types";
import { Button } from "@repo/ui/components/button";
import { Progress } from "@repo/ui/components/progress";
import { Card, CardContent } from "@repo/ui/components/card";

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
			<div className="flex min-h-[400px] flex-col items-center justify-center gap-4 bg-background">
				<AlertTriangleIcon className="size-12 text-destructive" />
				<p className="text-center text-sm text-foreground">
					{status.error || "Error generando resultados"}
				</p>
				<Button
					variant="default"
					onClick={() => {
						setStatus({ status: "processing", step: "knowledge", progress: 0 });
						fetch(`/api/sessions/interview/${sessionId}/complete`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
						}).catch(() => {});
					}}
					className="min-h-[48px]"
				>
					Reintentar
				</Button>
			</div>
		);
	}

	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center gap-6 bg-background">
			<Loader2Icon className="size-12 animate-spin text-primary" />

			<div className="text-center">
				<p className="text-lg font-medium text-foreground">
					Generando tu radiografía de proceso
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					{STEP_LABELS[status.step || "knowledge"]}
				</p>
			</div>

			{/* Progress bar */}
			<Card size="sm" className="w-64 shadow-none bg-transparent border-none">
				<CardContent className="px-0 py-0">
					<Progress value={status.progress || 0} className="h-2" />
					<p className="mt-1 text-center text-xs text-muted-foreground">
						{status.progress || 0}%
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
