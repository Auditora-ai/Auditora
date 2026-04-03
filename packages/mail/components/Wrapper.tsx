import {
	Body,
	Container,
	Font,
	Head,
	Html,
	Preview,
	Section,
	Tailwind,
} from "@react-email/components";
import React, { type PropsWithChildren } from "react";
import EmailFooter from "./EmailFooter";
import EmailHeader from "./EmailHeader";

interface WrapperProps {
	locale?: string;
	preheader?: string;
	unsubscribeUrl?: string;
	footerReason?: string;
}

export default function Wrapper({
	children,
	locale,
	preheader,
	unsubscribeUrl,
	footerReason,
}: PropsWithChildren<WrapperProps>) {
	return (
		<Tailwind
			config={{
				theme: {
					extend: {
						colors: {
							border: "#E7E5E4",
							input: "#E7E5E4",
							ring: "#3B8FE8",
							background: "#FFFBF5",
							foreground: "#0A1428",
							primary: {
								DEFAULT: "#3B8FE8",
								foreground: "#0A1428",
							},
							secondary: {
								DEFAULT: "#FAF9F7",
								foreground: "#0A1428",
							},
							destructive: {
								DEFAULT: "#EF4444",
								foreground: "#ffffff",
							},
							success: {
								DEFAULT: "#10B981",
								foreground: "#ffffff",
							},
							muted: {
								DEFAULT: "#FAF9F7",
								foreground: "#64748B",
							},
							accent: {
								DEFAULT: "#3B8FE8",
								foreground: "#0A1428",
							},
							popover: {
								DEFAULT: "#ffffff",
								foreground: "#0A1428",
							},
							card: {
								DEFAULT: "#ffffff",
								foreground: "#0A1428",
							},
						},
						borderRadius: {
							lg: "0.75rem",
							md: "calc(0.75rem - 2px)",
							sm: "calc(0.75rem - 4px)",
							DEFAULT: "0.75rem",
						},
					},
				},
			}}
		>
			<Html lang={locale || "en"}>
				<Head>
					<Font
						fontFamily="Geist Sans"
						fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
						fontWeight={400}
						fontStyle="normal"
					/>
				</Head>
				{preheader && <Preview>{preheader}</Preview>}
				<Body className="bg-background">
					<Section className="p-4">
						<Container className="rounded-lg bg-card p-6 text-card-foreground">
							<EmailHeader />
							{children}
							<EmailFooter
								unsubscribeUrl={unsubscribeUrl}
								reason={footerReason}
							/>
						</Container>
					</Section>
				</Body>
			</Html>
		</Tailwind>
	);
}
