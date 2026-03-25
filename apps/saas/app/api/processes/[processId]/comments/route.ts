import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const { processId } = await params;

	const authResult = await requireProcessAuth(processId);
	if (isAuthError(authResult)) return authResult;

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
	const { processId } = await params;

	const authResult = await requireProcessAuth(processId);
	if (isAuthError(authResult)) return authResult;

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
			authorId: authResult.authCtx.user.id,
			authorName: authResult.authCtx.user.name || authResult.authCtx.user.email || "Unknown",
		},
	});

	return NextResponse.json({ comment }, { status: 201 });
}
