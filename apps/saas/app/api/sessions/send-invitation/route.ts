import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { sendEmail } from "@repo/mail";
import { db } from "@repo/database";
import { z } from "zod";

const bodySchema = z.object({
	sessionId: z.string().min(1),
	/** AI-generated invitation data */
	invitation: z.object({
		title: z.string(),
		intro: z.string(),
		roleInstructions: z.record(z.string(), z.string()),
		intakeQuestions: z.array(z.string()),
		contextSummary: z.string().optional(),
		suggestedDuration: z.number().optional(),
	}),
	/** Send to specific participant emails (if empty, sends to all with email) */
	participantIds: z.array(z.string()).optional(),
	/** Include intake form link */
	includeIntakeLink: z.boolean().default(true),
	/** Locale for the email */
	locale: z.enum(["en", "es", "de", "fr"]).default("es"),
});

export async function POST(request: Request) {
	const authCtx = await getAuthContext();
	if (!authCtx) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message || "Invalid input" },
			{ status: 400 },
		);
	}

	const { sessionId, invitation, participantIds, includeIntakeLink, locale } =
		parsed.data;

	// Fetch session with participants
	const session = await db.meetingSession.findUnique({
		where: { id: sessionId, organizationId: authCtx.org.id },
		include: {
			participants: true,
			processDefinition: { select: { name: true } },
		},
	});

	if (!session) {
		return NextResponse.json({ error: "Session not found" }, { status: 404 });
	}

	// Filter participants that have email addresses
	let targetParticipants = session.participants.filter((p) => p.email);
	if (participantIds && participantIds.length > 0) {
		targetParticipants = targetParticipants.filter((p) =>
			participantIds.includes(p.id),
		);
	}

	if (targetParticipants.length === 0) {
		return NextResponse.json(
			{ error: "No participants with email addresses found" },
			{ status: 400 },
		);
	}

	const processName =
		session.processDefinition?.name || "Process Session";

	const intakeUrl =
		includeIntakeLink && session.intakeToken
			? `${process.env.NEXT_PUBLIC_SAAS_URL}/intake/${session.intakeToken}`
			: undefined;

	// Format scheduled date
	let scheduledFor: string | undefined;
	if (session.scheduledFor) {
		scheduledFor = new Intl.DateTimeFormat(locale, {
			dateStyle: "long",
			timeStyle: "short",
		}).format(session.scheduledFor);
	}

	// Calculate duration in minutes
	let duration: number | undefined;
	if (session.scheduledFor && session.scheduledEnd) {
		duration = Math.round(
			(session.scheduledEnd.getTime() - session.scheduledFor.getTime()) /
				60000,
		);
	}
	if (!duration && invitation.suggestedDuration) {
		duration = invitation.suggestedDuration;
	}

	// Send one personalized email per participant
	const results: { email: string; success: boolean }[] = [];

	for (const participant of targetParticipants) {
		const roleInstruction = participant.role
			? invitation.roleInstructions[participant.role] ?? undefined
			: undefined;

		const success = await sendEmail({
			to: participant.email!,
			templateId: "sessionInvitation",
			context: {
				participantName: participant.name || undefined,
				participantRole: participant.role || undefined,
				processName,
				sessionType: session.type,
				scheduledFor,
				duration,
				meetingUrl: session.meetingUrl || undefined,
				consultantName: authCtx.user.name || undefined,
				organizationName: authCtx.org.name || undefined,
				intro: invitation.intro,
				roleInstruction,
				intakeQuestions: invitation.intakeQuestions,
				contextSummary: invitation.contextSummary || undefined,
				intakeUrl,
			},
			locale,
		});

		results.push({ email: participant.email!, success });
	}

	const sent = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;

	return NextResponse.json({ sent, failed, total: results.length });
}
