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
	name: z.string().min(3),
});

export function ChangeNameForm() {
	const { user, reloadSession } = useSession();
	const t = useTranslations();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ name }) => {
		const { error } = await authClient.updateUser({
			name,
		});

		if (error) {
			toastError(t("settings.account.changeName.notifications.error"));
			return;
		}

		toastSuccess(t("settings.account.changeName.notifications.success"));

		reloadSession();

		form.reset({
			name,
		});
	});

	return (
		<SettingsItem title={t("settings.account.changeName.title")}>
			<Form {...form}>
				<form onSubmit={onSubmit}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("settings.account.changeName.title")}
								</FormLabel>
								<FormControl>
									<Input type="text" {...field} />
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
									form.formState.dirtyFields.name
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
