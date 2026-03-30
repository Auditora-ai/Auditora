import { Hr, Link, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function SessionInvitation({
	participantName,
	participantRole,
	processName,
	sessionType,
	scheduledFor,
	duration,
	meetingUrl,
	consultantName,
	organizationName,
	intro,
	roleInstruction,
	intakeQuestions,
	contextSummary,
	intakeUrl,
	locale,
	translations,
}: {
	participantName?: string;
	participantRole?: string;
	processName: string;
	sessionType: string;
	scheduledFor?: string;
	duration?: number;
	meetingUrl?: string;
	consultantName?: string;
	organizationName?: string;
	intro: string;
	roleInstruction?: string;
	intakeQuestions?: string[];
	contextSummary?: string;
	intakeUrl?: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: {
			...translations.sessionInvitation,
			common: translations.common,
		},
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader", { processName })}
			footerReason={t("common.footer.receivingBecauseInvite")}
		>
			{/* Greeting */}
			{participantName && (
				<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
					{t("common.greeting", { name: participantName })}
				</Text>
			)}

			{/* Intro from AI */}
			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>{intro}</Text>

			{/* Session details box */}
			<Text
				style={{
					backgroundColor: "#FAF9F7",
					padding: "16px",
					borderRadius: "8px",
					border: "1px solid #E7E5E4",
					color: "#0A1428",
					lineHeight: "1.8",
					fontSize: "14px",
				}}
			>
				<strong>{t("detailsHeading")}</strong>
				{"\n"}
				{"• "}{t("processLabel")}: {processName}
				{"\n"}
				{"• "}{t("typeLabel")}: {t(`sessionType.${sessionType}`)}
				{scheduledFor && (
					<>
						{"\n"}
						{"• "}{t("dateLabel")}: {scheduledFor}
					</>
				)}
				{duration && (
					<>
						{"\n"}
						{"• "}{t("durationLabel")}: {duration} {t("minutes")}
					</>
				)}
				{participantRole && (
					<>
						{"\n"}
						{"• "}{t("yourRoleLabel")}: {participantRole}
					</>
				)}
				{consultantName && (
					<>
						{"\n"}
						{"• "}{t("facilitatorLabel")}: {consultantName}
					</>
				)}
			</Text>

			{/* Role-specific instruction */}
			{roleInstruction && (
				<>
					<Text
						style={{
							color: "#0A1428",
							fontSize: "14px",
							fontWeight: "600",
							marginBottom: "4px",
						}}
					>
						{t("yourPreparation")}
					</Text>
					<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
						{roleInstruction}
					</Text>
				</>
			)}

			{/* Intake questions */}
			{intakeQuestions && intakeQuestions.length > 0 && (
				<>
					<Text
						style={{
							color: "#0A1428",
							fontSize: "14px",
							fontWeight: "600",
							marginBottom: "4px",
						}}
					>
						{t("questionsHeading")}
					</Text>
					<Text style={{ color: "#0A1428", lineHeight: "1.8", paddingLeft: "8px" }}>
						{intakeQuestions
							.map((q, i) => `${i + 1}. ${q}`)
							.join("\n")}
					</Text>
				</>
			)}

			{/* Context summary */}
			{contextSummary && (
				<Text
					style={{
						color: "#78716C",
						fontSize: "13px",
						lineHeight: "1.6",
						padding: "12px",
						backgroundColor: "#FAF9F7",
						borderRadius: "8px",
					}}
				>
					{contextSummary}
				</Text>
			)}

			{/* CTA: Intake form or meeting link */}
			{intakeUrl && (
				<>
					<Text
						style={{
							color: "#0A1428",
							fontSize: "14px",
							fontWeight: "600",
							marginBottom: "4px",
						}}
					>
						{t("intakeHeading")}
					</Text>
					<Text
						style={{
							color: "#78716C",
							fontSize: "14px",
							lineHeight: "1.6",
							marginBottom: "16px",
						}}
					>
						{t("intakeDescription")}
					</Text>
					<PrimaryButton href={intakeUrl}>
						{t("intakeButton")}
					</PrimaryButton>
				</>
			)}

			{meetingUrl && (
				<>
					<Hr
						style={{
							borderColor: "#E7E5E4",
							margin: "24px 0 16px 0",
						}}
					/>
					<Text style={{ color: "#78716C", fontSize: "14px" }}>
						{t("meetingLinkLabel")}:{" "}
						<Link href={meetingUrl} style={{ color: "#00E5C0" }}>
							{meetingUrl}
						</Link>
					</Text>
				</>
			)}

			{/* Sign-off */}
			{(consultantName || organizationName) && (
				<Text
					style={{
						color: "#78716C",
						fontSize: "14px",
						marginTop: "24px",
					}}
				>
					{consultantName || organizationName}
				</Text>
			)}
		</Wrapper>
	);
}

SessionInvitation.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	participantName: "Maria Garcia",
	participantRole: "Process Owner",
	processName: "Employee Onboarding",
	sessionType: "DISCOVERY",
	scheduledFor: "April 2, 2026 — 10:00 AM (CST)",
	duration: 60,
	meetingUrl: "https://zoom.us/j/123456789",
	consultantName: "Oscar",
	organizationName: "Acme Consulting",
	intro: "You have been invited to a process discovery session for the Employee Onboarding process. This session will help us understand the current process, identify key participants, and document the main steps and decisions involved.",
	roleInstruction:
		"As the Process Owner, please come prepared to describe the end-to-end flow of the onboarding process, including who is involved at each stage, what systems are used, and any known bottlenecks or pain points.",
	intakeQuestions: [
		"What are the main steps in the current onboarding process?",
		"Who are the key participants and what are their roles?",
		"What systems or tools are used during onboarding?",
		"What are the most common problems or delays?",
		"Are there any compliance requirements that affect the process?",
	],
	contextSummary:
		"This is the first session for documenting the Employee Onboarding process. The goal is to create a complete process map and identify areas for improvement.",
	intakeUrl: "https://app.auditora.ai/intake/abc123",
};

export default SessionInvitation;
