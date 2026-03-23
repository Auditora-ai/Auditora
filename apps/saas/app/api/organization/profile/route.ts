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
	if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const org = await db.organization.findUnique({
		where: { id: orgId },
		select: {
			industry: true,
			businessModel: true,
			operationsProfile: true,
			employeeCount: true,
			notes: true,
		},
	});

	return NextResponse.json(org);
}

export async function PUT(request: NextRequest) {
	const orgId = await getOrgId();
	if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();
	const { industry, businessModel, operationsProfile, employeeCount, notes } = body;

	const updated = await db.organization.update({
		where: { id: orgId },
		data: {
			industry: industry || null,
			businessModel: businessModel || null,
			operationsProfile: operationsProfile || null,
			employeeCount: employeeCount || null,
			notes: notes || null,
		},
		select: {
			industry: true,
			businessModel: true,
			operationsProfile: true,
			employeeCount: true,
			notes: true,
		},
	});

	return NextResponse.json(updated);
}
