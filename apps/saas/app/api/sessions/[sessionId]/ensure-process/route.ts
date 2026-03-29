/**
 * Ensure Process API
 *
 * POST /api/sessions/[sessionId]/ensure-process
 *
 * Creates or updates a ProcessDefinition linked to the session.
 * If no process exists, creates one and links it to the session.
 * If one exists, updates its name.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;

		const body = await request.json();
		const name = typeof body.name === "string" ? body.name.trim() : "";

		if (!name) {
			return NextResponse.json(
				{ error: "name is required" },
				{ status: 400 },
			);
		}

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			select: { processDefinitionId: true, organizationId: true },
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 },
			);
		}

		// If process already exists, just update the name
		if (session.processDefinitionId) {
			await db.processDefinition.update({
				where: { id: session.processDefinitionId },
				data: { name },
			});

			return NextResponse.json({
				processId: session.processDefinitionId,
				created: false,
			});
		}

		// No process linked — create one and link it
		const architecture = await db.processArchitecture.upsert({
			where: { organizationId: session.organizationId },
			create: { organizationId: session.organizationId },
			update: {},
		});

		const newProcess = await db.processDefinition.create({
			data: {
				architectureId: architecture.id,
				name,
				processStatus: "DRAFT",
				category: "core",
				level: "PROCESS",
			},
		});

		await db.meetingSession.update({
			where: { id: sessionId },
			data: { processDefinitionId: newProcess.id },
		});

		console.log(`[ensure-process] Created process "${name}" for session ${sessionId}`);

		return NextResponse.json({
			processId: newProcess.id,
			created: true,
		});
	} catch (error) {
		console.error("[ensure-process] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
