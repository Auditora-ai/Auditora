/**
 * AI Interview Topic Suggestions
 *
 * GET /api/sessions/interview/suggestions
 *
 * Returns suggested topics for starting an AI Interview based on
 * the organization's existing processes and risk gaps.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

async function getAuthContext() {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;

	const orgs = await auth.api.listOrganizations({
		headers: await headers(),
	});
	const activeOrg = orgs?.[0];
	if (!activeOrg) return null;

	return { user: session.user, org: activeOrg };
}

export async function GET(request: NextRequest) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { org } = authCtx;

		// Fetch org's process architecture
		const architecture = await db.processArchitecture.findUnique({
			where: { organizationId: org.id },
			include: {
				definitions: {
					where: { level: "PROCESS" },
					select: {
						id: true,
						name: true,
						processStatus: true,
						_count: {
							select: {
								risks: { where: { status: { not: "CLOSED" } } },
								sessions: { where: { type: "AI_INTERVIEW" } },
							},
						},
					},
					orderBy: { createdAt: "desc" },
					take: 20,
				},
			},
		});

		const suggestions: Array<{
			id: string;
			label: string;
			description: string;
			type: "deepen" | "explore" | "new";
			processId?: string;
		}> = [];

		if (architecture?.definitions) {
			// Processes with risks but no AI Interview yet → "Profundizar"
			const processesWithRisks = architecture.definitions
				.filter((p) => p._count.risks > 0 && p._count.sessions === 0)
				.slice(0, 2);

			for (const p of processesWithRisks) {
				suggestions.push({
					id: `deepen-${p.id}`,
					label: p.name,
					description: `${p._count.risks} riesgos identificados`,
					type: "deepen",
					processId: p.id,
				});
			}

			// Processes without much data → "Explorar"
			const undocumented = architecture.definitions
				.filter((p) => p.processStatus === "DRAFT" && p._count.risks === 0)
				.slice(0, 2);

			for (const p of undocumented) {
				suggestions.push({
					id: `explore-${p.id}`,
					label: p.name,
					description: "Sin documentar",
					type: "explore",
					processId: p.id,
				});
			}
		}

		// Always offer "New process"
		suggestions.push({
			id: "new",
			label: "Nuevo proceso",
			description: "Descubre un proceso nuevo",
			type: "new",
		});

		return NextResponse.json({ suggestions: suggestions.slice(0, 4) });
	} catch (error) {
		console.error("[Interview Suggestions] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
