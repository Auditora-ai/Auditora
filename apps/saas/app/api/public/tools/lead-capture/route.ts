import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { sendEmail } from "@repo/mail";
import {
	checkRateLimit,
	checkDedup,
	getClientIp,
} from "@repo/rate-limit";
import { z } from "zod";
import { verifyTurnstileToken } from "@radiografia/lib/turnstile";

const TOOL_DISPLAY_NAMES: Record<string, string> = {
	"bpmn-generator": "BPMN Diagram Generator",
	"sipoc-generator": "SIPOC Generator",
	"raci-generator": "RACI Matrix Generator",
	"process-audit": "Process Health Check",
	"meeting-to-process": "Meeting Notes to Process Map",
	"process-complexity": "Process Complexity Score",
	"bpmn-to-text": "BPMN to Plain Language",
	"roi-calculator": "ROI Calculator",
	"contact-form": "Contact Form",
};

const MAX_REQUESTS_PER_HOUR = 20;
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_MARKETING_URL || "*";

const bodySchema = z.object({
	email: z.string().email("Valid email required."),
	toolUsed: z.string().min(1, "Tool name required."),
	outputData: z.string().optional(),
	source: z.string().optional(),
	turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
	const ip = getClientIp(request);

	// IP-based rate limit
	if (!(await checkRateLimit(`ratelimit:lead-capture:${ip}`, MAX_REQUESTS_PER_HOUR, 3600))) {
		return NextResponse.json(
			{ error: "Too many requests." },
			{ status: 429 },
		);
	}

	try {
		const body = await request.json();
		const parsed = bodySchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || "Invalid input." },
				{ status: 400 },
			);
		}

		const { email: rawEmail, toolUsed, outputData, source, turnstileToken } = parsed.data;
		const email = rawEmail.trim().toLowerCase();

		// Turnstile verification (if token provided)
		if (turnstileToken) {
			const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
			if (!turnstileResult.success) {
				return NextResponse.json(
					{ error: "Bot verification failed." },
					{ status: 403 },
				);
			}
		}

		// Per-email dedup: prevent email bombing (1 email per address per hour)
		const isNew = await checkDedup(`dedup:lead:${email}`, 3600);
		if (!isNew) {
			// Return success silently to avoid leaking whether an email exists
			return NextResponse.json(
				{ success: true, id: "cached" },
				{ headers: { "Access-Control-Allow-Origin": ALLOWED_ORIGIN } },
			);
		}

		const lead = await db.toolLead.create({
			data: {
				email,
				toolUsed,
				outputData: outputData || undefined,
				ipAddress: ip,
				source: source || "tool",
			},
		});

		// Send immediate result email (fire-and-forget)
		const displayName = TOOL_DISPLAY_NAMES[toolUsed] || toolUsed;
		const toolUrl = `https://auditora.ai/tools/${toolUsed}`;
		sendEmail({
			to: email,
			subject: `Your ${displayName} result is ready — Auditora.ai`,
			html: `
				<div style="font-family: 'Geist', system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
					<h2 style="color: #0F172A; font-size: 20px;">Your ${displayName} result is ready</h2>
					<p style="color: #334155; line-height: 1.6;">Thanks for using Auditora.ai's free ${displayName}. Your result has been generated and is ready to view.</p>
					<a href="${toolUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0;">View your result &rarr;</a>
					<hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
					<p style="color: #64748B; font-size: 14px;"><strong>Did you know?</strong> Auditora.ai can generate BPMN diagrams, SIPOC, RACI matrices, and process audits <em>live during your meetings</em>. The AI joins your video call and does everything automatically.</p>
					<a href="https://auditora.ai" style="color: #2563EB; font-size: 14px;">Learn more about Auditora.ai &rarr;</a>
				</div>
			`,
			text: `Your ${displayName} result is ready. View it at: ${toolUrl}`,
		}).catch(() => {});

		return NextResponse.json(
			{ success: true, id: lead.id },
			{ headers: { "Access-Control-Allow-Origin": ALLOWED_ORIGIN } },
		);
	} catch (err) {
		console.error("[lead-capture] Error:", err);
		return NextResponse.json(
			{ error: "Failed to save. Try again." },
			{ status: 500 },
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": ALLOWED_ORIGIN,
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
