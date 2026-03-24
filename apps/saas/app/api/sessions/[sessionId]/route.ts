/**
 * Session CRUD API
 *
 * PATCH  /api/sessions/[sessionId] — Update session type or process
 * DELETE /api/sessions/[sessionId] — Delete a session and its related data
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

async function getAuthContext() {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;

	const orgs = await auth.api.listOrganizations({
		headers: await headers(),
	});
	const activeOrg = orgs?.[0];
	if (!activeOrg) return null;

	return { user: session.user, org: activeOrg };
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { sessionId } = await params;
		const body = await request.json();
		const { type, processDefinitionId } = body;

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 },
			);
		}

		if (session.organizationId !== authCtx.org.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (session.status === "ACTIVE" || session.status === "CONNECTING") {
			return NextResponse.json(
				{ error: "Cannot edit an active or connecting session. End it first." },
				{ status: 409 },
			);
		}

		const validTypes = ["DISCOVERY", "DEEP_DIVE", "CONTINUATION"];
		if (type && !validTypes.includes(type)) {
			return NextResponse.json(
				{ error: `Invalid session type. Must be one of: ${validTypes.join(", ")}` },
				{ status: 400 },
			);
		}

		// Validate processDefinitionId belongs to same org
		if (processDefinitionId) {
			const process = await db.processDefinition.findUnique({
				where: { id: processDefinitionId },
				include: { architecture: { select: { organizationId: true } } },
			});
			if (!process || process.architecture.organizationId !== authCtx.org.id) {
				return NextResponse.json(
					{ error: "Invalid process definition" },
					{ status: 400 },
				);
			}
		}

		const data: Record<string, unknown> = {};
		if (type) data.type = type;
		if (processDefinitionId !== undefined) data.processDefinitionId = processDefinitionId || null;

		if (Object.keys(data).length === 0) {
			return NextResponse.json(
				{ error: "No fields to update" },
				{ status: 400 },
			);
		}

		const updated = await db.meetingSession.update({
			where: { id: sessionId },
			data,
			include: {
				processDefinition: true,
				_count: { select: { diagramNodes: true, transcriptEntries: true } },
			},
		});

		return NextResponse.json(updated);
	} catch (error) {
		console.error("[Sessions API] Error updating session:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { sessionId } = await params;

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 },
			);
		}

		if (session.organizationId !== authCtx.org.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (session.status === "ACTIVE" || session.status === "CONNECTING") {
			return NextResponse.json(
				{ error: "Cannot delete an active or connecting session. End it first." },
				{ status: 409 },
			);
		}

		// Nullify continuationOf references pointing to this session
		await db.meetingSession.updateMany({
			where: { continuationOf: sessionId },
			data: { continuationOf: null },
		});

		// Delete MeetingParticipant manually (no FK cascade)
		await db.meetingParticipant.deleteMany({
			where: { sessionId },
		});

		// Delete session — cascade handles DiagramNode, TranscriptEntry,
		// CorrectionLog, TeleprompterLog, SessionSummary, SessionDeliverable
		await db.meetingSession.delete({
			where: { id: sessionId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Sessions API] Error deleting session:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
