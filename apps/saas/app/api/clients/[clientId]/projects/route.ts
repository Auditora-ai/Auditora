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

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ clientId: string }> },
) {
	const orgId = await getOrgId();
	if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { clientId } = await params;

	// Verify client belongs to org
	const client = await db.client.findFirst({
		where: { id: clientId, organizationId: orgId },
	});
	if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

	const body = await request.json();
	const { name } = body;
	if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

	const project = await db.project.create({
		data: { name, clientId },
	});

	return NextResponse.json(project);
}
