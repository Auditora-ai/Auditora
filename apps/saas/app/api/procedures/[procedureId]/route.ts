import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ procedureId: string }> },
) {
	try {
		const { procedureId } = await params;
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const procedure = await db.procedure.findUnique({
			where: { id: procedureId },
			include: {
				processDefinition: { select: { name: true, level: true } },
				linkedRisks: { select: { id: true, title: true, riskType: true, severity: true, probability: true, riskScore: true } },
			},
		});

		if (!procedure) return NextResponse.json({ error: "Not found" }, { status: 404 });

		return NextResponse.json(procedure);
	} catch (error) {
		console.error("[Procedure] GET Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ procedureId: string }> },
) {
	try {
		const { procedureId } = await params;
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const body = await request.json();
		const data: Record<string, unknown> = {};

		if (body.title !== undefined) data.title = body.title;
		if (body.objective !== undefined) data.objective = body.objective;
		if (body.scope !== undefined) data.scope = body.scope;
		if (body.responsible !== undefined) data.responsible = body.responsible;
		if (body.frequency !== undefined) data.frequency = body.frequency;
		if (body.prerequisites !== undefined) data.prerequisites = body.prerequisites;
		if (body.steps !== undefined) data.steps = body.steps;
		if (body.indicators !== undefined) data.indicators = body.indicators;
		if (body.richContent !== undefined) data.richContent = body.richContent;
		if (body.controlPointsSummary !== undefined) data.controlPointsSummary = body.controlPointsSummary;

		// Status change bumps version + snapshots current state
		if (body.status !== undefined) {
			data.status = body.status;
			const current = await db.procedure.findUnique({
				where: { id: procedureId },
				select: {
					version: true, status: true, title: true, objective: true,
					scope: true, responsible: true, frequency: true, prerequisites: true,
					steps: true, indicators: true, richContent: true, controlPointsSummary: true,
				},
			});
			if (current && body.status !== current.status) {
				// Snapshot current state before changing
				await db.procedureVersion.create({
					data: {
						procedureId,
						version: current.version,
						status: current.status,
						content: {
							title: current.title,
							objective: current.objective,
							scope: current.scope,
							responsible: current.responsible,
							frequency: current.frequency,
							prerequisites: current.prerequisites,
							steps: current.steps,
							indicators: current.indicators,
							richContent: current.richContent,
							controlPointsSummary: current.controlPointsSummary,
						},
						changeNote: body.changeNote || null,
						changedBy: session.user.id,
					},
				});

				if (body.status === "APPROVED" || body.status === "PUBLISHED") {
					data.version = current.version + 1;
					if (body.status === "APPROVED") {
						data.approvedBy = session.user.id;
						data.approvedAt = new Date();
					}
				}
			}
		}

		const procedure = await db.procedure.update({
			where: { id: procedureId },
			data,
			include: { processDefinition: { select: { name: true } } },
		});

		return NextResponse.json(procedure);
	} catch (error) {
		console.error("[Procedure] PATCH Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
