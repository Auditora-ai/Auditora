import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { extractFromDocument } from "@repo/ai";

async function getOrgId() {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;
	const orgs = await auth.api.listOrganizations({ headers: await headers() });
	return orgs?.[0]?.id ?? null;
}

export async function POST(request: NextRequest) {
	const orgId = await getOrgId();
	if (!orgId)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();
	const { documentId } = body;

	if (!documentId) {
		return NextResponse.json(
			{ error: "documentId required" },
			{ status: 400 },
		);
	}

	// Get document with extracted text
	const document = await db.document.findFirst({
		where: {
			id: documentId,
			organizationId: orgId,
		},
	});

	if (!document || !document.extractedText) {
		return NextResponse.json(
			{
				error: document
					? "Document has no extracted text"
					: "Document not found",
			},
			{ status: 404 },
		);
	}

	// Get or create architecture for this organization
	let architecture = await db.processArchitecture.findUnique({
		where: { organizationId: orgId },
		include: { definitions: { select: { name: true } } },
	});

	if (!architecture) {
		architecture = await db.processArchitecture.create({
			data: { organizationId: orgId },
			include: { definitions: { select: { name: true } } },
		});
	}

	const existingNames = architecture.definitions.map((d) => d.name);

	// Extract processes from document
	const result = await extractFromDocument(
		document.extractedText,
		existingNames,
	);

	if (result.processes.length === 0) {
		return NextResponse.json({
			message: "No processes found in document",
			processes: [],
		});
	}

	// Create ProcessDefinition records
	const created = await Promise.all(
		result.processes.map((p) =>
			db.processDefinition.create({
				data: {
					architectureId: architecture.id,
					name: p.name,
					description: p.description || null,
					level: "PROCESS",
					category: p.category,
					owner: p.owner || null,
					goals: p.goals,
					triggers: p.triggers,
					outputs: p.outputs,
					processStatus: "DRAFT",
				},
			}),
		),
	);

	return NextResponse.json({
		message: `Extracted ${created.length} processes`,
		processes: created,
	});
}
