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

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ clientId: string }> },
) {
	const orgId = await getOrgId();
	if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { clientId } = await params;

	const client = await db.client.findFirst({
		where: { id: clientId, organizationId: orgId },
		include: {
			projects: {
				include: { _count: { select: { sessions: true } } },
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

	return NextResponse.json(client);
}
