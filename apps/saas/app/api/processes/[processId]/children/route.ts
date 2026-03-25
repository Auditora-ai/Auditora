import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	try {
		const { processId } = await params;

		const authResult = await requireProcessAuth(processId);
		if (isAuthError(authResult)) return authResult;

		const { name, level, description } = await request.json();

		if (!name || !level) {
			return NextResponse.json(
				{ error: "name and level are required" },
				{ status: 400 },
			);
		}

		// Get parent process to find architectureId
		const parent = await db.processDefinition.findUnique({
			where: { id: processId },
			select: { architectureId: true },
		});

		if (!parent) {
			return NextResponse.json({ error: "Parent process not found" }, { status: 404 });
		}

		const child = await db.processDefinition.create({
			data: {
				name,
				level,
				description: description || null,
				parentId: processId,
				architectureId: parent.architectureId,
			},
		});

		return NextResponse.json(child);
	} catch (error) {
		console.error("[CreateChild] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
