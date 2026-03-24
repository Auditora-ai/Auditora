/**
 * Smart Reorganize API
 *
 * POST /api/sessions/[sessionId]/reorganize
 *
 * Takes all current nodes, sends them to Claude to determine the
 * correct logical flow, then updates connections in the DB.
 * The client then calls rebuildFromNodes with the fixed connections.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		// Get all non-rejected nodes
		const nodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
			orderBy: { createdAt: "asc" },
		});

		if (nodes.length < 2) {
			return NextResponse.json({ ok: true, message: "Not enough nodes" });
		}

		// Ask Claude to determine the correct flow
		const nodeList = nodes.map((n) =>
			`- id:"${n.id}" type:${n.nodeType} label:"${n.label}" lane:${n.lane || "sin lane"}`
		).join("\n");

		const { text } = await generateText({
			model: anthropic("claude-sonnet-4-6"),
			system: `You are a BPMN process flow expert. Given a list of BPMN nodes, determine the correct sequential flow order and connections.

Rules:
- The process must flow logically from start to end
- Each task/event has exactly 1 outgoing connection (except gateways)
- Gateways (exclusive/parallel) have 2+ outgoing connections
- Start events connect to the first task
- The last task(s) connect to the end event
- Consider the lane (role) when determining which tasks follow which
- Consider the labels to understand the logical order of the process
- If there's a gateway like "¿Factura correcta?", connect its branches to the appropriate tasks (e.g., "Sí" → approve, "No" → reject/correct)

Output ONLY valid JSON (no markdown):
{
  "connections": [
    { "sourceId": "node_id", "targets": ["target_id_1"], "labels": [""] },
    { "sourceId": "gateway_id", "targets": ["target_a", "target_b"], "labels": ["Sí", "No"] }
  ],
  "reasoning": "brief explanation of the flow logic"
}

Every node must appear as a sourceId exactly once (except end events).
targets must reference valid node IDs from the list.`,
			prompt: `Determine the correct BPMN flow for these nodes:\n\n${nodeList}`,
			maxOutputTokens: 2048,
			temperature: 0.1,
		});

		// Parse result
		let result: any;
		try {
			const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
			result = JSON.parse(cleaned);
		} catch {
			console.error("[Reorganize] Failed to parse AI response:", text.substring(0, 200));
			return NextResponse.json({ error: "AI response parse failed" }, { status: 422 });
		}

		if (!result.connections || !Array.isArray(result.connections)) {
			return NextResponse.json({ error: "Invalid AI response structure" }, { status: 422 });
		}

		// Update connections in DB
		const validIds = new Set(nodes.map((n) => n.id));
		let updated = 0;

		for (const conn of result.connections) {
			if (!conn.sourceId || !validIds.has(conn.sourceId)) continue;
			const validTargets = (conn.targets || []).filter((t: string) => validIds.has(t));

			await db.diagramNode.update({
				where: { id: conn.sourceId },
				data: { connections: validTargets },
			});
			updated++;
		}

		console.log(`[Reorganize] Updated ${updated} node connections for session ${sessionId.substring(0, 8)}`);
		console.log(`[Reorganize] Reasoning: ${result.reasoning}`);

		// Return updated nodes
		const updatedNodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
		});

		return NextResponse.json({
			ok: true,
			updated,
			reasoning: result.reasoning,
			nodes: updatedNodes.map((n) => ({
				id: n.id,
				type: n.nodeType.toLowerCase(),
				label: n.label,
				state: n.state.toLowerCase(),
				lane: n.lane || undefined,
				connections: n.connections || [],
				confidence: n.confidence,
			})),
		});
	} catch (error) {
		console.error("[Reorganize] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
