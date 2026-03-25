import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params;

	const authResult = await requireSessionAuth(sessionId);
	if (isAuthError(authResult)) return authResult;

	const format = request.nextUrl.searchParams.get("format") || "xml";

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			diagramNodes: { where: { state: { not: "REJECTED" } } },
			organization: { select: { name: true } },
			processDefinition: { select: { name: true } },
		},
	});

	if (!session) {
		return NextResponse.json({ error: "Session not found" }, { status: 404 });
	}

	// Dynamic import of bpmn-builder (server-side)
	const { buildBpmnXml } = await import("@meeting/lib/bpmn-builder");

	const nodes = session.diagramNodes.map((n) => ({
		id: n.id,
		type: n.nodeType.toLowerCase(),
		label: n.label,
		state: n.state.toLowerCase() as any,
		lane: n.lane || undefined,
		connections: n.connections,
	}));

	const xml = await buildBpmnXml(nodes);
	const orgName = session.organization.name;
	const processName = session.processDefinition?.name || session.type;
	const filename = `${orgName}-${processName}`.replace(/[^a-zA-Z0-9-_]/g, "_");

	if (format === "xml") {
		return new NextResponse(xml, {
			headers: {
				"Content-Type": "application/xml",
				"Content-Disposition": `attachment; filename="${filename}.bpmn"`,
			},
		});
	}

	// SVG format (can be converted to PNG client-side)
	return new NextResponse(xml, {
		headers: {
			"Content-Type": "application/xml",
			"Content-Disposition": `attachment; filename="${filename}.bpmn"`,
		},
	});
}
