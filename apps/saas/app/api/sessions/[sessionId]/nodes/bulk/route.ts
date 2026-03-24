import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

/** Convert camelCase AI node type to UPPER_SNAKE_CASE Prisma enum */
function toNodeType(type?: string): string {
	if (!type) return "TASK";
	const map: Record<string, string> = {
		startevent: "START_EVENT",
		endevent: "END_EVENT",
		task: "TASK",
		usertask: "USER_TASK",
		servicetask: "SERVICE_TASK",
		manualtask: "MANUAL_TASK",
		businessruletask: "BUSINESS_RULE_TASK",
		subprocess: "SUBPROCESS",
		exclusivegateway: "EXCLUSIVE_GATEWAY",
		parallelgateway: "PARALLEL_GATEWAY",
		timerevent: "TIMER_EVENT",
		messageevent: "MESSAGE_EVENT",
		intermediateevent: "TIMER_EVENT",
	};
	return map[type.toLowerCase().replace(/_/g, "")] || "TASK";
}

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

		const created = await db.diagramNode.createMany({
			data: nodes.map((n: any) => ({
				sessionId,
				nodeType: toNodeType(n.type) as any,
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
