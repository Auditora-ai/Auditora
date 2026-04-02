"use client";

import { config } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { Alert, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { MailCheckIcon, MailIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function ContactForm() {
	const t = useTranslations();
	const locale = useLocale();
	const turnstileToken = useRef<string | null>(null);

	const form = useForm({
		resolver: zodResolver(
			z.object({
				name: z.string().min(1),
				email: z.email(),
				message: z.string().min(10),
			}),
		),
		defaultValues: {
			name: "",
			email: "",
			message: "",
		},
	});

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const res = await fetch(
				`${config.saasUrl}/api/public/tools/lead-capture`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: values.email,
						toolUsed: "contact-form",
						outputData: { name: values.name, message: values.message },
						source: "contact",
						turnstileToken: turnstileToken.current,
						locale,
					}),
				},
			);
			if (!res.ok) throw new Error("Failed to submit");
		} catch {
			form.setError("root", {
				message: t("contact.form.notifications.error"),
			});
		}
	});

	return (
		<div>
			{form.formState.isSubmitSuccessful ? (
				<Alert variant="success">
					<MailCheckIcon />
					<AlertTitle>
						{t("contact.form.notifications.success")}
					</AlertTitle>
				</Alert>
			) : (
				<Form {...form}>
					<form
						onSubmit={onSubmit}
						className="flex flex-col items-stretch gap-6"
					>
						{form.formState.errors.root?.message && (
							<Alert variant="error">
								<MailIcon />
								<AlertTitle>
									{form.formState.errors.root.message}
								</AlertTitle>
							</Alert>
						)}

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("contact.form.name")}
									</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("contact.form.email")}
									</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="message"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("contact.form.message")}
									</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{TURNSTILE_SITE_KEY && (
							<Turnstile
								siteKey={TURNSTILE_SITE_KEY}
								onSuccess={(token) => {
									turnstileToken.current = token;
								}}
								options={{ theme: "light", size: "flexible" }}
							/>
						)}

						<Button
							type="submit"
							className="w-full"
							variant="primary"
							loading={form.formState.isSubmitting}
						>
							{t("contact.form.submit")}
						</Button>
					</form>
				</Form>
			)}
		</div>
	);
}
