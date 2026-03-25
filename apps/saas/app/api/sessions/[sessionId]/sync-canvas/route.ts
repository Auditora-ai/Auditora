/**
 * Sync Canvas → DB
 *
 * POST /api/sessions/[sessionId]/sync-canvas
 *
 * Takes BPMN elements extracted from the bpmn-js canvas and upserts them
 * into the DiagramNode table. This ensures the DB reflects what's on screen,
 * even for manually drag-dropped elements that were never saved.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

const TYPE_MAP: Record<string, string> = {
	task: "TASK",
	user_task: "USER_TASK",
	service_task: "SERVICE_TASK",
	manual_task: "MANUAL_TASK",
	business_rule_task: "BUSINESS_RULE_TASK",
	subprocess: "SUBPROCESS",
	start_event: "START_EVENT",
	end_event: "END_EVENT",
	exclusive_gateway: "EXCLUSIVE_GATEWAY",
	parallel_gateway: "PARALLEL_GATEWAY",
	timer_event: "TIMER_EVENT",
	message_event: "MESSAGE_EVENT",
	intermediate_catch_event: "TIMER_EVENT",
	intermediate_event: "TIMER_EVENT",
	text_annotation: "TEXT_ANNOTATION",
	// Fallbacks for bpmn-js types that come as camelCase
	usertask: "USER_TASK",
	servicetask: "SERVICE_TASK",
	manualtask: "MANUAL_TASK",
	exclusivegateway: "EXCLUSIVE_GATEWAY",
	parallelgateway: "PARALLEL_GATEWAY",
	startevent: "START_EVENT",
	endevent: "END_EVENT",
};

function toNodeType(type: string): string {
	const clean = type.toLowerCase().replace(/^bpmn:/, "");
	return TYPE_MAP[clean] || "TASK";
}

interface CanvasNode {
	id: string;
	type: string;
	label: string;
	lane: string;
	connections: string[];
	connectionLabels?: string[];
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;

		const body = await request.json();
		const canvasNodes: CanvasNode[] = body.nodes || [];

		if (canvasNodes.length === 0) {
			return NextResponse.json({ ok: true, synced: 0 });
		}

		// Get existing DB nodes for this session
		const existingNodes = await db.diagramNode.findMany({
			where: { sessionId },
			select: { id: true, state: true },
		});
		const existingIds = new Set(existingNodes.map((n) => n.id));

		// Build set of all valid node IDs (existing + incoming canvas nodes)
		const allValidIds = new Set([...existingIds, ...canvasNodes.map((n) => n.id)]);

		let created = 0;
		let updated = 0;

		for (const cn of canvasNodes) {
			// Filter connections to only reference valid node IDs
			const validConnections = (cn.connections || []).filter((id) => allValidIds.has(id));
			const nodeType = toNodeType(cn.type);
			// Validate nodeType is a valid enum value
			const validTypes = [
				"START_EVENT", "END_EVENT", "TASK", "USER_TASK", "SERVICE_TASK",
				"MANUAL_TASK", "BUSINESS_RULE_TASK", "SUBPROCESS", "EXCLUSIVE_GATEWAY",
				"PARALLEL_GATEWAY", "TIMER_EVENT", "MESSAGE_EVENT", "SIGNAL_EVENT",
				"CONDITIONAL_EVENT", "TEXT_ANNOTATION",
			];
			if (!validTypes.includes(nodeType)) continue;

			// Upsert: create if not exists, update if exists (handles cross-session ID collisions)
			await db.diagramNode.upsert({
				where: { id: cn.id },
				update: {
					label: cn.label || undefined,
					lane: cn.lane || "General",
					connections: validConnections,
					sessionId, // Ensure it belongs to this session
					// Un-reject if it was rejected but is still on canvas
					...(existingNodes.find((n) => n.id === cn.id)?.state === "REJECTED"
						? { state: "CONFIRMED", rejectedAt: null, confirmedAt: new Date() }
						: {}),
				},
				create: {
					id: cn.id,
					sessionId,
					nodeType: nodeType as any,
					label: cn.label || `${nodeType.toLowerCase().replace(/_/g, " ")}`,
					state: "CONFIRMED",
					lane: cn.lane || "General",
					connections: validConnections,
					confirmedAt: new Date(),
				},
			});
			if (existingIds.has(cn.id)) {
				updated++;
			} else {
				created++;
			}
		}

		console.log(`[sync-canvas] Session ${sessionId}: ${created} created, ${updated} updated, ${canvasNodes.length} total`);

		return NextResponse.json({ ok: true, synced: canvasNodes.length, created, updated });
	} catch (error) {
		console.error("[sync-canvas] Error:", error);
		return NextResponse.json(
			{ error: "Failed to sync canvas" },
			{ status: 500 },
		);
	}
}
