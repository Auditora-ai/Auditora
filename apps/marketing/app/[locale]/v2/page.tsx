import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { V2Landing } from "./landing";

const SITE_URL = "https://auditora.ai";

export const metadata: Metadata = {
	title: "Auditora.ai — AI-Powered Process Mapping & Risk Assessment Platform",
	description:
		"Scan any company, generate SIPOC maps, BPMN diagrams, FMEA assessments, and Harvard-style decision simulations in minutes.",
	keywords: [
		"process mapping",
		"BPMN generator",
		"FMEA risk assessment",
		"SIPOC analysis",
		"AI process discovery",
		"decision simulations",
		"SOP generator",
		"ISO 31000",
		"process intelligence",
		"business process management",
	],
	authors: [{ name: "Auditora.ai" }],
	openGraph: {
		title: "Auditora.ai — AI-Powered Process Mapping & Risk Assessment",
		description:
			"Scan any company, generate SIPOC maps, BPMN diagrams, FMEA assessments, and Harvard-style decision simulations in minutes.",
		url: `${SITE_URL}/v2`,
		siteName: "Auditora.ai",
		locale: "en_US",
		type: "website",
		images: [
			{
				url: `${SITE_URL}/og-image.png`,
				width: 1200,
				height: 630,
				alt: "Auditora.ai — AI-Powered Process Mapping Platform",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Auditora.ai — AI-Powered Process Mapping & Risk Assessment",
		description:
			"Scan any company, generate SIPOC maps, BPMN diagrams, FMEA assessments, and decision simulations in minutes.",
		images: [`${SITE_URL}/og-image.png`],
	},
	alternates: {
		canonical: `${SITE_URL}/v2`,
	},
	robots: {
		index: true,
		follow: true,
	},
};

function StructuredData() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "Auditora.ai",
		url: SITE_URL,
		description:
			"AI-powered platform for process mapping, risk assessment, and decision simulations. Scan any company and generate SIPOC maps, BPMN diagrams, and FMEA assessments in minutes.",
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web",
		offers: [
			{
				"@type": "Offer",
				name: "Free Scan",
				price: "0",
				priceCurrency: "USD",
				description: "Free company scan with preview SIPOC map",
			},
			{
				"@type": "Offer",
				name: "Growth",
				price: "199",
				priceCurrency: "USD",
				description:
					"Full department coverage with 15 processes, 50 evaluations/month",
			},
		],

	};

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
}

export default async function V2Page({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	return (
		<>
			<StructuredData />
			<V2Landing />
		</>
	);
}
