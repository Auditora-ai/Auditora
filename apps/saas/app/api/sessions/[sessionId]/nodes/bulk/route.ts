import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;
		const body = await request.json();
		const { nodes } = body;

		if (!Array.isArray(nodes) || nodes.length === 0) {
			return NextResponse.json(
				{ error: "nodes must be a non-empty array" },
				{ status: 400 },
			);
		}

		// Verify session exists
		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			select: { id: true },
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 },
			);
		}

		// Create nodes in bulk
		const created = await db.diagramNode.createMany({
			data: nodes.map((n: any) => ({
				sessionId,
				nodeType: (n.type || "TASK").toUpperCase(),
				label: n.label || "Sin nombre",
				state: "FORMING",
				lane: n.lane || null,
				connections: n.connections || [],
				confidence: n.confidence ?? null,
			})),
		});

		return NextResponse.json({
			created: created.count,
		});
	} catch (error) {
		console.error("[Nodes] Bulk POST error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
