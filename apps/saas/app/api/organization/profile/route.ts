import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { z } from "zod";

async function getOrgId() {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;

	// Use active organization from session, not first org
	if (session.session.activeOrganizationId) {
		return session.session.activeOrganizationId;
	}

	// Fallback: if no active org set, use first org
	const orgs = await auth.api.listOrganizations({
		headers: await headers(),
	});
	return orgs?.[0]?.id ?? null;
}

const updateProfileSchema = z.object({
	companyName: z.string().nullable().optional(),
	industry: z.string().nullable().optional(),
	businessModel: z.string().nullable().optional(),
	operationsProfile: z.string().nullable().optional(),
	employeeCount: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
});

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
	const parsed = updateProfileSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
	}
	const { companyName, industry, businessModel, operationsProfile, employeeCount, notes } = parsed.data;

	const updated = await db.organization.update({
		where: { id: orgId },
		data: {
			...(companyName !== undefined ? { name: companyName } : {}),
			industry: industry || null,
			businessModel: businessModel || null,
			operationsProfile: operationsProfile || null,
			employeeCount: employeeCount || null,
			notes: notes || null,
		},
		select: {
			name: true,
			industry: true,
			businessModel: true,
			operationsProfile: true,
			employeeCount: true,
			notes: true,
		},
	});

	return NextResponse.json(updated);
}
