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
	const orgs = await auth.api.listOrganizations({ headers: await headers() });
	return orgs?.[0]?.id ?? null;
}

// Public endpoint — templates are shared across organizations
export async function GET() {
	const templates = await db.processTemplate.findMany({
		orderBy: [{ industry: "asc" }, { name: "asc" }],
	});

	return NextResponse.json({ templates });
}

// Clone a template into a project's architecture
export async function POST(request: NextRequest) {
	const orgId = await getOrgId();
	if (!orgId)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();
	const { templateId } = body;

	if (!templateId) {
		return NextResponse.json(
			{ error: "templateId required" },
			{ status: 400 },
		);
	}

	// Get template
	const template = await db.processTemplate.findUnique({
		where: { id: templateId },
	});

	if (!template) {
		return NextResponse.json(
			{ error: "Template not found" },
			{ status: 404 },
		);
	}

	// Get or create architecture for this org
	let architecture = await db.processArchitecture.findUnique({
		where: { organizationId: orgId },
	});

	if (!architecture) {
		architecture = await db.processArchitecture.create({
			data: { organizationId: orgId },
		});
	}

	// Clone template processes into architecture
	const structure = template.structure as {
		processes: Array<{
			name: string;
			description?: string;
			category?: string;
			level?: string;
		}>;
	};

	const created = await Promise.all(
		structure.processes.map((p) =>
			db.processDefinition.create({
				data: {
					architectureId: architecture.id,
					name: p.name,
					description: p.description || null,
					level: "PROCESS",
					category: p.category || "core",
					processStatus: "DRAFT",
				},
			}),
		),
	);

	return NextResponse.json({
		message: `Created ${created.length} processes from ${template.name} template`,
		processes: created,
	});
}
