import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ procedureId: string }> },
) {
	try {
		const { procedureId } = await params;
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const versions = await db.procedureVersion.findMany({
			where: { procedureId },
			orderBy: { version: "desc" },
			select: {
				id: true,
				version: true,
				status: true,
				changeNote: true,
				changedBy: true,
				changedAt: true,
			},
		});

		return NextResponse.json({ versions });
	} catch (error) {
		console.error("[Procedure Versions] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
