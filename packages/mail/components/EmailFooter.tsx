import { Hr, Link, Section, Text } from "@react-email/components";
import React from "react";

interface EmailFooterProps {
	unsubscribeUrl?: string;
	reason?: string;
}

export default function EmailFooter({ unsubscribeUrl, reason }: EmailFooterProps) {
	const baseUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "https://auditora.ai";

	return (
		<Section style={{ marginTop: "32px" }}>
			<Hr style={{ borderColor: "#E7E5E4", margin: "0 0 24px 0" }} />
			<Text
				style={{
					color: "#94A3B8",
					fontSize: "12px",
					lineHeight: "18px",
					margin: "0 0 8px 0",
					textAlign: "center" as const,
				}}
			>
				Auditora.ai — AI-powered process audit and risk intelligence.
			</Text>
			{reason && (
				<Text
					style={{
						color: "#94A3B8",
						fontSize: "12px",
						lineHeight: "18px",
						margin: "0 0 8px 0",
						textAlign: "center" as const,
					}}
				>
					{reason}
				</Text>
			)}
			<Text
				style={{
					color: "#94A3B8",
					fontSize: "12px",
					lineHeight: "18px",
					margin: "0",
					textAlign: "center" as const,
				}}
			>
				{unsubscribeUrl && (
					<>
						<Link href={unsubscribeUrl} style={{ color: "#78716C" }}>
							Unsubscribe
						</Link>
						{" · "}
					</>
				)}
				<Link href={`${baseUrl}/en/legal/privacy-policy`} style={{ color: "#78716C" }}>
					Privacy Policy
				</Link>
				{" · "}
				<Link href={baseUrl} style={{ color: "#78716C" }}>
					auditora.ai
				</Link>
			</Text>
		</Section>
	);
}
