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
		icon: "/icon.svg",
	},
};

export default function RootLayout({ children }: PropsWithChildren) {
	return children;
}
