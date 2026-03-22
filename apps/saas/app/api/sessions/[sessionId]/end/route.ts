import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { createCallBotProvider, generateSessionSummary } from "@repo/ai";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: {
				diagramNodes: { where: { state: { not: "REJECTED" } } },
			},
		});

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		// Auto-confirm all forming nodes
		await db.diagramNode.updateMany({
			where: { sessionId, state: "FORMING" },
			data: { state: "CONFIRMED", confirmedAt: new Date() },
		});

		// Leave the call if bot is active
		if (session.recallBotId) {
			try {
				const callBot = createCallBotProvider();
				await callBot.leaveMeeting(session.recallBotId);
			} catch {
				// Bot may already have left
			}
		}

		// Mark session as ended
		await db.meetingSession.update({
			where: { id: sessionId },
			data: { status: "ENDED", endedAt: new Date() },
		});

		// Auto-version process and architecture (non-blocking)
		autoVersionOnSessionEnd(sessionId, session).catch((err) =>
			console.error("[EndSession] Auto-versioning failed:", err),
		);

		// Generate session summary async (non-blocking)
		generateSummaryInBackground(sessionId, session.type).catch((err) =>
			console.error("[EndSession] Summary generation failed:", err),
		);

		return NextResponse.json({ ok: true, sessionId });
	} catch (error) {
		console.error("[EndSession] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

async function autoVersionOnSessionEnd(
	sessionId: string,
	session: any,
) {
	// If targeting a specific process, create a ProcessVersion
	if (session.processDefinitionId) {
		const processDef = await db.processDefinition.findUnique({
			where: { id: session.processDefinitionId },
		});
		if (processDef) {
			// Get next version number
			const lastVersion = await db.processVersion.findFirst({
				where: { processDefinitionId: processDef.id },
				orderBy: { version: "desc" },
			});
			const nextVersion = (lastVersion?.version ?? 0) + 1;

			await db.processVersion.create({
				data: {
					processDefinitionId: processDef.id,
					version: nextVersion,
					name: processDef.name,
					description: processDef.description,
					bpmnXml: processDef.bpmnXml,
					goals: processDef.goals,
					triggers: processDef.triggers,
					outputs: processDef.outputs,
					changeNote: `Auto-saved after session ${sessionId}`,
					createdBy: session.userId,
				},
			});

			// Update process status
			await db.processDefinition.update({
				where: { id: processDef.id },
				data: { processStatus: "MAPPED" },
			});

			console.log(`[EndSession] Created ProcessVersion v${nextVersion} for "${processDef.name}"`);
		}
	}

	// For DISCOVERY sessions: create an ArchitectureVersion snapshot
	if (session.type === "DISCOVERY") {
		const project = await db.project.findUnique({
			where: { id: session.projectId },
			include: {
				architecture: {
					include: { definitions: true },
				},
			},
		});

		if (project?.architecture) {
			const lastArchVersion = await db.architectureVersion.findFirst({
				where: { architectureId: project.architecture.id },
				orderBy: { version: "desc" },
			});
			const nextVersion = (lastArchVersion?.version ?? 0) + 1;

			await db.architectureVersion.create({
				data: {
					architectureId: project.architecture.id,
					version: nextVersion,
					snapshot: project.architecture.definitions as any,
					changeNote: `Auto-saved after discovery session ${sessionId}`,
					createdBy: session.userId,
				},
			});

			console.log(`[EndSession] Created ArchitectureVersion v${nextVersion}`);
		}
	}
}

async function generateSummaryInBackground(
	sessionId: string,
	sessionType: string,
) {
	const [nodes, transcriptEntries] = await Promise.all([
		db.diagramNode.findMany({
			where: { sessionId, state: "CONFIRMED" },
		}),
		db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "asc" },
		}),
	]);

	const result = await generateSessionSummary(
		sessionType,
		nodes.map((n) => ({
			id: n.id,
			type: n.nodeType,
			label: n.label,
			lane: n.lane || undefined,
		})),
		transcriptEntries.map((e) => ({
			speaker: e.speaker,
			text: e.text,
			timestamp: e.timestamp,
		})),
	);

	await db.sessionSummary.upsert({
		where: { sessionId },
		create: {
			sessionId,
			summary: result.summary,
			actionItems: result.actionItems,
		},
		update: {
			summary: result.summary,
			actionItems: result.actionItems,
		},
	});
}
