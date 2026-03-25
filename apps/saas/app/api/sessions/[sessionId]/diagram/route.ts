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

		const { bpmnXml } = await request.json();

		if (!bpmnXml || typeof bpmnXml !== "string") {
			return NextResponse.json(
				{ error: "bpmnXml is required" },
				{ status: 400 },
			);
		}

		await db.meetingSession.update({
			where: { id: sessionId },
			data: { bpmnXml },
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[SaveDiagram] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
