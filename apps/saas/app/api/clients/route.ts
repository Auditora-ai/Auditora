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

export async function GET() {
	const orgId = await getOrgId();
	if (!orgId) return NextResponse.json([], { status: 401 });

	const clients = await db.client.findMany({
		where: { organizationId: orgId },
		include: { _count: { select: { projects: true } } },
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
	const orgId = await getOrgId();
	if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();
	const { name } = body;
	if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

	const client = await db.client.create({
		data: { name, organizationId: orgId },
	});

	return NextResponse.json(client);
}
