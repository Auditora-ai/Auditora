import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { getOrganizationUsage } from "@repo/payments/lib/usage";

const paramsSchema = z.object({
	orgId: z.string().min(1),
});

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ orgId: string }> },
) {
	try {
		const { orgId } = await params;

		// Validate input
		const parsed = paramsSchema.safeParse({ orgId });
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid organization ID" },
				{ status: 400 },
			);
		}

		// Verify authenticated user
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Verify user is a member of the organization
		const member = await db.member.findFirst({
			where: {
				userId: session.user.id,
				organizationId: orgId,
			},
		});

		if (!member) {
			return NextResponse.json(
				{ error: "Not a member of this organization" },
				{ status: 403 },
			);
		}

		// Compute usage
		const usage = await getOrganizationUsage(orgId);

		return NextResponse.json(usage);
	} catch (error) {
		console.error("[Usage] GET error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
