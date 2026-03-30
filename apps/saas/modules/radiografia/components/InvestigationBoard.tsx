"use client";

import { useEffect, useRef, useState } from "react";
import {
	CheckCircle2Icon,
	ClockIcon,
	ExternalLinkIcon,
	LoaderIcon,
	LightbulbIcon,
	SearchIcon,
	ShieldCheckIcon,
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
	const totalFindings = Object.values(sources).reduce(
		(sum, s) => sum + s.findings.length, 0,
	);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		async function runResearch() {
			try {
				const res = await fetch("/api/public/scan/research", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});

				if (!res.ok || !res.body) {
					setError("No se pudo iniciar la investigación");
					setTimeout(() => onComplete({}), 1500);
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
				setTimeout(() => onComplete({}), 1500);
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
		<div className="mx-auto space-y-8 px-4 md:px-0 md:max-w-3xl">
			{/* Hero header */}
			<div className="animate-fade-up text-center">
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
					<SearchIcon className="size-4" />
					{companyName}
				</div>
				<h2 className="font-display text-3xl md:text-4xl text-foreground">
					Inteligencia de Negocio
				</h2>
				<p className="mx-auto mt-2 max-w-md text-base text-muted-foreground">
					Analizando {totalSources} fuentes de datos para <span className="font-medium text-foreground">{industry}</span>
				</p>
			</div>

			{/* Live stats bar */}
			<div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
				<div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-5 py-3">
					<div className="flex items-center gap-6">
						<div className="text-center">
							<p className="text-2xl font-bold tabular-nums text-foreground">{completedCount}<span className="text-muted-foreground">/{totalSources}</span></p>
							<p className="text-xs text-muted-foreground">Fuentes</p>
						</div>
						<div className="h-8 w-px bg-border" />
						<div className="text-center">
							<p className="text-2xl font-bold tabular-nums text-foreground">{totalFindings}</p>
							<p className="text-xs text-muted-foreground">Hallazgos</p>
						</div>
						<div className="h-8 w-px bg-border" />
						<div className="text-center">
							<p className="text-2xl font-bold tabular-nums text-orientation">{insights.length}</p>
							<p className="text-xs text-muted-foreground">Insights</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{!isComplete && (
							<span className="relative flex size-2">
								<span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40" />
								<span className="relative inline-flex size-2 rounded-full bg-primary" />
							</span>
						)}
						<span className="text-xs font-medium tabular-nums text-muted-foreground">{progress}%</span>
					</div>
				</div>
				{/* Thin progress bar */}
				<div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/50">
					<div
						className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* Source cards — 2-column grid on desktop */}
			<div className="grid gap-3 md:grid-cols-2">
				{ALL_SOURCES.map((sourceId, index) => {
					const source = sources[sourceId];
					const config = SOURCE_CONFIG[sourceId];
					if (!source || !config) return null;

					const isLoading = source.status === "loading";
					const isDone = source.status === "done";

					return (
						<div
							key={sourceId}
							className={`animate-fade-slide-in overflow-hidden rounded-xl border transition-all duration-300 ${
								isDone
									? "border-success/30 bg-background"
									: isLoading
										? "border-orientation/30 bg-background"
										: "border-border/50 bg-secondary/30"
							}`}
							style={{ animationDelay: `${200 + index * 100}ms` }}
						>
							{/* Source header */}
							<div className={`flex items-center gap-3 px-4 py-3 ${
								isLoading ? "border-b border-orientation/20" : isDone && source.findings.length > 0 ? "border-b border-border/50" : ""
							}`}>
								<span className="text-2xl">
									{config.icon}
								</span>
								<div className="flex-1 min-w-0">
									<span className="block text-sm font-semibold text-foreground">
										{config.label}
									</span>
									{isDone && source.findings.length > 0 && (
										<span className="text-xs text-muted-foreground">
											{source.findings.length} hallazgo{source.findings.length !== 1 ? "s" : ""}
										</span>
									)}
								</div>
								{source.status === "pending" && (
									<ClockIcon className="size-4 text-muted-foreground/50" />
								)}
								{isLoading && (
									<LoaderIcon className="size-4 animate-spin text-orientation" />
								)}
								{isDone && (
									<CheckCircle2Icon className="size-4 text-success" />
								)}
							</div>

							{/* Findings */}
							{source.findings.length > 0 && (
								<div className="px-4 pb-3 pt-2">
									<div className="space-y-2">
										{source.findings.map(
											(finding, fi) => (
												<div
													key={fi}
													className={`animate-fade-in rounded-lg px-3 py-2 text-xs ${
														finding.relevance === "high"
															? "border-l-2 border-l-orientation bg-orientation-subtle/20"
															: "bg-secondary/50"
													}`}
													style={{ animationDelay: `${fi * 150}ms` }}
												>
													<p className="font-semibold text-foreground leading-snug break-words">
														{finding.title}
													</p>
													<p className="mt-0.5 text-muted-foreground leading-relaxed break-words line-clamp-2">
														{finding.summary}
													</p>
													{finding.sourceUrl && (
														<a
															href={finding.sourceUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="mt-1 inline-flex min-h-[44px] items-center gap-1 text-primary hover:text-primary/80 md:min-h-0"
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

			{/* AI Insights — dark chrome panel */}
			{insights.length > 0 && (
				<div className="animate-fade-up overflow-hidden rounded-xl border border-chrome-border bg-chrome-base">
					<div className="flex items-center gap-2 border-b border-chrome-border px-5 py-3">
						<LightbulbIcon className="size-4 text-orientation" />
						<span className="text-sm font-semibold text-chrome-text">Conclusiones en Tiempo Real</span>
					</div>
					<div className="space-y-0 divide-y divide-chrome-border">
						{insights.map((insight, i) => (
							<div
								key={i}
								className="animate-fade-in flex gap-3 px-5 py-4 text-sm leading-relaxed"
								style={{ animationDelay: `${i * 200}ms` }}
							>
								<span className="mt-0.5 shrink-0 text-lg text-orientation">
									🧠
								</span>
								<p className="font-display italic text-chrome-text">
									&ldquo;{insight.text}&rdquo;
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Error state */}
			{error && (
				<div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
					{error}
				</div>
			)}

			{/* Complete state */}
			{isComplete && (
				<div className="animate-fade-up flex items-center justify-center gap-3 rounded-xl border border-success/30 bg-success/5 px-5 py-4">
					<ShieldCheckIcon className="size-5 text-success" />
					<div>
						<p className="text-sm font-semibold text-foreground">Investigación completa</p>
						<p className="text-xs text-muted-foreground">
							{totalFindings} hallazgos recopilados. Generando análisis de riesgos enriquecido...
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
