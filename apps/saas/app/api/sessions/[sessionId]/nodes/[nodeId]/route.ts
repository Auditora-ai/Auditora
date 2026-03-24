/**
 * Node lifecycle API
 *
 * PATCH /api/sessions/[sessionId]/nodes/[nodeId]
 * Body: { action: "confirm" | "reject" | "edit", label?, type?, lane? }
 *
 * confirm/reject: Changes node state with cascade.
 * edit: Updates label, type, or lane (BPMN best practices corrections).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string; nodeId: string }> },
) {
	try {
		const { sessionId, nodeId } = await params;
		const body = await request.json();
		const { action } = body;

		if (!["confirm", "reject", "edit"].includes(action)) {
			return NextResponse.json(
				{ error: "action must be 'confirm', 'reject', or 'edit'" },
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

		if (action === "edit") {
			// Update node properties (label, type, lane)
			const updateData: Record<string, any> = {};
			if (body.label && typeof body.label === "string") {
				updateData.label = body.label.trim();
			}
			if (body.type && typeof body.type === "string") {
				updateData.nodeType = body.type.toUpperCase();
			}
			if (body.lane !== undefined) {
				updateData.lane = body.lane || null;
			}

			if (Object.keys(updateData).length === 0) {
				return NextResponse.json(
					{ error: "edit requires at least one of: label, type, lane" },
					{ status: 400 },
				);
			}

			await db.diagramNode.update({
				where: { id: nodeId },
				data: updateData,
			});

			await db.correctionLog.create({
				data: {
					sessionId,
					nodeId,
					action: "edit",
					oldState: node.state,
					newState: node.state,
				},
			});

			return NextResponse.json({ ok: true, action: "edit", nodeId, updated: updateData });
		}

		if (action === "confirm") {
			await db.diagramNode.update({
				where: { id: nodeId },
				data: { state: "CONFIRMED", confirmedAt: new Date() },
			});

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
			// Reject + cascade
			await db.diagramNode.update({
				where: { id: nodeId },
				data: { state: "REJECTED", rejectedAt: new Date() },
			});

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
