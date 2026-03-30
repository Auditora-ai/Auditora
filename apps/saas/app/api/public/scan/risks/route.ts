/**
 * Deep Risk Audit Endpoint for Radiografia
 *
 * POST — Runs a full risk audit (risk + FMEA) on the enriched KnowledgeSnapshot
 *         accumulated during the SIPOC conversation.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { verifyAnonymousSession } from "@radiografia/lib/session-verify";
import { auditRisks, extractSipoc } from "@repo/ai";
import type { RiskAuditInput } from "@repo/ai";
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

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

export async function POST(request: NextRequest) {
	if (isKillSwitchActive()) {
		return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
	}

	const ip = getClientIp(request);
	if (!(await checkRateLimit(ip, 5, "risks"))) {
		return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
	}

	if (!(await checkDailyCost())) {
		return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
	}

	const result = await verifyAnonymousSession(request);
	if (result.error) return result.error;
	const session = result.session;

	// Build enriched SIPOC from conversation
	const conversationLog = (session.conversationLog as ChatMessage[] | null) || [];
	const fullConversation = conversationLog
		.map((m) => `${m.role === "user" ? "Director" : "Consultor IA"}: ${m.content}`)
		.join("\n");

	// Re-extract SIPOC with the enriched conversation context
	const processDescription = `Proceso: ${session.processName || "Proceso principal"}. Industria: ${session.industry || "General"}.\n\nConversacion completa:\n${fullConversation}`;

	const sipocResult = await extractSipoc(processDescription, "public");
	await recordCost(1);

	const enrichedSipoc = sipocResultToEnriched(sipocResult);
	const knowledge = sipocToKnowledge(
		enrichedSipoc,
		session.industry || undefined,
		conversationLog
			.filter((m) => m.role === "user")
			.map((m) => m.content),
	);

	// Generate diagram nodes
	const diagramNodes = sipocToNodes(enrichedSipoc);

	// Run full risk audit (risk + FMEA)
	const riskInput: RiskAuditInput = {
		organizationId: "public",
		mode: "full",
		processDefinition: {
			name: session.processName || "Proceso principal",
			description: processDescription.slice(0, 500),
			level: "PROCESS",
			goals: [],
		},
		knowledgeSnapshot: knowledge,
		intelligenceItems: [],
		existingRisks: [],
		organizationContext: {
			industry: session.industry || undefined,
			siblingProcessNames: [],
		},
		transcriptExcerpts: conversationLog
			.filter((m) => m.role === "user")
			.map((m) => ({ text: m.content })),
	};

	const riskResult = await auditRisks(riskInput);
	await recordCost(1);

	// Update session with deep results
	await db.anonymousSession.update({
		where: { id: session.id },
		data: {
			phase: "risks",
			sipocData: sipocResult as any,
			knowledgeData: knowledge as any,
			diagramNodes: diagramNodes as any,
			deepRiskResults: riskResult as any,
		},
	});

	return NextResponse.json({
		sipoc: sipocResult,
		nodes: diagramNodes,
		risks: riskResult,
	});
}
