"use client";

import { useState, useEffect, useCallback } from "react";
import { LinkIcon, CopyIcon, CheckIcon, Loader2Icon } from "lucide-react";

export function ClientIntakeCard({
	intakeToken,
	intakeStatus: initialStatus,
	intakeResponseCount,
	onGenerate,
}: {
	intakeToken: string | null;
	intakeStatus: string | null;
	intakeResponseCount: number;
	onGenerate: () => void;
}) {
	const [copied, setCopied] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [intakeStatus, setIntakeStatus] = useState(initialStatus);
	const [progress, setProgress] = useState({ answered: 0, total: intakeResponseCount });
	const [origin, setOrigin] = useState("");

	useEffect(() => { setOrigin(window.location.origin); }, []);

	// Polling for intake updates (every 15s when intake is active and not complete)
	useEffect(() => {
		if (!intakeToken || intakeResponseCount === 0 || intakeStatus === "complete") return;

		const poll = async () => {
			try {
				const res = await fetch(`/api/intake/${intakeToken}`);
				if (res.ok) {
					const data = await res.json();
					const questions = data.questions ?? [];
					const answered = questions.filter((q: { response: string | null }) => q.response !== null).length;
					const total = questions.length;
					setProgress({ answered, total });

					if (answered === 0) setIntakeStatus("pending");
					else if (answered >= total) setIntakeStatus("complete");
					else setIntakeStatus("partial");
				}
			} catch { /* silent */ }
		};

		poll(); // Initial
		const id = setInterval(poll, 15_000);
		return () => clearInterval(id);
	}, [intakeToken, intakeResponseCount, intakeStatus]);

	const intakeUrl = intakeToken
		? `${origin}/intake/${intakeToken}`
		: null;

	const handleCopy = useCallback(async () => {
		if (!intakeUrl) return;
		await navigator.clipboard.writeText(intakeUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [intakeUrl]);

	const handleGenerate = useCallback(async () => {
		setGenerating(true);
		try {
			await onGenerate();
		} finally {
			setGenerating(false);
		}
	}, [onGenerate]);

	// No intake generated yet
	if (intakeResponseCount === 0) {
		return (
			<div className="rounded-xl border border-dashed border-blue-300 bg-accent p-5">
				<div className="mb-1 flex items-center gap-2">
					<LinkIcon className="h-4 w-4 text-primary" />
					<span className="text-sm font-semibold text-primary">Link para el Cliente</span>
				</div>
				<p className="mb-3 text-xs text-chrome-text-muted">
					Genera un link con preguntas específicas para que el cliente prepare información.
				</p>
				<button
					type="button"
					onClick={handleGenerate}
					disabled={generating}
					className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-action-hover disabled:opacity-50"
				>
					{generating ? (
						<span className="flex items-center gap-1.5">
							<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
							Generando...
						</span>
					) : (
						"Generar Link"
					)}
				</button>
			</div>
		);
	}

	const statusConfig: Record<string, { icon: string; label: string; color: string }> = {
		pending: { icon: "⏳", label: "Sin respuestas aún", color: "text-chrome-text-secondary" },
		partial: { icon: "⏳", label: `${progress.answered}/${progress.total} respondidas`, color: "text-orientation" },
		complete: { icon: "✅", label: "Todas respondidas", color: "text-success" },
	};
	const status = statusConfig[intakeStatus ?? "pending"] ?? statusConfig.pending;

	return (
		<div className="rounded-xl border border-dashed border-blue-300 bg-accent p-5">
			<div className="mb-1 flex items-center gap-2">
				<LinkIcon className="h-4 w-4 text-primary" />
				<span className="text-sm font-semibold text-primary">Link para el Cliente</span>
			</div>

			{/* URL + Copy */}
			<div
				onClick={handleCopy}
				className="mb-2 flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:border-primary"
			>
				<span className="flex-1 truncate font-mono text-[11px] text-chrome-text-muted">
					{intakeUrl ?? "—"}
				</span>
				{copied ? (
					<CheckIcon className="h-3.5 w-3.5 shrink-0 text-success" />
				) : (
					<CopyIcon className="h-3.5 w-3.5 shrink-0 text-chrome-text-secondary" />
				)}
			</div>

			{/* Status */}
			<div className={`text-xs ${status.color}`}>
				{status.icon} {status.label}
			</div>
		</div>
	);
}
