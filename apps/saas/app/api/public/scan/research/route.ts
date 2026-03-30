/**
 * Business Intelligence Research SSE Endpoint
 *
 * POST — Runs parallel web searches to gather regulatory, legal, competitive,
 *         and industry context. Streams findings as Server-Sent Events.
 *
 * This is the "McKinsey first week" pipeline — the AI researches your business
 * like a senior consultant would.
 */

import { NextRequest } from "next/server";
import { db } from "@repo/database";
import { verifyAnonymousSession } from "@radiografia/lib/session-verify";
import {
	getClientIp,
	checkRateLimit,
	isKillSwitchActive,
} from "@radiografia/lib/rate-limit";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ResearchSource {
	id: string;
	label: string;
	query: string;
}

interface Finding {
	title: string;
	summary: string;
	relevance: "high" | "medium";
	sourceUrl?: string;
}

// ─── Google Custom Search ───────────────────────────────────────────────────

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

async function webSearch(query: string): Promise<Finding[]> {
	// If Google Custom Search is configured, use it
	if (GOOGLE_API_KEY && GOOGLE_CSE_ID) {
		try {
			const url = new URL("https://www.googleapis.com/customsearch/v1");
			url.searchParams.set("key", GOOGLE_API_KEY);
			url.searchParams.set("cx", GOOGLE_CSE_ID);
			url.searchParams.set("q", query);
			url.searchParams.set("num", "5");

			const res = await fetch(url.toString(), {
				signal: AbortSignal.timeout(8000),
			});
			if (!res.ok) return [];

			const data = await res.json();
			return (data.items || []).slice(0, 5).map((item: any) => ({
				title: item.title || "",
				summary: item.snippet || "",
				relevance: "medium" as const,
				sourceUrl: item.link,
			}));
		} catch {
			return [];
		}
	}

	// Fallback: use fetch to scrape search results (basic)
	// In production, replace with a proper search API (Brave, Serper, etc.)
	return [
		{
			title: `Resultados para: ${query.slice(0, 80)}`,
			summary:
				"Búsqueda web no configurada. Configure GOOGLE_SEARCH_API_KEY y GOOGLE_CSE_ID para habilitar investigación automática.",
			relevance: "medium",
		},
	];
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
	if (isKillSwitchActive()) {
		return new Response("Service unavailable", { status: 503 });
	}

	const ip = getClientIp(request);
	if (!(await checkRateLimit(ip, 2))) {
		return new Response("Rate limit exceeded", { status: 429 });
	}

	const result = await verifyAnonymousSession(request);
	if (result.error) return result.error;
	const session = result.session;

	if (!session.industry || !session.businessContext) {
		return new Response("Run crawl + instant first", { status: 400 });
	}

	const industry = session.industry;
	const context = session.businessContext;

	// Extract location from context (heuristic)
	const locationMatch = context.match(
		/(?:ubicad[oa]s?\s+en|localizada?\s+en|sede\s+en|basad[oa]s?\s+en|oficina\s+en|en\s+)([\w\s,]+(?:México|Colombia|España|Argentina|Chile|Perú|Ecuador|Brasil|US|USA))/i,
	);
	const country =
		locationMatch?.[1]?.trim() || "Latinoamérica";
	const year = new Date().getFullYear();
	const companyName = session.sourceUrl
		? new URL(session.sourceUrl).hostname.replace("www.", "")
		: "empresa";

	// Build search queries
	const sources: ResearchSource[] = [
		{
			id: "regulatory",
			label: "Panorama Regulatorio",
			query: `regulaciones ${industry} ${country} ${year} normas ISO compliance`,
		},
		{
			id: "legal",
			label: "Contexto Legal",
			query: `${industry} multas sanciones ${country} ${year - 1} ${year}`,
		},
		{
			id: "competitors",
			label: "Análisis Competitivo",
			query: `${companyName} competidores ${industry} ${country}`,
		},
		{
			id: "incidents",
			label: "Incidentes del Sector",
			query: `${industry} fallas recalls demandas ${country} ${year}`,
		},
		{
			id: "sector_risks",
			label: "Riesgos Sectoriales",
			query: `${industry} riesgos tendencias supply chain ${year}`,
		},
		{
			id: "macro",
			label: "Contexto Macroeconómico",
			query: `${country} economía riesgos empresariales ${year}`,
		},
		{
			id: "benchmarks",
			label: "Benchmarks de Industria",
			query: `${industry} mejores prácticas controles internos gestión riesgos`,
		},
	];

	// SSE stream
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			function send(
				phase: string,
				data: unknown,
				message: string,
			) {
				const event = JSON.stringify({ phase, data, message });
				controller.enqueue(
					encoder.encode(`data: ${event}\n\n`),
				);
			}

			try {
				// Run all searches in parallel, streaming results as they arrive
				const allFindings: Record<string, Finding[]> = {};
				let completedCount = 0;

				// Announce all sources
				for (const source of sources) {
					send("research_start", { source: source.id }, `Investigando: ${source.label}...`);
				}

				// Execute searches in parallel using Promise.allSettled
				const searchPromises = sources.map(async (source) => {
					try {
						const findings = await webSearch(source.query);
						allFindings[source.id] = findings;

						// Stream each finding as it arrives
						for (const finding of findings) {
							send("research_finding", {
								source: source.id,
								...finding,
							}, finding.title);
						}

						completedCount++;
						send("research_done", {
							source: source.id,
							findingCount: findings.length,
						}, `${source.label} completado`);

						// Generate insight when we have enough data
						if (completedCount === 3) {
							const insightContext = Object.values(allFindings)
								.flat()
								.map((f) => f.summary)
								.join(" ");
							if (insightContext.length > 100) {
								send("insight", {
									text: `Con ${Object.keys(allFindings).length} fuentes analizadas, se identifican patrones de riesgo en ${industry} para ${country}.`,
									sources: Object.keys(allFindings),
								}, "Conclusión preliminar");
							}
						}
					} catch {
						completedCount++;
						send("research_done", {
							source: source.id,
							findingCount: 0,
						}, `${source.label}: sin resultados`);
					}
				});

				await Promise.allSettled(searchPromises);

				// Save research data to session
				// Note: requires `prisma generate` after schema change adds researchData field
				await db.$executeRaw`UPDATE anonymous_session SET research_data = ${JSON.stringify(allFindings)}::jsonb WHERE id = ${session.id}`;

				// Final insight
				const totalFindings = Object.values(allFindings)
					.flat().length;
				send("insight", {
					text: `Investigación completada: ${totalFindings} hallazgos de ${sources.length} fuentes. Este contexto enriquecerá el análisis de riesgos.`,
					sources: Object.keys(allFindings),
				}, "Investigación completada");

				send("complete", { findingCount: totalFindings }, "Investigación completa");
			} catch (err) {
				send("error", { code: "RESEARCH_FAILED" }, "Error en la investigación. Continuando sin contexto enriquecido.");
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}
