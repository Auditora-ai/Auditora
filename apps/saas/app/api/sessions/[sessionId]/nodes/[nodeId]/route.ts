/**
 * Node lifecycle API
 *
 * PATCH /api/sessions/[sessionId]/nodes/[nodeId]
 * Body: { action: "confirm" | "reject" }
 *
 * Confirms or rejects a diagram node.
 * Reject cascades: children of rejected node go back to FORMING.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string; nodeId: string }> },
) {
	try {
		const { sessionId, nodeId } = await params;
		const { action } = await request.json();

		if (!["confirm", "reject"].includes(action)) {
			return NextResponse.json(
				{ error: "action must be 'confirm' or 'reject'" },
				{ status: 400 },
			);
		}

		const node = await db.diagramNode.findFirst({
			where: { id: nodeId, sessionId },
		});

		if (!node) {
			return NextResponse.json(
				{ error: "Node not found" },
				{ status: 404 },
			);
		}

		if (action === "confirm") {
			await db.diagramNode.update({
				where: { id: nodeId },
				data: { state: "CONFIRMED", confirmedAt: new Date() },
			});

			// Log correction
			await db.correctionLog.create({
				data: {
					sessionId,
					nodeId,
					action: "confirm",
					oldState: node.state,
					newState: "CONFIRMED",
				},
			});
		} else {
			// Reject + cascade: children go back to FORMING
			await db.diagramNode.update({
				where: { id: nodeId },
				data: { state: "REJECTED", rejectedAt: new Date() },
			});

			// Find children (nodes that this node connects to)
			if (node.connections.length > 0) {
				await db.diagramNode.updateMany({
					where: {
						sessionId,
						id: { in: node.connections },
						state: { not: "REJECTED" },
					},
					data: { state: "FORMING", confirmedAt: null },
				});
			}

			await db.correctionLog.create({
				data: {
					sessionId,
					nodeId,
					action: "reject",
					oldState: node.state,
					newState: "REJECTED",
				},
			});
		}

		return NextResponse.json({ ok: true, action, nodeId });
	} catch (error) {
		console.error("[Nodes API] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
