import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { sendEmail } from "@repo/mail";
import {
	checkRateLimit,
	checkDedup,
	getClientIp,
} from "@repo/rate-limit";
import { z } from "zod";
async function verifyTurnstileToken(token: string, ip: string) {
	const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			secret: process.env.TURNSTILE_SECRET_KEY ?? "",
			response: token,
			remoteip: ip,
		}),
	});
	return (await res.json()) as { success: boolean };
}

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

const SUPPORTED_LOCALES = ["en", "es", "de", "fr"] as const;

const bodySchema = z.object({
	email: z.string().email("Valid email required."),
	toolUsed: z.string().min(1, "Tool name required."),
	outputData: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
	source: z.string().optional(),
	turnstileToken: z.string().optional(),
	locale: z.enum(SUPPORTED_LOCALES).optional(),
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

		const { email: rawEmail, toolUsed, outputData, source, turnstileToken, locale } = parsed.data;
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

		const outputDataStr = typeof outputData === "object" ? JSON.stringify(outputData) : outputData;

		const lead = await db.toolLead.create({
			data: {
				email,
				toolUsed,
				outputData: outputDataStr || undefined,
				ipAddress: ip,
				source: source || "tool",
			},
		});

		// Send confirmation/result email (fire-and-forget)
		const displayName = TOOL_DISPLAY_NAMES[toolUsed] || toolUsed;

		if (source === "contact") {
			const contactData = typeof outputData === "object" ? outputData : {};
			const contactName = (contactData as Record<string, string>).name || "";
			const contactMessage = (contactData as Record<string, string>).message || "";

			sendEmail({
				to: email,
				templateId: "contactConfirmation",
				context: { name: contactName },
				locale: locale || "en",
			}).catch(() => {});

			// Notify the team about the new contact form submission
			sendEmail({
				to: "contact@auditora.ai",
				subject: `Nuevo mensaje de contacto: ${contactName} (${email})`,
				text: `Nombre: ${contactName}\nEmail: ${email}\nMensaje:\n${contactMessage}`,
			}).catch(() => {});
		} else {
			const toolUrl = `https://auditora.ai/tools/${toolUsed}`;
			sendEmail({
				to: email,
				templateId: "toolResult",
				context: { toolName: displayName, resultUrl: toolUrl },
				locale: locale || "en",
			}).catch(() => {});
		}

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
