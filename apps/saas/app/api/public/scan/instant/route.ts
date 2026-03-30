/**
 * Instant Radiografia SSE Streaming Endpoint
 *
 * POST — Runs the 3-step pipeline (industry inference → SIPOC extraction → risk audit)
 *         and streams results as Server-Sent Events.
 *
 * SSE Event Protocol:
 *   { phase: "industry", data: IndustryInferenceResult, message: "..." }
 *   { phase: "sipoc", data: SipocResult, message: "..." }
 *   { phase: "diagram", data: { nodes: DiagramNode[] }, message: "..." }
 *   { phase: "risks", data: RiskAuditResult, message: "..." }
 *   { phase: "complete", data: null, message: "..." }
 *   { phase: "error", data: { code: string }, message: "..." }
 */

import { NextRequest } from "next/server";
import { db } from "@repo/database";
import { verifyAnonymousSession } from "@radiografia/lib/session-verify";
import { extractSipoc, auditRisks } from "@repo/ai";
import type { RiskAuditInput } from "@repo/ai";
import { inferIndustry } from "@radiografia/lib/industry-inference";
import {
	sipocResultToEnriched,
	sipocToKnowledge,
} from "@radiografia/lib/sipoc-to-knowledge";
import { sipocToNodes } from "@radiografia/lib/sipoc-to-nodes";
import {
	getClientIp,
	checkRateLimit,
	checkDailyCost,
	recordCost,
	isKillSwitchActive,
} from "@radiografia/lib/rate-limit";

export async function POST(request: NextRequest) {
	if (isKillSwitchActive()) {
		return new Response("Service unavailable", { status: 503 });
	}

	const ip = getClientIp(request);
	if (!(await checkRateLimit(ip, 3, "instant"))) {
		return new Response("Rate limit exceeded", { status: 429 });
	}

	if (!(await checkDailyCost())) {
		return new Response("Service temporarily unavailable", { status: 503 });
	}

	const result = await verifyAnonymousSession(request);
	if (result.error) return result.error;
	const session = result.session;

	const businessContext =
		session.businessContext || session.businessDescription;
	if (!businessContext) {
		return new Response("No business context. Run crawl first.", {
			status: 400,
		});
	}

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
				// Step 1: Industry inference
				send("industry", null, "Analizando tu industria...");
				const industryResult =
					await inferIndustry(businessContext);
				await recordCost(1);

				if (!industryResult) {
					send("error", { code: "INDUSTRY_FAILED" }, "No pudimos analizar tu industria. Intenta de nuevo.");
					controller.close();
					return;
				}

				send("industry", industryResult, "Industria identificada");

				// Step 2: SIPOC extraction
				send("sipoc", null, "Mapeando proceso clave...");
				const processDescription = `${industryResult.selectedProcess.name}: ${industryResult.selectedProcess.description}. Contexto de la empresa: ${businessContext.slice(0, 1000)}`;

				const sipocResult = await extractSipoc(
					processDescription,
					"public",
				);
				await recordCost(1);

				send("sipoc", sipocResult, "SIPOC generado");

				// Generate diagram nodes from SIPOC
				const enrichedSipoc =
					sipocResultToEnriched(sipocResult);
				const diagramNodes = sipocToNodes(enrichedSipoc);
				send("diagram", { nodes: diagramNodes }, "Generando diagrama...");

				// Step 3: Risk audit
				send("risks", null, "Evaluando riesgos...");
				const knowledge = sipocToKnowledge(
					enrichedSipoc,
					industryResult.industry,
				);

				const riskInput: RiskAuditInput = {
					organizationId: "public",
					mode: "risk",
					processDefinition: {
						name: industryResult.selectedProcess.name,
						description:
							industryResult.selectedProcess.description,
						level: "PROCESS",
						goals: [],
					},
					knowledgeSnapshot: knowledge,
					intelligenceItems: [],
					existingRisks: [],
					organizationContext: {
						industry: industryResult.industry,
						siblingProcessNames:
							industryResult.criticalProcesses.map(
								(p) => p.name,
							),
					},
				};

				const riskResult = await auditRisks(riskInput);
				await recordCost(1);

				send("risks", riskResult, "Riesgos identificados");

				// Update anonymous session with all results
				await db.anonymousSession.update({
					where: { id: session.id },
					data: {
						phase: "instant",
						industry: industryResult.industry,
						processName:
							industryResult.selectedProcess.name,
						sipocData: JSON.parse(JSON.stringify(sipocResult)),
						knowledgeData: JSON.parse(JSON.stringify(knowledge)),
						diagramNodes: JSON.parse(JSON.stringify(diagramNodes)),
						riskResults: JSON.parse(JSON.stringify(riskResult)),
					},
				});

				send("complete", null, "Radiografia lista");
			} catch (error) {
				console.error("[radiografia/instant] Pipeline error:", error);
				send(
					"error",
					{ code: "PIPELINE_ERROR" },
					"Hubo un error generando tu radiografia. Intenta de nuevo.",
				);
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
