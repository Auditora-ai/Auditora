/**
 * Nodes collection API
 *
 * POST /api/sessions/[sessionId]/nodes
 * Body: { nodeType, label, lane?, connections? }
 *
 * Creates a new diagram node (used by chat extraction in live sessions).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;

		const { nodeType, label, lane, connections } = await request.json();

		if (!label) {
			return NextResponse.json(
				{ error: "label is required" },
				{ status: 400 },
			);
		}

		// Check for duplicate labels
		const existing = await db.diagramNode.findFirst({
			where: {
				sessionId,
				label: { equals: label, mode: "insensitive" },
				state: { not: "REJECTED" },
			},
		});

		if (existing) {
			return NextResponse.json(
				{ error: "A node with this label already exists", existingId: existing.id },
				{ status: 409 },
			);
		}

		const currentCount = await db.diagramNode.count({ where: { sessionId } });

		const node = await db.diagramNode.create({
			data: {
				sessionId,
				nodeType: nodeType || "TASK",
				label,
				state: "FORMING",
				lane: lane || null,
				positionX: 200 + currentCount * 200,
				positionY: 200,
				connections: connections || [],
			},
		});

		return NextResponse.json({
			id: node.id,
			nodeType: node.nodeType,
			label: node.label,
			state: node.state,
			lane: node.lane,
			connections: node.connections,
		});
	} catch (error) {
		console.error("[Nodes POST] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
