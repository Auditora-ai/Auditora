/**
 * Discovery Accept API
 *
 * POST /api/discovery/accept — Accept an extracted process and create a ProcessDefinition
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

export async function POST(request: NextRequest) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { projectId, process } = body;

		if (!projectId || !process?.name) {
			return NextResponse.json(
				{ error: "projectId and process.name are required" },
				{ status: 400 },
			);
		}

		// Get or create architecture for project
		let architecture = await db.processArchitecture.findUnique({
			where: { projectId },
		});

		if (!architecture) {
			architecture = await db.processArchitecture.create({
				data: { projectId },
			});
		}

		// Check for duplicate
		const existing = await db.processDefinition.findFirst({
			where: {
				architectureId: architecture.id,
				name: { equals: process.name, mode: "insensitive" },
			},
		});

		if (existing) {
			return NextResponse.json(
				{
					error: "duplicate",
					existingProcess: existing,
					message: `A process named "${existing.name}" already exists`,
				},
				{ status: 409 },
			);
		}

		// Create the process definition
		const definition = await db.processDefinition.create({
			data: {
				architectureId: architecture.id,
				name: process.name,
				description: process.description ?? null,
				level: process.suggestedLevel ?? "PROCESS",
				category: process.suggestedCategory ?? null,
				owner: process.owner ?? null,
				triggers: process.triggers ?? [],
				outputs: process.outputs ?? [],
				processStatus: "DRAFT",
			},
		});

		return NextResponse.json({ process: definition });
	} catch (error) {
		console.error("[Discovery Accept POST]", error);
		return NextResponse.json(
			{ error: "Failed to accept process" },
			{ status: 500 },
		);
	}
}
