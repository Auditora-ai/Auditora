import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

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

	const comments = await db.nodeComment.findMany({
		where: { node: { session: { processDefinitionId: processId } } },
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json({ comments });
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const session = await getSession();
	if (!session?.user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { processId } = await params;
	const body = await request.json();
	const { nodeId, content } = body;

	if (!nodeId || !content) {
		return NextResponse.json(
			{ error: "nodeId and content required" },
			{ status: 400 },
		);
	}

	// Verify node belongs to a session of this process
	const node = await db.diagramNode.findFirst({
		where: {
			id: nodeId,
			session: { processDefinitionId: processId },
		},
	});

	if (!node) {
		return NextResponse.json({ error: "Node not found" }, { status: 404 });
	}

	const comment = await db.nodeComment.create({
		data: {
			nodeId,
			content,
			authorId: session.user.id,
			authorName: session.user.name || session.user.email || "Unknown",
		},
	});

	return NextResponse.json({ comment }, { status: 201 });
}
