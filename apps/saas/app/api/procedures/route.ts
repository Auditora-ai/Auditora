import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const url = new URL(request.url);
		const processId = url.searchParams.get("processId");
		const status = url.searchParams.get("status");
		const orgSlug = url.searchParams.get("orgSlug");

		// Get org from slug or first membership
		const member = await db.member.findFirst({
			where: { userId: session.user.id },
			include: { organization: true },
		});
		if (!member) return NextResponse.json({ error: "No organization" }, { status: 403 });

		const where: Record<string, unknown> = { organizationId: member.organizationId };
		if (processId) where.processDefinitionId = processId;
		if (status) where.status = status;

		const procedures = await db.procedure.findMany({
			where,
			include: { processDefinition: { select: { name: true, level: true } } },
			orderBy: { updatedAt: "desc" },
		});

		return NextResponse.json({ procedures });
	} catch (error) {
		console.error("[Procedures] GET Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const body = await request.json();

		const member = await db.member.findFirst({
			where: { userId: session.user.id },
			include: { organization: true },
		});
		if (!member) return NextResponse.json({ error: "No organization" }, { status: 403 });

		// Mode A: Promote from existing SOP on a DiagramNode
		if (body.fromNodeId && body.sessionId) {
			const node = await db.diagramNode.findUnique({
				where: { id: body.fromNodeId },
				include: { session: { select: { processDefinitionId: true } } },
			});
			if (!node || !node.procedure) {
				return NextResponse.json({ error: "Node has no procedure" }, { status: 400 });
			}

			const sopData = node.procedure as Record<string, any>;
			const procedure = await db.procedure.create({
				data: {
					organizationId: member.organizationId,
					processDefinitionId: node.session.processDefinitionId!,
					nodeId: node.id,
					title: sopData.activityName || sopData.title || node.label,
					objective: sopData.objective || null,
					scope: sopData.scope || null,
					responsible: sopData.responsible || null,
					frequency: sopData.frequency || null,
					prerequisites: sopData.prerequisites || null,
					steps: sopData.steps || null,
					indicators: sopData.indicators || null,
					status: "DRAFT",
					createdBy: session.user.id,
				},
			});

			return NextResponse.json({ success: true, procedure });
		}

		// Mode B: Create from scratch
		if (!body.processDefinitionId || !body.title) {
			return NextResponse.json({ error: "processDefinitionId and title required" }, { status: 400 });
		}

		const procedure = await db.procedure.create({
			data: {
				organizationId: member.organizationId,
				processDefinitionId: body.processDefinitionId,
				title: body.title,
				objective: body.objective || null,
				scope: body.scope || null,
				responsible: body.responsible || null,
				frequency: body.frequency || null,
				status: "DRAFT",
				createdBy: session.user.id,
			},
		});

		return NextResponse.json({ success: true, procedure });
	} catch (error) {
		console.error("[Procedures] POST Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
