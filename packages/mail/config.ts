import { config as i18nConfig } from "@repo/i18n";
import type { MailConfig } from "./types";

export const config = {
	mailFrom: process.env.MAIL_FROM as string,
	locales: Object.keys(
		i18nConfig.locales,
	) as (keyof typeof i18nConfig.locales)[],
	defaultLocale: i18nConfig.defaultLocale,
} satisfies MailConfig;

export type Locale = keyof typeof i18nConfig.locales;

/**
 * Maps each template to its appropriate sender alias.
 * - no-reply@: Auth flows (no reply expected)
 * - hello@: Welcome & onboarding (replies welcome)
 * - info@: Tool results & session deliverables
 * - contact@: Marketing nurture (replies welcome)
 * - sales@: Commercial / upsell
 * - support@: Trial expiring (users may reply with questions)
 */
export const senderMap: Record<string, string> = {
	// Auth (no reply expected)
	emailVerification: "Auditora.ai <no-reply@auditora.ai>",
	forgotPassword: "Auditora.ai <no-reply@auditora.ai>",
	magicLink: "Auditora.ai <no-reply@auditora.ai>",

	// Welcome & onboarding (replies welcome)
	newUser: "Auditora.ai <hello@auditora.ai>",
	onboardingSteps: "Auditora.ai <hello@auditora.ai>",
	organizationInvitation: "Auditora.ai <hello@auditora.ai>",

	// Contact
	contactConfirmation: "Auditora.ai <hello@auditora.ai>",

	// Session invitations & deliverables
	sessionInvitation: "Auditora.ai <info@auditora.ai>",
	toolResult: "Auditora.ai <info@auditora.ai>",
	sessionRecap: "Auditora.ai <info@auditora.ai>",

	// AI Interview
	interviewSummary: "Auditora.ai <info@auditora.ai>",

	// Marketing nurture (replies welcome)
	toolNurture1: "Auditora.ai <contact@auditora.ai>",
	toolNurture2: "Auditora.ai <contact@auditora.ai>",
	reEngagement: "Auditora.ai <contact@auditora.ai>",

	// Commercial
	upgradeInvitation: "Auditora.ai <sales@auditora.ai>",
	trialExpiring: "Auditora.ai Support <support@auditora.ai>",
};
