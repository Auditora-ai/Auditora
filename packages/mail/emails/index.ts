import { EmailVerification } from "./EmailVerification";
import { ForgotPassword } from "./ForgotPassword";
import { MagicLink } from "./MagicLink";
import { NewUser } from "./NewUser";
import { OnboardingSteps } from "./OnboardingSteps";
import { OrganizationInvitation } from "./OrganizationInvitation";
import { ReEngagement } from "./ReEngagement";
import { SessionInvitation } from "./SessionInvitation";
import { SessionRecap } from "./SessionRecap";
import { ToolNurture1 } from "./ToolNurture1";
import { ToolNurture2 } from "./ToolNurture2";
import { ContactConfirmation } from "./ContactConfirmation";
import { ToolResult } from "./ToolResult";
import { TrialExpiring } from "./TrialExpiring";
import { UpgradeInvitation } from "./UpgradeInvitation";
import { InterviewSummary } from "./InterviewSummary";

export const mailTemplates = {
	// Auth
	magicLink: MagicLink,
	forgotPassword: ForgotPassword,
	newUser: NewUser,
	organizationInvitation: OrganizationInvitation,
	emailVerification: EmailVerification,

	// Contact
	contactConfirmation: ContactConfirmation,

	// Tool results & nurture
	toolResult: ToolResult,
	toolNurture1: ToolNurture1,
	toolNurture2: ToolNurture2,

	// Session
	sessionInvitation: SessionInvitation,
	sessionRecap: SessionRecap,

	// AI Interview
	interviewSummary: InterviewSummary,

	// Lifecycle
	onboardingSteps: OnboardingSteps,
	trialExpiring: TrialExpiring,
	reEngagement: ReEngagement,
	upgradeInvitation: UpgradeInvitation,
} as const;
