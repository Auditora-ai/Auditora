/**
 * Procedure (SOP) Generation API
 *
 * GET  — return stored procedure for this node
 * POST — generate procedure with AI using transcript + BPMN context
 * PATCH — update procedure with manual edits
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";
import { generateProcedure } from "@repo/ai";

type Params = { params: Promise<{ sessionId: string; nodeId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
	try {
		const { sessionId, nodeId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;

		const node = await db.diagramNode.findFirst({
			where: { id: nodeId, sessionId },
			select: { procedure: true, label: true, properties: true },
		});

		if (!node) {
			return NextResponse.json({ error: "Node not found" }, { status: 404 });
		}

		return NextResponse.json({ procedure: node.procedure, label: node.label });
	} catch (error: any) {
		console.error("[Procedure GET]", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function POST(request: NextRequest, { params }: Params) {
	try {
		const { sessionId, nodeId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;
		const { session } = authResult;

		const node = await db.diagramNode.findFirst({
			where: { id: nodeId, sessionId },
		});

		if (!node) {
			return NextResponse.json({ error: "Node not found" }, { status: 404 });
		}

		// Get transcript excerpts relevant to this node
		const transcriptEntries = await db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "asc" },
			select: { text: true, speaker: true },
		});

		const nodeLabel = node.label.toLowerCase();
		const props = (node.properties as Record<string, any>) || {};

		// Filter transcript for excerpts mentioning this node or related terms
		const keywords = [nodeLabel, ...(props.systems || []), ...(props.inputs || []), ...(props.outputs || [])].map(k => k?.toLowerCase()).filter(Boolean);
		const relevantExcerpts = transcriptEntries
			.filter(t => keywords.some(kw => t.text.toLowerCase().includes(kw)))
			.slice(0, 20)
			.map(t => `[${t.speaker || "?"}] ${t.text}`);

		// Get sibling nodes for BPMN context
		const siblingNodes = await db.diagramNode.findMany({
			where: { sessionId, parentId: node.parentId },
			select: { label: true, nodeType: true, lane: true },
			orderBy: { formedAt: "asc" },
		});

		const bpmnContext = siblingNodes
			.map(n => `${n.nodeType}: "${n.label}"${n.lane ? ` (${n.lane})` : ""}`)
			.join("\n");

		const result = await generateProcedure({
			organizationId: session.organizationId,
			processName: session.processDefinition?.name || "Proceso",
			activityName: node.label,
			activityLane: node.lane || undefined,
			processDescription: props.description || undefined,
			bpmnContext,
			transcriptExcerpts: relevantExcerpts.length > 0 ? relevantExcerpts : undefined,
			systems: props.systems || undefined,
			roles: siblingNodes.map(n => n.lane).filter(Boolean) as string[],
		});

		// Save to DB
		await db.diagramNode.update({
			where: { id: nodeId },
			data: { procedure: result as any },
		});

		return NextResponse.json({ procedure: result });
	} catch (error: any) {
		console.error("[Procedure POST]", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest, { params }: Params) {
	try {
		const { sessionId, nodeId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;

		const body = await request.json();
		const { procedure } = body;

		if (!procedure) {
			return NextResponse.json({ error: "procedure field required" }, { status: 400 });
		}

		await db.diagramNode.update({
			where: { id: nodeId },
			data: { procedure: procedure as any },
		});

		return NextResponse.json({ ok: true });
	} catch (error: any) {
		console.error("[Procedure PATCH]", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
