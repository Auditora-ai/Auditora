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
		} = body;

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
				type: sessionType,
				status: initialStatus,
				meetingUrl: meetingUrl || undefined,
				organizationId: org.id,
				userId: user.id,
				processDefinitionId: processDefinitionId || undefined,
				continuationOf: continuationOf || undefined,
				scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
				scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
				sessionGoals: sessionGoals || undefined,
			},
		});

		// Create client participant if contact info provided
		if (contactName || contactEmail) {
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
