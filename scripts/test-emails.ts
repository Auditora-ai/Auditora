/**
 * Test script: sends one email per template to a test address.
 * Usage: npx tsx scripts/test-emails.ts
 */

import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { render } from "@react-email/render";
import { Resend } from "resend";
import { getMessagesForLocale } from "../packages/mail/lib/i18n";
import { mailTemplates } from "../packages/mail/emails";
import { senderMap, config } from "../packages/mail/config";

const TO = "taw.oscarn@gmail.com";
const LOCALE = "es";

const resend = new Resend(process.env.RESEND_API_KEY);

type TemplateId = keyof typeof mailTemplates;

// Test context for each template
const testContexts: Record<TemplateId, Record<string, unknown>> = {
	newUser: {
		url: "https://app.auditora.ai/verify?token=test123",
		name: "Oscar",
		otp: "482901",
	},
	emailVerification: {
		url: "https://app.auditora.ai/verify-email?token=test123",
		name: "Oscar",
	},
	forgotPassword: {
		url: "https://app.auditora.ai/reset-password?token=test123",
		name: "Oscar",
	},
	magicLink: {
		url: "https://app.auditora.ai/magic-link?token=test123",
	},
	organizationInvitation: {
		url: "https://app.auditora.ai/invite?token=test123",
		organizationName: "Acme Consulting",
	},
	contactConfirmation: {
		name: "Oscar",
	},
	toolResult: {
		toolName: "BPMN Diagram Generator",
		resultUrl: "https://auditora.ai/tools/bpmn-generator",
	},
	toolNurture1: {
		toolName: "BPMN Generator",
		unsubscribeUrl: "https://auditora.ai/unsubscribe?token=test",
	},
	toolNurture2: {
		toolName: "BPMN Generator",
		unsubscribeUrl: "https://auditora.ai/unsubscribe?token=test",
	},
	sessionRecap: {
		processName: "Onboarding de Nuevos Empleados",
		reviewUrl: "https://app.auditora.ai/acme/session/abc123/review",
		userName: "Oscar",
	},
	sessionInvitation: {
		participantName: "Maria Garcia",
		participantRole: "Process Owner",
		processName: "Onboarding de Nuevos Empleados",
		sessionType: "DISCOVERY",
		scheduledFor: "2 de abril, 2026 — 10:00 AM (CST)",
		duration: 60,
		meetingUrl: "https://zoom.us/j/123456789",
		consultantName: "Oscar",
		organizationName: "Acme Consulting",
		intro: "Has sido invitado a una sesión de descubrimiento del proceso de Onboarding de Nuevos Empleados. Esta sesión nos ayudará a entender el proceso actual, identificar participantes clave y documentar los pasos y decisiones principales.",
		roleInstruction:
			"Como Process Owner, por favor ven preparado para describir el flujo completo del proceso de onboarding, incluyendo quién participa en cada etapa, qué sistemas se usan y cualquier cuello de botella conocido.",
		intakeQuestions: [
			"¿Cuáles son los pasos principales del proceso de onboarding actual?",
			"¿Quiénes son los participantes clave y cuáles son sus roles?",
			"¿Qué sistemas o herramientas se utilizan durante el onboarding?",
			"¿Cuáles son los problemas o retrasos más comunes?",
			"¿Existen requisitos de cumplimiento que afecten el proceso?",
		],
		contextSummary:
			"Esta es la primera sesión para documentar el proceso de Onboarding de Nuevos Empleados. El objetivo es crear un mapa completo del proceso e identificar áreas de mejora.",
		intakeUrl: "https://app.auditora.ai/intake/abc123",
	},
	onboardingSteps: {
		userName: "Oscar",
		dashboardUrl: "https://app.auditora.ai/dashboard",
	},
	trialExpiring: {
		userName: "Oscar",
		daysRemaining: 3,
		upgradeUrl: "https://app.auditora.ai/settings/billing",
		planName: "Growth",
	},
	reEngagement: {
		userName: "Oscar",
		dashboardUrl: "https://app.auditora.ai/dashboard",
		unsubscribeUrl: "https://auditora.ai/unsubscribe?token=test",
	},
	upgradeInvitation: {
		userName: "Oscar",
		currentPlan: "Starter",
		suggestedPlan: "Growth",
		upgradeUrl: "https://app.auditora.ai/settings/billing/upgrade",
		features: [
			"40 sesiones/mes (antes 10)",
			"5 miembros de equipo (antes 1)",
			"Definiciones de proceso ilimitadas",
			"Soporte prioritario",
		],
	},
};

async function main() {
	console.log(`\n📧 Sending test emails to ${TO} (locale: ${LOCALE})\n`);

	const translations = await getMessagesForLocale(LOCALE as any);
	const templateIds = Object.keys(mailTemplates) as TemplateId[];

	let sent = 0;
	let failed = 0;

	for (const templateId of templateIds) {
		const template = mailTemplates[templateId];
		const context = testContexts[templateId];

		if (!context) {
			console.log(`⚠️  ${templateId}: No test context defined, skipping`);
			continue;
		}

		try {
			const email = (template as any)({
				...context,
				locale: LOCALE,
				translations,
			});

			const html = await render(email);
			const text = await render(email, { plainText: true });

			const templateMessages = translations as Record<string, { subject?: string }>;
			let subject = templateMessages[templateId]?.subject ?? templateId;

			// Replace template variables in subject
			for (const [key, value] of Object.entries(context)) {
				if (typeof value === "string") {
					subject = subject.replace(`{${key}}`, value);
				} else if (typeof value === "number") {
					subject = subject.replace(`{${key}}`, String(value));
				}
			}

			// Prefix subject for test identification
			subject = `[TEST] ${subject}`;

			const from = senderMap[templateId] ?? config.mailFrom;

			await resend.emails.send({
				from,
				to: [TO],
				subject,
				html,
				text,
			});

			console.log(`✅ ${templateId}: "${subject}"`);
			sent++;
		} catch (err: any) {
			console.error(`❌ ${templateId}: ${err.message}`);
			failed++;
		}

		// Small delay to avoid rate limits
		await new Promise((r) => setTimeout(r, 500));
	}

	console.log(`\n📊 Results: ${sent} sent, ${failed} failed, ${templateIds.length} total\n`);
}

main().catch(console.error);
