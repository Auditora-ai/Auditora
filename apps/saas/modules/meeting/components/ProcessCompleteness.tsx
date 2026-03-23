"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, RefreshCw, SparklesIcon } from "lucide-react";
import { toastSuccess, toastError } from "@repo/ui/components/toast";

interface CompletenessData {
	exists: boolean;
	completenessScore?: number;
	confidenceScores?: Record<string, number>;
	openItems?: number;
}

interface ProcessCompletenessProps {
	processId: string;
	onRunAnalysis?: () => void;
	analysisLoading?: boolean;
}

const DIMENSION_LABELS: Record<string, string> = {
	roles: "Roles",
	triggers: "Triggers",
	steps: "Pasos",
	decisions: "Decisiones",
	exceptions: "Excepciones",
	outputs: "Salidas",
	systems: "Sistemas",
	formats: "Formatos",
	slas: "SLAs",
	volumetrics: "Volumetría",
	costs: "Costos",
	interProcessLinks: "Inter-proceso",
};

/**
 * ProcessCompleteness — Floating widget showing process documentation gaps
 *
 * Positioned bottom-left above minimap. Shows circular progress with
 * expandable dimension breakdown from ProcessIntelligence.confidenceScores.
 */
export function ProcessCompleteness({
	processId,
	onRunAnalysis,
	analysisLoading,
}: ProcessCompletenessProps) {
	const [data, setData] = useState<CompletenessData | null>(null);
	const [expanded, setExpanded] = useState(false);
	const [running, setRunning] = useState(false);

	const fetchData = useCallback(async () => {
		if (!processId) return;
		try {
			const res = await fetch(
				`/api/processes/${processId}/intelligence`,
			);
			if (res.ok) {
				const result = await res.json();
				setData(result);
			}
		} catch {
			// Intelligence data is optional
		}
	}, [processId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleRunAnalysis = useCallback(async () => {
		setRunning(true);
		try {
			const res = await fetch(`/api/processes/${processId}/intelligence`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "initialize" }),
			});
			if (res.ok) {
				toastSuccess("Analisis completado");
				await fetchData();
			} else {
				toastError("Error al ejecutar analisis");
			}
		} catch {
			toastError("Error al ejecutar analisis");
		} finally {
			setRunning(false);
		}
	}, [processId, fetchData]);

	if (!data?.exists) {
		return (
			<div className="rounded-lg border border-border bg-card p-4">
				<div className="flex flex-col items-center gap-2 text-center">
					<SparklesIcon className="h-5 w-5 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						No hay analisis de inteligencia aun
					</p>
					<button
						type="button"
						onClick={handleRunAnalysis}
						disabled={running}
						className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
					>
						<RefreshCw className={`h-3 w-3 ${running ? "animate-spin" : ""}`} />
						{running ? "Analizando..." : "Ejecutar analisis"}
					</button>
				</div>
			</div>
		);
	}

	const score = data.completenessScore ?? 0;
	const scores = data.confidenceScores ?? {};
	const radius = 18;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (score / 100) * circumference;
	const scoreColor =
		score >= 70 ? "#16A34A" : score >= 40 ? "#EAB308" : "#DC2626";

	return (
		<div className="absolute bottom-20 left-4 z-20">
			<div className="rounded-lg border border-border bg-card shadow-lg">
				{/* Compact view */}
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className="flex items-center gap-2.5 px-3 py-2"
				>
					{/* Circular progress */}
					<svg width="44" height="44" className="-rotate-90">
						<circle
							cx="22"
							cy="22"
							r={radius}
							fill="none"
							stroke="#E2E8F0"
							strokeWidth="3"
						/>
						<circle
							cx="22"
							cy="22"
							r={radius}
							fill="none"
							stroke={scoreColor}
							strokeWidth="3"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
							strokeLinecap="round"
						/>
					</svg>
					<div className="text-left">
						<div className="text-sm font-semibold">{score}%</div>
						<div className="text-[10px] text-muted-foreground">
							Completitud
						</div>
					</div>
					{expanded ? (
						<ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
					) : (
						<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
					)}
				</button>

				{/* Expanded dimension breakdown */}
				{expanded && (
					<div className="border-t px-3 py-2">
						<div className="space-y-1.5">
							{Object.entries(scores)
								.filter(
									([key]) =>
										DIMENSION_LABELS[key] !== undefined,
								)
								.sort(([, a], [, b]) => a - b)
								.map(([key, value]) => (
									<div
										key={key}
										className="flex items-center gap-2"
									>
										<span className="w-20 text-[10px] text-muted-foreground truncate">
											{DIMENSION_LABELS[key] || key}
										</span>
										<div className="flex-1 h-1.5 rounded-full bg-muted">
											<div
												className="h-full rounded-full transition-all"
												style={{
													width: `${value * 100}%`,
													backgroundColor:
														value >= 0.7
															? "#16A34A"
															: value >= 0.4
																? "#EAB308"
																: "#DC2626",
												}}
											/>
										</div>
										<span className="w-8 text-right text-[10px] font-medium">
											{Math.round(value * 100)}%
										</span>
									</div>
								))}
						</div>

						{data.openItems !== undefined && data.openItems > 0 && (
							<p className="mt-2 text-[10px] text-muted-foreground">
								{data.openItems} preguntas abiertas
							</p>
						)}

						{onRunAnalysis && (
							<button
								type="button"
								onClick={onRunAnalysis}
								disabled={analysisLoading}
								className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
							>
								<RefreshCw
									className={`h-3 w-3 ${analysisLoading ? "animate-spin" : ""}`}
								/>
								{analysisLoading
									? "Analizando..."
									: "Ejecutar análisis"}
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
