import { Text, Section, Hr } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

interface RiskItem {
	title: string;
	severity: number;
	probability: number;
}

export function InterviewSummary({
	processName = "Process",
	completenessScore = 0,
	riskCount = 0,
	topRisks = [],
	resultUrl = "#",
	locale,
	translations,
}: {
	processName: string;
	completenessScore: number;
	riskCount: number;
	topRisks: RiskItem[];
	resultUrl: string;
} & BaseMailProps) {
	const msgs = translations ?? defaultTranslations;
	const t = createTranslator({
		locale,
		messages: { ...msgs.interviewSummary, common: msgs.common },
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader", { processName, riskCount })}
			footerReason={t("common.footer.receivingBecauseAccount")}
		>
			<Text style={{ fontSize: "20px", fontWeight: "bold", color: "#0A1428", fontFamily: "'Instrument Serif', Georgia, serif" }}>
				{t("heading", { processName })}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("body", { processName, completenessScore })}
			</Text>

			{/* Stats row */}
			<Section style={{ marginTop: "16px", marginBottom: "16px" }}>
				<table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
					<tr>
						<td style={{ padding: "12px 16px", backgroundColor: "#FAF9F7", borderRadius: "8px", border: "1px solid #E7E5E4", textAlign: "center", width: "33%" }}>
							<Text style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#0A1428" }}>
								{completenessScore}%
							</Text>
							<Text style={{ margin: 0, fontSize: "12px", color: "#78716C" }}>
								{t("completeness")}
							</Text>
						</td>
						<td style={{ width: "12px" }} />
						<td style={{ padding: "12px 16px", backgroundColor: riskCount > 0 ? "#FEF2F2" : "#F0FDF4", borderRadius: "8px", border: `1px solid ${riskCount > 0 ? "#FECACA" : "#BBF7D0"}`, textAlign: "center", width: "33%" }}>
							<Text style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: riskCount > 0 ? "#DC2626" : "#16A34A" }}>
								{riskCount}
							</Text>
							<Text style={{ margin: 0, fontSize: "12px", color: "#78716C" }}>
								{t("risksFound")}
							</Text>
						</td>
					</tr>
				</table>
			</Section>

			{/* Top risks */}
			{topRisks.length > 0 && (
				<>
					<Text style={{ fontSize: "14px", fontWeight: "600", color: "#0A1428", marginTop: "24px" }}>
						{t("topRisksHeading")}
					</Text>
					{topRisks.slice(0, 3).map((risk, i) => (
						<Section key={i} style={{ padding: "12px 16px", backgroundColor: "#FAF9F7", borderRadius: "8px", border: "1px solid #E7E5E4", marginBottom: "8px" }}>
							<Text style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#0A1428" }}>
								{risk.title}
							</Text>
							<Text style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#78716C" }}>
								{t("severity")}: {risk.severity}/5 · {t("probability")}: {risk.probability}/5
							</Text>
						</Section>
					))}
				</>
			)}

			<Hr style={{ borderColor: "#E7E5E4", margin: "24px 0" }} />

			<PrimaryButton href={resultUrl}>
				{t("ctaButton")}
			</PrimaryButton>

			<Text style={{ color: "#78716C", fontSize: "14px", marginTop: "24px", lineHeight: "1.6" }}>
				{t("footer")}
			</Text>
		</Wrapper>
	);
}

InterviewSummary.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	processName: "Facturación",
	completenessScore: 78,
	riskCount: 5,
	topRisks: [
		{ title: "Facturación sin control de calidad", severity: 5, probability: 4 },
		{ title: "SLA sin monitoreo automático", severity: 4, probability: 4 },
		{ title: "Rotación en compras sin backup", severity: 4, probability: 3 },
	],
	resultUrl: "https://app.auditora.ai/acme/descubrir/interview/abc123",
};

export default InterviewSummary;
