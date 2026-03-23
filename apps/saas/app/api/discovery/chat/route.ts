/**
 * Discovery Chat API
 *
 * POST /api/discovery/chat — Send a message and get AI extraction response
 * GET  /api/discovery/chat?projectId=xxx — Get chat thread for a project
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { extractFromChat } from "@repo/ai";
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

		const projectId = request.nextUrl.searchParams.get("projectId");
		if (!projectId) {
			return NextResponse.json(
				{ error: "projectId is required" },
				{ status: 400 },
			);
		}

		// Get or create thread for this project
		let thread = await db.discoveryThread.findFirst({
			where: { projectId },
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
			},
			orderBy: { updatedAt: "desc" },
		});

		if (!thread) {
			thread = await db.discoveryThread.create({
				data: {
					projectId,
					createdBy: authCtx.user.id,
				},
				include: {
					messages: true,
				},
			});
		}

		return NextResponse.json({ thread });
	} catch (error) {
		console.error("[Discovery Chat GET]", error);
		return NextResponse.json(
			{ error: "Failed to load chat" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { projectId, message, threadId } = body;

		if (!projectId || !message) {
			return NextResponse.json(
				{ error: "projectId and message are required" },
				{ status: 400 },
			);
		}

		// Get or create thread
		let thread;
		if (threadId) {
			thread = await db.discoveryThread.findUnique({
				where: { id: threadId },
				include: { messages: { orderBy: { createdAt: "asc" } } },
			});
		}

		if (!thread) {
			thread = await db.discoveryThread.create({
				data: {
					projectId,
					createdBy: authCtx.user.id,
				},
				include: { messages: true },
			});
		}

		// Save user message
		await db.discoveryMessage.create({
			data: {
				threadId: thread.id,
				role: "user",
				content: message,
			},
		});

		// Get existing processes for this project
		const project = await db.project.findUnique({
			where: { id: projectId },
			include: {
				client: true,
				architecture: {
					include: {
						definitions: {
							select: {
								name: true,
								level: true,
								category: true,
							},
						},
					},
				},
			},
		});

		const existingProcesses =
			project?.architecture?.definitions.map((d) => ({
				name: d.name,
				level: d.level,
				category: d.category ?? undefined,
			})) ?? [];

		// Build messages array for pipeline (include history)
		const allMessages = [
			...thread.messages.map((m) => ({
				role: m.role,
				content: m.content,
			})),
			{ role: "user", content: message },
		];

		// Run extraction pipeline
		const result = await extractFromChat(allMessages, existingProcesses, {
			clientName: project?.client?.name,
			clientIndustry: project?.client?.industry ?? undefined,
			projectGoals: project?.goals?.join(", "),
		});

		// Save assistant response
		const assistantMessage = await db.discoveryMessage.create({
			data: {
				threadId: thread.id,
				role: "assistant",
				content: result.conversationalResponse,
				extractedProcesses:
					result.extractedProcesses.length > 0
						? JSON.parse(JSON.stringify(result.extractedProcesses))
						: undefined,
			},
		});

		return NextResponse.json({
			threadId: thread.id,
			message: assistantMessage,
			extractedProcesses: result.extractedProcesses,
			followUpQuestion: result.followUpQuestion,
		});
	} catch (error) {
		console.error("[Discovery Chat POST]", error);
		return NextResponse.json(
			{ error: "Failed to process message" },
			{ status: 500 },
		);
	}
}
