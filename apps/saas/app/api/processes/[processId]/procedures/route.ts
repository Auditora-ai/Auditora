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

	const procedures = await db.procedure.findMany({
		where: { processDefinitionId: processId },
		select: {
			id: true,
			title: true,
			status: true,
			version: true,
			responsible: true,
			nodeId: true,
			updatedAt: true,
		},
		orderBy: { updatedAt: "desc" },
	});

	return NextResponse.json(
		procedures.map((p) => ({
			...p,
			updatedAt: p.updatedAt.toISOString(),
		})),
	);
}
