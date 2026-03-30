/**
 * AI Interview Status Endpoint
 *
 * GET /api/sessions/interview/[sessionId]/status
 *
 * Polls the completion status of the batch pipeline.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { getInterviewProgress } from "../complete/progress";

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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { sessionId } = await params;

		// Verify session ownership
		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			select: { organizationId: true, type: true, status: true, bpmnXml: true },
		});

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		if (session.organizationId !== authCtx.org.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Check Redis/memory progress
		const progress = await getInterviewProgress(sessionId);

		if (progress) {
			return NextResponse.json(progress);
		}

		// Fallback: check session status in DB
		if (session.status === "ENDED" && session.bpmnXml) {
			return NextResponse.json({
				status: "done",
				step: "complete",
				progress: 100,
				bpmnXml: session.bpmnXml,
			});
		}

		return NextResponse.json({
			status: "processing",
			step: "unknown",
			progress: 0,
		});
	} catch (error) {
		console.error("[AI Interview Status] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
