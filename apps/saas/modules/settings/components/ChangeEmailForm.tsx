"use client";

import { useSession } from "@auth/hooks/use-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
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
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	email: z.email(),
});

export function ChangeEmailForm() {
	const { user, reloadSession } = useSession();
	const t = useTranslations();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: user?.email ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		const { error } = await authClient.changeEmail({
			newEmail: email,
		});

		if (error) {
			toastError(t("settings.account.changeEmail.notifications.error"));
			return;
		}

		toastSuccess(t("settings.account.changeEmail.notifications.success"));

		reloadSession();
	});

	return (
		<SettingsItem
			title={t("settings.account.changeEmail.title")}
			description={t("settings.account.changeEmail.description")}
		>
			<Form {...form}>
				<form onSubmit={onSubmit}>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("settings.account.changeEmail.title")}
								</FormLabel>
								<FormControl>
									<Input type="email" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="mt-4 flex justify-end">
						<Button
							type="submit"
							className="min-h-[48px]"
							loading={form.formState.isSubmitting}
							disabled={
								!(
									form.formState.isValid &&
									form.formState.dirtyFields.email
								)
							}
						>
							{t("settings.save")}
						</Button>
					</div>
				</form>
			</Form>
		</SettingsItem>
	);
}
