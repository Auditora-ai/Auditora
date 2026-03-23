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

	const architecture = await db.processArchitecture.findUnique({
		where: { organizationId: orgId },
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
