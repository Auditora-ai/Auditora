/**
 * Transcript API — Edit and add manual notes
 *
 * PATCH: Update correctedText on an existing transcript entry
 * POST: Add a manual note (creates TranscriptEntry with source="manual")
 *       and triggers process extraction directly (bypasses 15s throttle)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { extractProcessUpdates, buildSessionContext, setActivity } from "@repo/ai";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params;
	const body = await request.json();
	const { entryId, correctedText } = body;

	if (!entryId || typeof correctedText !== "string") {
		return NextResponse.json(
			{ error: "entryId and correctedText are required" },
			{ status: 400 },
		);
	}

	// Verify entry belongs to this session
	const entry = await db.transcriptEntry.findFirst({
		where: { id: entryId, sessionId },
	});
	if (!entry) {
		return NextResponse.json({ error: "Entry not found" }, { status: 404 });
	}

	// Update correctedText
	const updated = await db.transcriptEntry.update({
		where: { id: entryId },
		data: { correctedText: correctedText.trim() || null },
	});

	return NextResponse.json({ ok: true, entry: updated });
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params;
	const body = await request.json();
	const { entryId } = body;

	if (!entryId) {
		return NextResponse.json({ error: "entryId is required" }, { status: 400 });
	}

	const entry = await db.transcriptEntry.findFirst({
		where: { id: entryId, sessionId },
	});
	if (!entry) {
		return NextResponse.json({ error: "Entry not found" }, { status: 404 });
	}

	await db.transcriptEntry.delete({ where: { id: entryId } });

	return NextResponse.json({ ok: true, deleted: entryId });
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params;
	const body = await request.json();
	const { text } = body;

	if (!text || typeof text !== "string" || text.trim().length === 0) {
		return NextResponse.json(
			{ error: "text is required and must be non-empty" },
			{ status: 400 },
		);
	}

	// Verify session exists and is active
	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: { processDefinition: true },
	});
	if (!session) {
		return NextResponse.json({ error: "Session not found" }, { status: 404 });
	}

	// Get the latest timestamp to position this note correctly
	const lastEntry = await db.transcriptEntry.findFirst({
		where: { sessionId },
		orderBy: { timestamp: "desc" },
	});
	const timestamp = lastEntry ? lastEntry.timestamp + 1 : 0;

	// Create manual transcript entry
	const entry = await db.transcriptEntry.create({
		data: {
			sessionId,
			speaker: "Nota del consultor",
			text: text.trim(),
			timestamp,
			source: "manual",
		},
	});

	// Trigger extraction directly (bypass 15s throttle — user explicitly requested)
	// Run for ANY session status (ACTIVE, ENDED, CONNECTING) so manual input always works
	runManualExtraction(sessionId).catch((err) => {
		console.error(`[Transcript] Manual extraction failed for ${sessionId.substring(0, 8)}:`, err);
	});

	return NextResponse.json({ ok: true, entry }, { status: 202 });
}

/**
 * Run process extraction triggered by a manual note.
 * Bypasses the 15s throttle since the user explicitly submitted text.
 */
async function runManualExtraction(sessionId: string) {
	// Update activity state: extracting
	await setActivity(sessionId, "extracting", "Procesando indicacion manual").catch(() => {});

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: { processDefinition: true },
	});
	if (!session) return;

	const transcript = await db.transcriptEntry.findMany({
		where: { sessionId },
		orderBy: { timestamp: "desc" },
		take: 50,
	});

	const currentNodes = await db.diagramNode.findMany({
		where: { sessionId, state: { not: "REJECTED" } },
	});

	let context;
	try {
		context = await buildSessionContext(sessionId);
	} catch {
		context = undefined;
	}

	const result = await extractProcessUpdates(
		currentNodes.map((n) => ({
			id: n.id,
			type: n.nodeType.toLowerCase(),
			label: n.label,
			state: n.state.toLowerCase() as "forming" | "confirmed" | "rejected",
			lane: n.lane || undefined,
			connections: n.connections,
		})),
		transcript.reverse().map((t) => ({
			speaker: t.speaker,
			text: (t as any).correctedText ?? t.text,
			timestamp: t.timestamp,
		})),
		context,
	);

	console.log(`[Transcript] Extraction result for ${sessionId.substring(0, 8)}:`, {
		newNodes: result.newNodes?.length ?? 0,
		updatedNodes: result.updatedNodes?.length ?? 0,
		outOfScope: result.outOfScope?.length ?? 0,
	});

	// Create new diagram nodes
	if (result.newNodes && result.newNodes.length > 0) {
		for (const node of result.newNodes) {
			await db.diagramNode.create({
				data: {
					sessionId,
					nodeType: (node.type?.toUpperCase() || "TASK") as any,
					label: node.label,
					state: "FORMING",
					lane: node.lane || null,
					connections: [node.connectTo].filter(Boolean) as string[],
				},
			});
			console.log(`[Transcript] +Node: [${node.type}] "${node.label}" (lane: ${node.lane || "none"})`);
		}
	}

	// Apply updates to existing nodes
	if (result.updatedNodes && result.updatedNodes.length > 0) {
		for (const update of result.updatedNodes) {
			const updateData: Record<string, any> = {};
			if (update.label) updateData.label = update.label;
			// updatedNodes may also include type/lane from extended extraction
			const u = update as any;
			if (u.type) updateData.nodeType = u.type.toUpperCase();
			if (u.lane) updateData.lane = u.lane;

			if (Object.keys(updateData).length > 0) {
				await db.diagramNode.updateMany({
					where: { id: update.id, sessionId },
					data: updateData,
				});
				console.log(`[Transcript] ~Updated: "${update.id}" → ${JSON.stringify(updateData)}`);
			}
		}
	}

	if (result.newNodes?.length || result.updatedNodes?.length) {
		const total = (result.newNodes?.length || 0) + (result.updatedNodes?.length || 0);
		await setActivity(sessionId, "diagramming", `${total} cambios aplicados`).catch(() => {});
		// Return to listening after 3 seconds
		setTimeout(() => {
			setActivity(sessionId, "listening").catch(() => {});
		}, 3000);
	} else {
		console.log(`[Transcript] No changes from extraction for ${sessionId.substring(0, 8)}`);
		await setActivity(sessionId, "listening").catch(() => {});
	}
}
