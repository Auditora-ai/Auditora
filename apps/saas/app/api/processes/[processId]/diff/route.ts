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

/**
 * GET /api/processes/[processId]/diff?v1=versionId1&v2=versionId2
 *
 * Returns the BPMN XML for two versions to enable client-side diff.
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const session = await getSession();
	if (!session?.user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { processId } = await params;
	const { searchParams } = new URL(request.url);
	const v1 = searchParams.get("v1");
	const v2 = searchParams.get("v2");

	if (!v1 || !v2) {
		return NextResponse.json(
			{ error: "v1 and v2 query params required" },
			{ status: 400 },
		);
	}

	const [version1, version2] = await Promise.all([
		db.processVersion.findFirst({
			where: { id: v1, processDefinitionId: processId },
			select: { id: true, version: true, bpmnXml: true, createdAt: true },
		}),
		db.processVersion.findFirst({
			where: { id: v2, processDefinitionId: processId },
			select: { id: true, version: true, bpmnXml: true, createdAt: true },
		}),
	]);

	if (!version1 || !version2) {
		return NextResponse.json(
			{ error: "One or both versions not found" },
			{ status: 404 },
		);
	}

	return NextResponse.json({
		v1: version1,
		v2: version2,
	});
}
