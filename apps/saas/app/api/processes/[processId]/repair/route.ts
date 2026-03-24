import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { repairDiagram } from "@repo/ai";

/**
 * POST /api/processes/[processId]/repair
 *
 * AI-powered diagram repair. Fetches the current DiagramNodes,
 * sends them to Claude for semantic cleanup, and returns repaired nodes.
 * Also updates the DiagramNode records in the database.
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
			query: { disableCookieCache: true },
		});
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { processId } = await params;

		// Find the most recent session with diagram nodes
		const meetingSession = await db.meetingSession.findFirst({
			where: { processDefinitionId: processId },
			orderBy: { createdAt: "desc" },
			select: { id: true },
		});

		if (!meetingSession) {
			return NextResponse.json({ error: "No session found for this process" }, { status: 404 });
		}

		// Fetch current nodes
		const dbNodes = await db.diagramNode.findMany({
			where: {
				sessionId: meetingSession.id,
				state: { not: "REJECTED" },
			},
			orderBy: { confirmedAt: "asc" },
		});

		if (dbNodes.length === 0) {
			return NextResponse.json({ error: "No diagram nodes to repair" }, { status: 400 });
		}

		// Fetch transcript for context
		const transcriptEntries = await db.transcriptEntry.findMany({
			where: { sessionId: meetingSession.id },
			orderBy: { timestamp: "asc" },
			select: { speaker: true, text: true },
			take: 200,
		});

		const transcript = transcriptEntries
			.map((e) => `${e.speaker}: ${e.text}`)
			.join("\n");

		// Map DB nodes to repair input format
		const inputNodes = dbNodes.map((n) => ({
			id: n.id,
			type: n.nodeType.toLowerCase(),
			label: n.label,
			lane: n.lane || undefined,
			connections: n.connections || [],
			confidence: n.confidence,
		}));

		// Run AI repair
		const result = await repairDiagram({
			nodes: inputNodes,
			transcript: transcript || undefined,
		});

		// Update database: mark removed nodes as REJECTED, update repaired nodes
		const repairedIds = new Set(result.repairedNodes.map((n) => n.id));

		// Reject nodes that were removed by the repair
		const removedNodes = dbNodes.filter((n) => !repairedIds.has(n.id));
		if (removedNodes.length > 0) {
			await db.diagramNode.updateMany({
				where: { id: { in: removedNodes.map((n) => n.id) } },
				data: { state: "REJECTED", rejectedAt: new Date() },
			});
		}

		// Update repaired nodes (labels, connections, types may have changed)
		for (const repaired of result.repairedNodes) {
			const existing = dbNodes.find((n) => n.id === repaired.id);
			if (existing) {
				await db.diagramNode.update({
					where: { id: repaired.id },
					data: {
						label: repaired.label,
						lane: repaired.lane || null,
						connections: repaired.connections,
						state: "CONFIRMED",
						confirmedAt: existing.confirmedAt || new Date(),
					},
				});
			}
		}

		// Return repaired nodes in frontend format
		const nodes = result.repairedNodes.map((n) => ({
			id: n.id,
			type: n.type,
			label: n.label,
			state: "confirmed" as const,
			lane: n.lane,
			connections: n.connections,
			confidence: null,
		}));

		return NextResponse.json({
			nodes,
			changes: result.changes,
			removedCount: removedNodes.length,
			repairedCount: result.repairedNodes.length,
		});
	} catch (error) {
		console.error("[DiagramRepair] Error:", error);
		return NextResponse.json({ error: "Repair failed" }, { status: 500 });
	}
}
