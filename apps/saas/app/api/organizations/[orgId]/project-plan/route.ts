import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ orgId: string }> },
) {
	try {
		const { orgId } = await params;
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const architecture = await db.processArchitecture.findUnique({
			where: { organizationId: orgId },
			select: { projectPlan: true },
		});

		return NextResponse.json({ projectPlan: architecture?.projectPlan || null });
	} catch (error) {
		console.error("[ProjectPlan] GET error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ orgId: string }> },
) {
	try {
		const { orgId } = await params;
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const body = await request.json();
		const { architectureId, projectPlan } = body;

		if (!architectureId || !projectPlan) {
			return NextResponse.json({ error: "architectureId and projectPlan required" }, { status: 400 });
		}

		await db.processArchitecture.update({
			where: { id: architectureId },
			data: { projectPlan },
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[ProjectPlan] PUT error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
