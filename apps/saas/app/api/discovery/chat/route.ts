/**
 * Discovery Chat API
 *
 * POST /api/discovery/chat — Send a message and get AI extraction response
 * GET  /api/discovery/chat — Get chat thread for the organization (optionally scoped by processId)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { extractFromChat } from "@repo/ai";
import type { ProcessChatContext } from "@repo/ai";
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

/**
 * Resolve processId from either explicit param or sessionId lookup.
 */
async function resolveProcessId(
	processId?: string,
	sessionId?: string,
): Promise<string | null> {
	if (processId) return processId;
	if (!sessionId) return null;

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		select: { processDefinitionId: true },
	});
	return session?.processDefinitionId ?? null;
}

/**
 * Build process-specific context for the AI pipeline.
 */
async function buildProcessChatContext(
	processId: string,
	rejectedNames: string[],
): Promise<ProcessChatContext | undefined> {
	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		include: {
			parent: { select: { name: true } },
			intelligence: {
				select: {
					completenessScore: true,
					items: {
						where: { status: "OPEN" },
						select: { question: true, category: true, priority: true },
						orderBy: { priority: "desc" },
						take: 5,
					},
				},
			},
		},
	});

	if (!process) return undefined;

	// Get siblings (same parent, different id)
	const siblings = await db.processDefinition.findMany({
		where: {
			architectureId: process.architectureId,
			parentId: process.parentId,
			id: { not: process.id },
		},
		select: { name: true },
	});

	return {
		targetProcess: {
			name: process.name,
			level: process.level,
			description: process.description ?? undefined,
			triggers: process.triggers,
			outputs: process.outputs,
			goals: process.goals,
			owner: process.owner ?? undefined,
			siblings: siblings.map((s) => s.name),
		},
		intelligenceGaps: process.intelligence?.items ?? undefined,
		completenessScore: process.intelligence?.completenessScore ?? undefined,
		rejectedNames: rejectedNames.length > 0 ? rejectedNames : undefined,
	};
}

export async function GET(request: NextRequest) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const explicitProcessId = searchParams.get("processId");
		const sessionId = searchParams.get("sessionId");
		const processId = await resolveProcessId(
			explicitProcessId ?? undefined,
			sessionId ?? undefined,
		);

		// Find thread scoped by org + optional processId
		let thread = await db.discoveryThread.findFirst({
			where: {
				organizationId: authCtx.org.id,
				processDefinitionId: processId ?? null,
			},
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
					organizationId: authCtx.org.id,
					processDefinitionId: processId ?? undefined,
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
		const { message, threadId, sessionId, transcriptContext, processId: explicitProcessId } = body;

		if (!message) {
			return NextResponse.json(
				{ error: "message is required" },
				{ status: 400 },
			);
		}

		const orgId = authCtx.org.id;

		// Resolve processId: explicit > sessionId lookup > null
		const resolvedProcessId = await resolveProcessId(
			explicitProcessId,
			sessionId,
		);

		// Get or create thread scoped to org + process
		let thread;
		if (threadId) {
			thread = await db.discoveryThread.findUnique({
				where: { id: threadId },
				include: { messages: { orderBy: { createdAt: "asc" } } },
			});
		}

		if (!thread) {
			// Look for existing thread for this org+process combo
			thread = await db.discoveryThread.findFirst({
				where: {
					organizationId: orgId,
					processDefinitionId: resolvedProcessId ?? null,
				},
				include: { messages: { orderBy: { createdAt: "asc" } } },
				orderBy: { updatedAt: "desc" },
			});
		}

		if (!thread) {
			thread = await db.discoveryThread.create({
				data: {
					organizationId: orgId,
					processDefinitionId: resolvedProcessId ?? undefined,
					createdBy: authCtx.user.id,
				},
				include: { messages: { orderBy: { createdAt: "asc" } } },
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

		// Get existing processes and org context
		const org = await db.organization.findUnique({
			where: { id: orgId },
		});

		const architecture = await db.processArchitecture.findUnique({
			where: { organizationId: orgId },
			include: {
				definitions: {
					select: {
						name: true,
						level: true,
						category: true,
					},
				},
			},
		});

		const existingProcesses =
			architecture?.definitions.map((d) => ({
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

		// Build process-specific context if we have a processId
		let processContext: ProcessChatContext | undefined;
		if (resolvedProcessId) {
			try {
				processContext = await buildProcessChatContext(
					resolvedProcessId,
					thread.rejectedProcessNames,
				);
			} catch (err) {
				console.warn("[Discovery Chat] Failed to build process context, falling back to org-level:", err);
			}
		}

		// Run extraction pipeline
		const result = await extractFromChat(
			allMessages,
			existingProcesses,
			{
				clientName: org?.name,
				clientIndustry: org?.industry ?? undefined,
				liveTranscript: transcriptContext ?? undefined,
			},
			processContext,
		);

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
