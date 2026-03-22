import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	try {
		const { processId } = await params;

		const process = await db.processDefinition.findUnique({
			where: { id: processId },
			include: {
				parent: { select: { id: true, name: true, level: true } },
				children: {
					select: { id: true, name: true, level: true, processStatus: true },
					orderBy: { priority: "asc" },
				},
				sessions: {
					select: {
						id: true,
						type: true,
						status: true,
						createdAt: true,
						endedAt: true,
						_count: { select: { diagramNodes: true } },
					},
					orderBy: { createdAt: "desc" },
					take: 10,
				},
				versions: {
					select: { version: true, changeNote: true, createdBy: true, createdAt: true },
					orderBy: { version: "desc" },
					take: 20,
				},
				architecture: {
					select: {
						projectId: true,
						project: {
							select: {
								id: true,
								name: true,
								clientId: true,
								client: { select: { id: true, name: true } },
							},
						},
					},
				},
			},
		});

		if (!process) {
			return NextResponse.json({ error: "Process not found" }, { status: 404 });
		}

		return NextResponse.json(process);
	} catch (error) {
		console.error("[ProcessDetail] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
			query: { disableCookieCache: true },
		});
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { processId } = await params;
		const body = await request.json();

		const { name, description, owner, goals, triggers, outputs, processStatus } = body;

		const updated = await db.processDefinition.update({
			where: { id: processId },
			data: {
				...(name !== undefined && { name }),
				...(description !== undefined && { description }),
				...(owner !== undefined && { owner }),
				...(goals !== undefined && { goals }),
				...(triggers !== undefined && { triggers }),
				...(outputs !== undefined && { outputs }),
				...(processStatus !== undefined && { processStatus }),
			},
		});

		return NextResponse.json(updated);
	} catch (error) {
		console.error("[ProcessUpdate] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
