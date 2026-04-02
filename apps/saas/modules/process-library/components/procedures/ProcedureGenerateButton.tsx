"use client";

import { useState, useEffect, useRef } from "react";
import { SparklesIcon, Loader2Icon } from "lucide-react";
import { cn } from "@repo/ui";

interface ProcedureGenerateButtonProps {
	procedureId: string;
	disabled?: boolean;
	onGenerated: (procedure: any) => void;
}

const loadingMessages = [
	"Analizando proceso...",
	"Identificando puntos de control...",
	"Generando pasos detallados...",
	"Aplicando mejores prácticas...",
	"Refinando procedimiento...",
];

export function ProcedureGenerateButton({ procedureId, disabled, onGenerated }: ProcedureGenerateButtonProps) {
	const [generating, setGenerating] = useState(false);
	const [messageIndex, setMessageIndex] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

	useEffect(() => {
		if (generating) {
			setMessageIndex(0);
			intervalRef.current = setInterval(() => {
				setMessageIndex((prev) => Math.min(prev + 1, loadingMessages.length - 1));
			}, 3000);
		}
		return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
	}, [generating]);

	const handleGenerate = async () => {
		setGenerating(true);
		try {
			const res = await fetch(`/api/procedures/${procedureId}/generate`, { method: "POST" });
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Error al generar");
			}
			const procedure = await res.json();
			onGenerated(procedure);
		} catch (err) {
			console.error("Error generating procedure:", err);
		} finally {
			setGenerating(false);
		}
	};

	if (generating) {
		return (
			<div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3">
				<div className="relative flex h-8 w-8 items-center justify-center">
					<div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
					<SparklesIcon className="relative h-4 w-4 text-primary animate-pulse" />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-medium text-foreground">Generando procedimiento</p>
					<p className="text-xs text-muted-foreground transition-all duration-300">
						{loadingMessages[messageIndex]}
					</p>
				</div>
				<Loader2Icon className="ml-auto h-4 w-4 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<button
			onClick={handleGenerate}
			disabled={disabled}
			className={cn(
				"flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
				"bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
				"hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02]",
				"disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none",
			)}
		>
			<SparklesIcon className="h-4 w-4" />
			Generar con IA
		</button>
	);
}
