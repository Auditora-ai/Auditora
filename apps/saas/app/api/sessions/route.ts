/**
 * Session Management API
 *
 * POST /api/sessions — Create a new meeting session and join the call
 * GET  /api/sessions — List sessions for the current user's organization
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { createCallBotProvider } from "@repo/ai";
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

export async function POST(request: NextRequest) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json(
				{ error: "Unauthorized. Please log in." },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const { meetingUrl, clientName, projectName, sessionType } = body;

		if (!meetingUrl || !clientName || !sessionType) {
			return NextResponse.json(
				{ error: "meetingUrl, clientName, and sessionType are required" },
				{ status: 400 },
			);
		}

		const { user, org } = authCtx;

		// Find or create client (scoped to org)
		let client = await db.client.findFirst({
			where: { name: clientName, organizationId: org.id },
		});
		if (!client) {
			client = await db.client.create({
				data: { name: clientName, organizationId: org.id },
			});
		}

		// Find or create project
		const projName = projectName || `${clientName} - Process Mapping`;
		let project = await db.project.findFirst({
			where: { name: projName, clientId: client.id },
		});
		if (!project) {
			project = await db.project.create({
				data: { name: projName, clientId: client.id },
			});
		}

		// Create session in DB
		const session = await db.meetingSession.create({
			data: {
				type: sessionType,
				status: "CONNECTING",
				meetingUrl,
				projectId: project.id,
				userId: user.id,
			},
		});

		// Join the meeting via call bot
		try {
			const callBot = createCallBotProvider();
			const { botId } = await callBot.joinMeeting(meetingUrl);

			await db.meetingSession.update({
				where: { id: session.id },
				data: {
					recallBotId: botId,
					recallBotStatus: "joining",
				},
			});

			return NextResponse.json({
				sessionId: session.id,
				botId,
				shareToken: session.shareToken,
				status: "connecting",
			});
		} catch (botError) {
			// Bot failed to join — keep session but mark status
			await db.meetingSession.update({
				where: { id: session.id },
				data: {
					status: "FAILED",
					recallBotStatus: `error: ${botError instanceof Error ? botError.message : "unknown"}`,
				},
			});

			return NextResponse.json(
				{
					error: "Failed to join meeting. Check your meeting URL and try again.",
					detail: botError instanceof Error ? botError.message : "Unknown error",
					sessionId: session.id,
				},
				{ status: 502 },
			);
		}
	} catch (error) {
		console.error("[Sessions API] Error creating session:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const sessions = await db.meetingSession.findMany({
			where: {
				project: { client: { organizationId: authCtx.org.id } },
			},
			include: {
				project: { include: { client: true } },
				processDefinition: true,
				_count: { select: { diagramNodes: true, transcriptEntries: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 50,
		});

		return NextResponse.json(sessions);
	} catch (error) {
		console.error("[Sessions API] Error listing sessions:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
