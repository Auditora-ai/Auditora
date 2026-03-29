/**
 * Batch node update API — updates multiple nodes atomically in a transaction.
 * Used by the tree editor for drag-reorder (changes connections of 2-3 nodes at once).
 *
 * PATCH /api/sessions/[sessionId]/nodes/batch-update
 * Body: { updates: [{ nodeId, connections?, connectionLabels?, label?, type?, lane? }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

interface NodeUpdate {
	nodeId: string;
	connections?: string[];
	connectionLabels?: string[];
	label?: string;
	type?: string;
	lane?: string;
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;

		const body = await request.json();
		const { updates } = body;

		if (!Array.isArray(updates) || updates.length === 0) {
			return NextResponse.json(
				{ error: "updates must be a non-empty array" },
				{ status: 400 },
			);
		}

		if (updates.length > 50) {
			return NextResponse.json(
				{ error: "maximum 50 updates per batch" },
				{ status: 400 },
			);
		}

		const results = await db.$transaction(
			updates.map((u: NodeUpdate) => {
				const data: Record<string, any> = {};
				if (Array.isArray(u.connections)) data.connections = u.connections;
				if (Array.isArray(u.connectionLabels)) data.connectionLabels = u.connectionLabels;
				if (u.label && typeof u.label === "string") data.label = u.label.trim();
				if (u.type && typeof u.type === "string") data.nodeType = u.type.toUpperCase();
				if (u.lane !== undefined) data.lane = u.lane || null;

				return db.diagramNode.update({
					where: { id: u.nodeId },
					data,
				});
			}),
		);

		return NextResponse.json({ ok: true, updated: results.length });
	} catch (error) {
		console.error("[Nodes] Batch update error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
