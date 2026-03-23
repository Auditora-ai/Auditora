import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

async function getOrgId() {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;

	const orgs = await auth.api.listOrganizations({
		headers: await headers(),
	});
	return orgs?.[0]?.id ?? null;
}

export async function GET(request: NextRequest) {
	const orgId = await getOrgId();
	if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const projectId = request.nextUrl.searchParams.get("projectId");
	if (!projectId) {
		return NextResponse.json({ error: "projectId required" }, { status: 400 });
	}

	// Verify project belongs to this org
	const project = await db.project.findFirst({
		where: { id: projectId, client: { organizationId: orgId } },
	});
	if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

	const architecture = await db.processArchitecture.findUnique({
		where: { projectId },
		include: {
			definitions: {
				include: {
					children: true,
				},
				orderBy: { priority: "asc" },
			},
		},
	});

	return NextResponse.json({
		definitions: architecture?.definitions ?? [],
	});
}
