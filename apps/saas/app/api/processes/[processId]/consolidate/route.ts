import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";
import { consolidateStakeholders } from "@repo/ai";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const { processId } = await params;

	const authResult = await requireProcessAuth(processId);
	if (isAuthError(authResult)) return authResult;

	// Get all sessions for this process
	const sessions = await db.meetingSession.findMany({
		where: { processDefinitionId: processId, status: "ENDED" },
		include: {
			diagramNodes: { where: { state: "CONFIRMED" } },
			transcriptEntries: { orderBy: { timestamp: "asc" }, take: 100 },
		},
	});

	if (sessions.length < 2) {
		return NextResponse.json(
			{ error: "Need at least 2 completed sessions to consolidate" },
			{ status: 400 },
		);
	}

	// Build perspectives
	const perspectives = sessions.slice(0, 3).map((s) => ({
		sessionId: s.id,
		stakeholder:
			s.transcriptEntries.find((t) => t.speaker !== "Consultant")
				?.speaker || `Session ${s.id.slice(0, 6)}`,
		steps: s.diagramNodes.map((n) => ({
			label: n.label,
			lane: n.lane || undefined,
			connections: n.connections,
		})),
		transcriptExcerpt: s.transcriptEntries
			.map((t) => `${t.speaker}: ${t.text}`)
			.join("\n"),
	}));

	// Run consolidation
	const result = await consolidateStakeholders(perspectives, authResult.authCtx.org.id);

	// Save conflicts to database
	if (result.conflicts.length > 0) {
		// Clear previous conflicts
		await db.stakeholderConflict.deleteMany({ where: { processId } });

		await db.stakeholderConflict.createMany({
			data: result.conflicts.map((c) => ({
				processId,
				nodeLabel: c.nodeLabel,
				conflictType: c.conflictType,
				perspectives: c.perspectives,
			})),
		});
	}

	// Fetch saved conflicts
	const conflicts = await db.stakeholderConflict.findMany({
		where: { processId },
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json({
		conflicts,
		consolidatedSteps: result.consolidatedSteps,
	});
}

// Resolve a conflict
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const { processId } = await params;

	const authResult = await requireProcessAuth(processId);
	if (isAuthError(authResult)) return authResult;

	const body = await request.json();
	const { conflictId, resolution } = body;

	if (!conflictId || !resolution) {
		return NextResponse.json(
			{ error: "conflictId and resolution required" },
			{ status: 400 },
		);
	}

	const conflict = await db.stakeholderConflict.findFirst({
		where: { id: conflictId, processId },
	});

	if (!conflict) {
		return NextResponse.json(
			{ error: "Conflict not found" },
			{ status: 404 },
		);
	}

	const updated = await db.stakeholderConflict.update({
		where: { id: conflictId },
		data: { resolved: true, resolution },
	});

	return NextResponse.json({ conflict: updated });
}
