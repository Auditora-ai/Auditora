"use client";

import { useEffect, useRef, useState } from "react";
import {
	CheckCircle2Icon,
	ClockIcon,
	ExternalLinkIcon,
	LoaderIcon,
	LightbulbIcon,
	SearchIcon,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Finding {
	title: string;
	summary: string;
	relevance: "high" | "medium";
	sourceUrl?: string;
	source?: string;
}

interface Insight {
	text: string;
	sources: string[];
}

type SourceStatus = "pending" | "loading" | "done";

interface SourceState {
	status: SourceStatus;
	findings: Finding[];
}

interface InvestigationBoardProps {
	companyName: string;
	industry: string;
	sessionToken: string;
	onComplete: (researchData: Record<string, Finding[]>) => void;
}

const SOURCE_CONFIG: Record<
	string,
	{ label: string; icon: string }
> = {
	regulatory: { label: "Panorama Regulatorio", icon: "⚖️" },
	legal: { label: "Contexto Legal", icon: "📜" },
	competitors: { label: "Análisis Competitivo", icon: "🏢" },
	incidents: { label: "Incidentes del Sector", icon: "⚠️" },
	sector_risks: { label: "Riesgos Sectoriales", icon: "📊" },
	macro: { label: "Contexto Macroeconómico", icon: "🌍" },
	benchmarks: { label: "Benchmarks de Industria", icon: "📏" },
};

const ALL_SOURCES = Object.keys(SOURCE_CONFIG);

// ─── Component ──────────────────────────────────────────────────────────────

export function InvestigationBoard({
	companyName,
	industry,
	sessionToken,
	onComplete,
}: InvestigationBoardProps) {
	const [sources, setSources] = useState<Record<string, SourceState>>(() => {
		const initial: Record<string, SourceState> = {};
		for (const id of ALL_SOURCES) {
			initial[id] = { status: "pending", findings: [] };
		}
		return initial;
	});
	const [insights, setInsights] = useState<Insight[]>([]);
	const [isComplete, setIsComplete] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const eventSourceRef = useRef<EventSource | null>(null);
	const startedRef = useRef(false);

	const completedCount = Object.values(sources).filter(
		(s) => s.status === "done",
	).length;
	const totalSources = ALL_SOURCES.length;
	const progress = Math.round((completedCount / totalSources) * 100);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		// Use fetch with SSE parsing (EventSource doesn't support POST)
		async function runResearch() {
			try {
				const res = await fetch("/api/public/scan/research", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});

				if (!res.ok || !res.body) {
					setError("No se pudo iniciar la investigación");
					return;
				}

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n\n");
					buffer = lines.pop() || "";

					for (const line of lines) {
						if (!line.startsWith("data: ")) continue;
						try {
							const event = JSON.parse(line.slice(6));
							handleSSEEvent(event);
						} catch {
							// Skip malformed events
						}
					}
				}
			} catch {
				setError("Error de conexión durante la investigación");
			}
		}

		runResearch();

		return () => {
			eventSourceRef.current?.close();
		};
	}, []);

	function handleSSEEvent(event: {
		phase: string;
		data?: any;
		message?: string;
	}) {
		switch (event.phase) {
			case "research_start":
				setSources((prev) => ({
					...prev,
					[event.data.source]: {
						...prev[event.data.source],
						status: "loading",
					},
				}));
				break;

			case "research_finding":
				setSources((prev) => {
					const sourceId = event.data.source;
					const current = prev[sourceId];
					if (!current) return prev;
					return {
						...prev,
						[sourceId]: {
							...current,
							status: "loading",
							findings: [
								...current.findings,
								{
									title: event.data.title,
									summary: event.data.summary,
									relevance: event.data.relevance,
									sourceUrl: event.data.sourceUrl,
								},
							],
						},
					};
				});
				break;

			case "research_done":
				setSources((prev) => ({
					...prev,
					[event.data.source]: {
						...prev[event.data.source],
						status: "done",
					},
				}));
				break;

			case "insight":
				setInsights((prev) => [
					...prev,
					{
						text: event.data.text,
						sources: event.data.sources,
					},
				]);
				break;

			case "complete": {
				setIsComplete(true);
				// Collect all findings and pass to parent
				setSources((prev) => {
					const allFindings: Record<string, Finding[]> = {};
					for (const [id, state] of Object.entries(prev)) {
						allFindings[id] = state.findings;
					}
					setTimeout(() => onComplete(allFindings), 1500);
					return prev;
				});
				break;
			}

			case "error":
				setError(event.message || "Error en la investigación");
				setTimeout(() => onComplete({}), 1000);
				break;
		}
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			{/* Header */}
			<div className="text-center">
				<div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-1.5 text-sm text-stone-600">
					<SearchIcon className="size-4" />
					Investigando: {companyName}
				</div>
				<h2 className="mt-3 font-display text-xl font-semibold text-stone-900">
					Análisis de Inteligencia de Negocio
				</h2>
				<p className="mt-1 text-sm text-stone-500">
					{industry}
				</p>
			</div>

			{/* Progress bar */}
			<div className="space-y-1">
				<div className="flex items-center justify-between text-xs text-stone-500">
					<span>
						{completedCount} de {totalSources} fuentes
					</span>
					<span className="tabular-nums">{progress}%</span>
				</div>
				<div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
					<div
						className="h-full rounded-full bg-amber-500 transition-all duration-700 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* Source cards */}
			<div className="space-y-3">
				{ALL_SOURCES.map((sourceId, index) => {
					const source = sources[sourceId];
					const config = SOURCE_CONFIG[sourceId];
					if (!source || !config) return null;

					return (
						<div
							key={sourceId}
							className={`overflow-hidden rounded-xl border transition-all duration-300 ${
								source.status === "done"
									? "border-green-200 bg-[#FFFBF5]"
									: source.status === "loading"
										? "border-amber-200 bg-amber-50/30"
										: "border-stone-200 bg-stone-50"
							}`}
							style={{
								animationDelay: `${index * 150}ms`,
								animation: "fadeSlideIn 0.3s cubic-bezier(0,0,0.2,1) both",
							}}
						>
							{/* Source header */}
							<div className="flex items-center gap-3 px-4 py-3">
								<span className="text-lg">
									{config.icon}
								</span>
								<span className="flex-1 text-sm font-medium text-stone-800">
									{config.label}
								</span>
								{source.status === "pending" && (
									<ClockIcon className="size-4 text-stone-400" />
								)}
								{source.status === "loading" && (
									<LoaderIcon className="size-4 animate-spin text-amber-500" />
								)}
								{source.status === "done" && (
									<CheckCircle2Icon className="size-4 text-green-500" />
								)}
							</div>

							{/* Findings */}
							{source.findings.length > 0 && (
								<div className="border-t border-stone-100 px-4 pb-3 pt-2">
									<div className="space-y-2">
										{source.findings.map(
											(finding, fi) => (
												<div
													key={fi}
													className={`rounded-lg border-l-2 bg-[#FFFBF5] px-3 py-2 text-xs transition-opacity duration-500 ${
														finding.relevance ===
														"high"
															? "border-l-amber-400"
															: "border-l-stone-200"
													}`}
													style={{
														animation:
															"fadeIn 0.5s ease-out both",
														animationDelay: `${fi * 200}ms`,
													}}
												>
													<p className="font-medium text-stone-800 leading-snug">
														{finding.title}
													</p>
													<p className="mt-0.5 text-stone-500 leading-relaxed">
														{finding.summary}
													</p>
													{finding.sourceUrl && (
														<a
															href={
																finding.sourceUrl
															}
															target="_blank"
															rel="noopener noreferrer"
															className="mt-1 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
														>
															<ExternalLinkIcon className="size-3" />
															Fuente
														</a>
													)}
												</div>
											),
										)}
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* AI Insights */}
			{insights.length > 0 && (
				<div className="rounded-xl bg-stone-900 p-5 text-stone-50">
					<div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-300">
						<LightbulbIcon className="size-4 text-amber-400" />
						Conclusiones en Tiempo Real
					</div>
					<div className="space-y-3">
						{insights.map((insight, i) => (
							<div
								key={i}
								className="flex gap-3 text-sm leading-relaxed text-stone-200"
								style={{
									animation: "fadeIn 0.8s ease-out both",
									animationDelay: `${i * 300}ms`,
								}}
							>
								<span className="mt-0.5 shrink-0 text-amber-400">
									🧠
								</span>
								<p className="italic">
									&ldquo;{insight.text}&rdquo;
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Error state */}
			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
					{error}
				</div>
			)}

			{/* Complete state */}
			{isComplete && (
				<div className="text-center text-sm text-green-600">
					<CheckCircle2Icon className="mx-auto mb-2 size-6" />
					Investigación completa. Generando análisis de riesgos
					enriquecido...
				</div>
			)}

			{/* CSS animations */}
			<style>{`
				@keyframes fadeSlideIn {
					from { opacity: 0; transform: translateY(12px); }
					to { opacity: 1; transform: translateY(0); }
				}
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				/* DESIGN.md motion: medium=300ms, long=500ms */
			`}</style>
		</div>
	);
}
