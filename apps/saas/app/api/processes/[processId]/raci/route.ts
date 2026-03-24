import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { generateRaci } from "@repo/ai";

async function getSession() {
	return auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
}

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const session = await getSession();
	if (!session?.user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { processId } = await params;

	const entries = await db.raciEntry.findMany({
		where: { processId },
		orderBy: { activityName: "asc" },
	});

	return NextResponse.json({ entries });
}

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const session = await getSession();
	if (!session?.user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { processId } = await params;

	// Get sessions for this process
	const sessions = await db.meetingSession.findMany({
		where: { processDefinitionId: processId, status: "ENDED" },
		include: {
			diagramNodes: { where: { state: "CONFIRMED" } },
			transcriptEntries: { orderBy: { timestamp: "asc" }, take: 200 },
		},
	});

	if (sessions.length === 0) {
		return NextResponse.json(
			{ error: "No completed sessions found for this process" },
			{ status: 400 },
		);
	}

	// Collect lanes and task labels from all sessions
	const lanes = [
		...new Set(
			sessions.flatMap((s) =>
				s.diagramNodes
					.filter((n) => n.lane)
					.map((n) => n.lane as string),
			),
		),
	];

	const taskLabels = [
		...new Set(
			sessions.flatMap((s) =>
				s.diagramNodes
					.filter((n) =>
						["TASK", "USER_TASK", "SERVICE_TASK", "MANUAL_TASK", "BUSINESS_RULE_TASK"].includes(
							n.nodeType,
						),
					)
					.map((n) => n.label),
			),
		),
	];

	const transcriptExcerpts = sessions
		.flatMap((s) => s.transcriptEntries.map((t) => `${t.speaker}: ${t.text}`))
		.join("\n");

	// Generate RACI via AI
	const result = await generateRaci(lanes, taskLabels, transcriptExcerpts);

	// Delete existing entries and insert new ones
	await db.raciEntry.deleteMany({ where: { processId } });

	const raciTypeMap: Record<string, "RESPONSIBLE" | "ACCOUNTABLE" | "CONSULTED" | "INFORMED"> = {
		R: "RESPONSIBLE",
		A: "ACCOUNTABLE",
		C: "CONSULTED",
		I: "INFORMED",
	};

	if (result.assignments.length > 0) {
		await db.raciEntry.createMany({
			data: result.assignments.map((a) => ({
				processId,
				activityName: a.activityName,
				role: a.role,
				assignment: raciTypeMap[a.assignment] || "RESPONSIBLE",
				source: "ai-generated",
			})),
		});
	}

	const entries = await db.raciEntry.findMany({
		where: { processId },
		orderBy: { activityName: "asc" },
	});

	return NextResponse.json({ entries });
}

const VALID_ASSIGNMENTS = ["RESPONSIBLE", "ACCOUNTABLE", "CONSULTED", "INFORMED"] as const;

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const session = await getSession();
	if (!session?.user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { processId } = await params;
	const body = await request.json();
	const { entryId, activityName, role, assignment } = body;

	if (!assignment || !VALID_ASSIGNMENTS.includes(assignment)) {
		return NextResponse.json(
			{ error: `Invalid assignment. Must be one of: ${VALID_ASSIGNMENTS.join(", ")}` },
			{ status: 400 },
		);
	}

	// Update existing entry by ID
	if (entryId) {
		const entry = await db.raciEntry.findUnique({ where: { id: entryId } });
		if (!entry || entry.processId !== processId) {
			return NextResponse.json({ error: "Entry not found" }, { status: 404 });
		}

		const updated = await db.raciEntry.update({
			where: { id: entryId },
			data: { assignment, source: "manual-edit" },
		});

		return NextResponse.json({ entry: updated });
	}

	// Upsert by activityName + role
	if (activityName && role) {
		const existing = await db.raciEntry.findFirst({
			where: { processId, activityName, role },
		});

		if (existing) {
			const updated = await db.raciEntry.update({
				where: { id: existing.id },
				data: { assignment, source: "manual-edit" },
			});
			return NextResponse.json({ entry: updated });
		}

		const created = await db.raciEntry.create({
			data: {
				processId,
				activityName: activityName.trim(),
				role: role.trim(),
				assignment,
				source: "manual-edit",
			},
		});
		return NextResponse.json({ entry: created });
	}

	return NextResponse.json(
		{ error: "Provide entryId or activityName + role" },
		{ status: 400 },
	);
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const session = await getSession();
	if (!session?.user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { processId } = await params;
	const body = await request.json();
	const { entryId, activityName } = body;

	if (entryId) {
		const entry = await db.raciEntry.findUnique({ where: { id: entryId } });
		if (!entry || entry.processId !== processId) {
			return NextResponse.json({ error: "Entry not found" }, { status: 404 });
		}
		await db.raciEntry.delete({ where: { id: entryId } });
		return NextResponse.json({ success: true });
	}

	if (activityName) {
		await db.raciEntry.deleteMany({ where: { processId, activityName } });
		return NextResponse.json({ success: true });
	}

	return NextResponse.json(
		{ error: "Provide entryId or activityName" },
		{ status: 400 },
	);
}
