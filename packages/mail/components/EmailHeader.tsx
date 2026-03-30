import { Img, Section } from "@react-email/components";
import React from "react";

const LOGO_URL =
	(process.env.NEXT_PUBLIC_MARKETING_URL || "https://auditora.ai") +
	"/images/logo-email.png";

export default function EmailHeader() {
	return (
		<Section style={{ textAlign: "center", paddingBottom: "24px" }}>
			<Img
				src={LOGO_URL}
				alt="Auditora.ai"
				width={160}
				height={32}
				style={{ margin: "0 auto" }}
			/>
		</Section>
	);
}
