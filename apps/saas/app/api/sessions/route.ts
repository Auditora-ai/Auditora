/**
 * Session Management API
 *
 * POST /api/sessions — Create a new meeting session and join the call
 * GET  /api/sessions — List sessions for the current user's organization
 */

import { NextRequest, NextResponse } from "next/server";
import { db, getPurchasesByOrganizationId } from "@repo/database";
import { createCallBotProvider } from "@repo/ai";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { recordEvent } from "@meeting/lib/session-timeline";
import { randomBytes } from "crypto";
import { buildBpmnXml } from "@meeting/lib/bpmn-builder";
import type { DiagramNode } from "@meeting/types";

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
			return NextResponse.json(
				{ error: "Unauthorized. Please log in." },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const {
			meetingUrl,
			sessionType,
			processDefinitionId,
			continuationOf,
			scheduledFor,
			scheduledEnd,
			sessionGoals,
			contactName,
			contactEmail,
			contactRole,
			// Wizard fields (optional, additive)
			participants,
			sessionContext,
			wizardNonce,
			preBuildNodes,
			preBuildLanes,
		} = body as {
			meetingUrl?: string;
			sessionType?: string;
			processDefinitionId?: string;
			continuationOf?: string;
			scheduledFor?: string;
			scheduledEnd?: string;
			sessionGoals?: string;
			contactName?: string;
			contactEmail?: string;
			contactRole?: string;
			participants?: Array<{ name: string; email?: string; role?: string }>;
			sessionContext?: string;
			wizardNonce?: string;
			preBuildNodes?: Array<{ id: string; type: string; label: string; lane?: string; connectFrom?: string | null }>;
			preBuildLanes?: string[];
		};

		const isEditMode = body.editMode === true && !meetingUrl;
		const isScheduled = !!scheduledFor && !meetingUrl && !isEditMode;

		if (!isScheduled && !isEditMode && !meetingUrl) {
			return NextResponse.json(
				{ error: "meetingUrl is required (or provide scheduledFor for pre-scheduled sessions, or editMode for offline editing)" },
				{ status: 400 },
			);
		}
		if (!sessionType) {
			return NextResponse.json(
				{ error: "sessionType is required" },
				{ status: 400 },
			);
		}

		const { user, org } = authCtx;

		// Billing check: org must have active subscription or trial
		const purchases = await getPurchasesByOrganizationId(org.id);
		const hasActivePlan = purchases.some(
			(p) => p.status === "active" || p.status === "trialing",
		);
		if (!hasActivePlan) {
			return NextResponse.json(
				{ error: "Se requiere un plan activo para crear sesiones. Activa tu suscripción en Configuración." },
				{ status: 402 },
			);
		}

		// For DISCOVERY: auto-create ProcessArchitecture if not exists
		if (sessionType === "DISCOVERY") {
			const existingArch = await db.processArchitecture.findUnique({
				where: { organizationId: org.id },
			});
			if (!existingArch) {
				await db.processArchitecture.create({
					data: { organizationId: org.id },
				});
			}
		}

		// Determine initial status
		const initialStatus = isEditMode
			? ("ACTIVE" as const)
			: isScheduled
				? ("SCHEDULED" as const)
				: ("CONNECTING" as const);

		// Create session in DB
		const session = await db.meetingSession.create({
			data: {
				type: sessionType as "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION",
				status: initialStatus,
				meetingUrl: meetingUrl || undefined,
				organizationId: org.id,
				userId: user.id,
				processDefinitionId: processDefinitionId || undefined,
				continuationOf: continuationOf || undefined,
				scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
				scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
				sessionGoals: sessionGoals || undefined,
				sessionContext: sessionContext || undefined,
			},
		});

		// Auto-link to previous session for context continuity (teleprompter, AI context)
		if (processDefinitionId && !continuationOf) {
			const prevSession = await db.meetingSession.findFirst({
				where: { processDefinitionId, status: "ENDED" },
				orderBy: { endedAt: "desc" },
				select: { id: true, sessionGoals: true, sessionContext: true },
			});
			if (prevSession) {
				const inheritData: Record<string, any> = { continuationOf: prevSession.id };
				// Inherit goals/context if not provided for this session
				if (!sessionGoals && prevSession.sessionGoals) {
					inheritData.sessionGoals = prevSession.sessionGoals;
				}
				if (!sessionContext && prevSession.sessionContext) {
					inheritData.sessionContext = prevSession.sessionContext;
				}
				await db.meetingSession.update({
					where: { id: session.id },
					data: inheritData,
				});
			}
		}

		// Seed diagram nodes from previous session for process continuations
		if (processDefinitionId && (!preBuildNodes || preBuildNodes.length === 0)) {
			try {
				await seedNodesFromPreviousSession(session.id, processDefinitionId);
			} catch (err) {
				console.warn("[Sessions API] Failed to seed nodes from previous session:", err);
			}
		}

		// Create participants from wizard (multiple) or legacy single contact
		if (participants && participants.length > 0) {
			await db.meetingParticipant.createMany({
				data: participants.map((p) => ({
					sessionId: session.id,
					name: p.name,
					email: p.email || undefined,
					role: p.role || undefined,
					participantType: "CLIENT" as const,
				})),
			});
		} else if (contactName || contactEmail) {
			await db.meetingParticipant.create({
				data: {
					sessionId: session.id,
					name: contactName || "Cliente",
					email: contactEmail || undefined,
					role: contactRole || undefined,
					participantType: "CLIENT",
				},
			});
		}

		// Move staged wizard files if wizardNonce provided
		if (wizardNonce) {
			// File move is handled by Supabase Storage — fire-and-forget
			// Staged files: session-context/pending/{wizardNonce}/
			// Target: session-context/{sessionId}/
			// Note: implemented in the client via Supabase Storage API
		}

		// Create pre-built diagram nodes from wizard Step 3
		if (preBuildNodes && preBuildNodes.length > 0) {
			const typeMap: Record<string, string> = {
				startEvent: "START_EVENT",
				endEvent: "END_EVENT",
				task: "TASK",
				userTask: "USER_TASK",
				serviceTask: "SERVICE_TASK",
				manualTask: "MANUAL_TASK",
				exclusiveGateway: "EXCLUSIVE_GATEWAY",
				parallelGateway: "PARALLEL_GATEWAY",
				subProcess: "SUBPROCESS",
				timerEvent: "TIMER_EVENT",
				messageEvent: "MESSAGE_EVENT",
				textAnnotation: "TEXT_ANNOTATION",
			};
			type NodeTypeEnum = "START_EVENT" | "END_EVENT" | "TASK" | "USER_TASK" | "SERVICE_TASK" | "MANUAL_TASK" | "EXCLUSIVE_GATEWAY" | "PARALLEL_GATEWAY" | "SUBPROCESS" | "TIMER_EVENT" | "MESSAGE_EVENT" | "TEXT_ANNOTATION";
			await db.diagramNode.createMany({
				data: preBuildNodes.map((node, i) => ({
					sessionId: session.id,
					nodeType: (typeMap[node.type] ?? "TASK") as NodeTypeEnum,
					label: node.label,
					lane: node.lane || (preBuildLanes?.[0]) || undefined,
					state: "CONFIRMED" as const,
					confidence: 0.7,
					positionX: 250 * (i % 5),
					positionY: 150 * Math.floor(i / 5),
					connections: node.connectFrom ? [node.connectFrom] : [],
				})),
			});
		}

		// For edit-mode sessions, return immediately (no bot needed)
		if (isEditMode) {
			recordEvent(session.id, "session_created", `type=${sessionType} mode=edit`);
			return NextResponse.json({
				sessionId: session.id,
				shareToken: session.shareToken,
				intakeToken: session.intakeToken,
				status: "active",
			});
		}

		// For scheduled sessions, return immediately without joining a call
		if (isScheduled) {
			return NextResponse.json({
				sessionId: session.id,
				shareToken: session.shareToken,
				intakeToken: session.intakeToken,
				status: "scheduled",
			});
		}

		// Join the meeting via call bot
		try {
			const callBot = createCallBotProvider();
			recordEvent(session.id, "session_created", `type=${sessionType}`);
			recordEvent(session.id, "bot_join_requested", meetingUrl!);

			const { botId } = await callBot.joinMeeting(meetingUrl!);
			recordEvent(session.id, "bot_join_api_returned", `botId=${botId}`);

			await db.meetingSession.update({
				where: { id: session.id },
				data: {
					recallBotId: botId,
					recallBotStatus: "joining",
				},
			});

			// Background: poll Recall.ai bot status until in_meeting (diagnostic)
			(async () => {
				const maxPolls = 30; // 5 minutes max
				for (let i = 0; i < maxPolls; i++) {
					await new Promise((r) => setTimeout(r, 10_000));
					try {
						const status = await callBot.getBotStatus(botId);
						recordEvent(
							session.id,
							"bot_status_check",
							`raw=${status.rawStatus}, mapped=${status.status}, participants=${status.participants ?? 0}`,
						);
						if (
							status.status === "in_meeting" ||
							status.status === "ended" ||
							status.status === "error"
						) {
							recordEvent(
								session.id,
								"bot_reached_final_status",
								`raw=${status.rawStatus}`,
							);
							break;
						}
					} catch (e) {
						recordEvent(
							session.id,
							"bot_status_error",
							e instanceof Error ? e.message : String(e),
						);
						break;
					}
				}
			})();

			return NextResponse.json({
				sessionId: session.id,
				botId,
				shareToken: session.shareToken,
				status: "connecting",
			});
		} catch (botError) {
			// Bot failed to join — keep session but mark status
			await db.meetingSession.update({
				where: { id: session.id },
				data: {
					status: "FAILED",
					recallBotStatus: `error: ${botError instanceof Error ? botError.message : "unknown"}`,
				},
			});

			return NextResponse.json(
				{
					error: "Failed to join meeting. Check your meeting URL and try again.",
					detail: botError instanceof Error ? botError.message : "Unknown error",
					sessionId: session.id,
				},
				{ status: 502 },
			);
		}
	} catch (error) {
		console.error("[Sessions API] Error creating session:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const sessions = await db.meetingSession.findMany({
			where: {
				organizationId: authCtx.org.id,
				status: { in: ["SCHEDULED", "CONNECTING", "ACTIVE"] },
			},
			include: {
				processDefinition: true,
				participants: true,
				_count: { select: { diagramNodes: true, transcriptEntries: true, intakeResponses: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 50,
		});

		return NextResponse.json(sessions);
	} catch (error) {
		console.error("[Sessions API] Error listing sessions:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

/**
 * Seed a new session with confirmed diagram nodes from the most recent
 * ended session of the same process. Regenerates BPMN XML so that canvas
 * element IDs align with the new DiagramNode record IDs.
 */
async function seedNodesFromPreviousSession(
	newSessionId: string,
	processDefinitionId: string,
): Promise<void> {
	// Find the most recent ended session for this process
	const sourceSession = await db.meetingSession.findFirst({
		where: { processDefinitionId, status: "ENDED" },
		orderBy: { endedAt: "desc" },
		select: { id: true },
	});
	if (!sourceSession) return;

	// Fetch confirmed nodes from the source session
	const sourceNodes = await db.diagramNode.findMany({
		where: { sessionId: sourceSession.id, state: "CONFIRMED" },
	});
	if (sourceNodes.length === 0) return;

	// Build old-ID → new-ID mapping
	const idMap = new Map<string, string>();
	for (const node of sourceNodes) {
		idMap.set(node.id, randomBytes(12).toString("hex"));
	}

	// Remap connections, filtering orphans (targets not in the copied set)
	const remappedNodes = sourceNodes.map((node) => {
		const filteredConnections: string[] = [];
		const filteredLabels: string[] = [];
		for (let i = 0; i < (node.connections || []).length; i++) {
			const targetId = node.connections[i];
			const newTargetId = idMap.get(targetId);
			if (newTargetId) {
				filteredConnections.push(newTargetId);
				filteredLabels.push((node.connectionLabels || [])[i] || "");
			}
		}

		return {
			id: idMap.get(node.id)!,
			sessionId: newSessionId,
			nodeType: node.nodeType,
			label: node.label,
			state: "CONFIRMED" as const,
			lane: node.lane,
			confidence: node.confidence,
			positionX: node.positionX,
			positionY: node.positionY,
			connections: filteredConnections,
			connectionLabels: filteredLabels,
			parentId: node.parentId ? (idMap.get(node.parentId) ?? null) : null,
			properties: node.properties ?? undefined,
			procedure: node.procedure ?? undefined,
			formedAt: new Date(),
			confirmedAt: new Date(),
		};
	});

	await db.diagramNode.createMany({ data: remappedNodes });

	// Regenerate BPMN XML so element IDs match the new DB node IDs
	try {
		const diagramNodes: DiagramNode[] = remappedNodes.map((n) => ({
			id: n.id,
			type: n.nodeType.toLowerCase(),
			label: n.label,
			state: "confirmed" as const,
			lane: n.lane || undefined,
			connections: n.connections,
			connectionLabels: n.connectionLabels,
			confidence: n.confidence,
		}));
		const bpmnXml = await buildBpmnXml(diagramNodes);
		await db.meetingSession.update({
			where: { id: newSessionId },
			data: { bpmnXml },
		});
	} catch (err) {
		console.error("[Sessions API] Failed to generate BPMN XML for seeded nodes:", err);
	}

	console.log(
		`[Sessions API] Seeded ${remappedNodes.length} nodes from session ${sourceSession.id} to session ${newSessionId}`,
	);
}
