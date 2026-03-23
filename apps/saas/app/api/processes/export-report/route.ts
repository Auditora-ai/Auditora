import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import {
	generateReportHtml,
	type PdfProcessData,
	type PdfProjectData,
} from "../../../lib/export/pdf-generator";

async function getSession() {
	return auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
}

export async function POST(request: NextRequest) {
	const session = await getSession();
	if (!session?.user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const orgs = await auth.api.listOrganizations({ headers: await headers() });
	const org = orgs?.[0];
	if (!org)
		return NextResponse.json({ error: "No organization" }, { status: 400 });

	const body = await request.json();
	const svgMap: Record<string, string> = body.svgMap || {};

	// Load architecture with all related data
	const architecture = await db.processArchitecture.findUnique({
		where: { organizationId: org.id },
		include: {
			organization: true,
			definitions: {
				where: { level: "PROCESS" },
				include: {
					raciEntries: true,
					sessions: {
						where: { status: "ENDED" },
						include: {
							diagramNodes: {
								where: { state: "CONFIRMED" },
								include: { comments: true },
							},
							sessionSummary: true,
						},
						orderBy: { endedAt: "desc" },
					},
				},
				orderBy: { name: "asc" },
			},
		},
	});

	if (!architecture) {
		return NextResponse.json(
			{ error: "No process architecture found" },
			{ status: 404 },
		);
	}

	const processes: PdfProcessData[] = architecture.definitions.map((d) => {
		const allComments = d.sessions.flatMap((s) =>
			s.diagramNodes.flatMap((n) =>
				n.comments.map((c) => ({
					content: c.content,
					authorName: c.authorName,
					createdAt: c.createdAt.toISOString(),
				})),
			),
		);

		return {
			id: d.id,
			name: d.name,
			description: d.description,
			goals: d.goals,
			triggers: d.triggers,
			outputs: d.outputs,
			svgDiagram: svgMap[d.id] || undefined,
			comments: allComments.length > 0 ? allComments : undefined,
		};
	});

	const raciEntries = architecture.definitions.flatMap((d) =>
		d.raciEntries.map((r) => ({
			activityName: r.activityName,
			role: r.role,
			assignment: r.assignment.charAt(0),
		})),
	);

	const actionItems = architecture.definitions.flatMap((d) =>
		d.sessions.flatMap((s) => s.sessionSummary?.actionItems || []),
	);

	const sessionHistory = architecture.definitions.flatMap((d) =>
		d.sessions.map((s) => ({
			type: s.type,
			date: s.endedAt?.toLocaleDateString("es-ES") || "N/A",
			status: s.status,
		})),
	);

	const reportData: PdfProjectData = {
		clientName: architecture.organization.name,
		projectName: "Process Architecture Report",
		organizationName: org.name,
		date: new Date().toLocaleDateString("es-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}),
		processes,
		raciEntries: raciEntries.length > 0 ? raciEntries : undefined,
		actionItems: actionItems.length > 0 ? actionItems : undefined,
		sessionHistory: sessionHistory.length > 0 ? sessionHistory : undefined,
	};

	const html = generateReportHtml(reportData);

	return new NextResponse(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Content-Disposition": `inline; filename="${org.name}-Process-Report.html"`,
		},
	});
}
