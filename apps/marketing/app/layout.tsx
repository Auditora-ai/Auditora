import { config } from "@config";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

import "./globals.css";

export const metadata: Metadata = {
	title: {
		absolute: config.appName,
		default: config.appName,
		template: `%s | ${config.appName}`,
	},
	description:
		"Plataforma de elicitación de procesos con IA. Auditora.ai se une a tus videollamadas, guía la entrevista y diagrama procesos BPMN en tiempo real.",
	icons: {
		icon: [
			{ url: "/icon.svg", type: "image/svg+xml" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
		],
		apple: "/apple-touch-icon.png",
	},
	openGraph: {
		images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
	},
};

export default function RootLayout({ children }: PropsWithChildren) {
	return children;
}
