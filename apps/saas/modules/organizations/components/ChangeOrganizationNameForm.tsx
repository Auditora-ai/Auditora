"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { organizationListQueryKey } from "@organizations/lib/api";
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
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(3),
});

export function ChangeOrganizationNameForm() {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: activeOrganization?.name ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ name }) => {
		if (!activeOrganization) {
			return;
		}

		try {
			const { error } = await authClient.organization.update({
				organizationId: activeOrganization.id,
				data: {
					name,
				},
			});

			if (error) {
				throw error;
			}

			toastSuccess(
				t("organizations.settings.changeName.notifications.success"),
			);

			queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});
			router.refresh();
		} catch {
			toastError(
				t("organizations.settings.changeName.notifications.error"),
			);
		}
	});

	return (
		<SettingsItem title={t("organizations.settings.changeName.title")}>
			<Form {...form}>
				<form onSubmit={onSubmit}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("organizations.settings.changeName.title")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="mt-4 flex justify-end">
						<Button
							className="min-h-[48px]"
							type="submit"
							disabled={
								!(
									form.formState.isValid &&
									form.formState.dirtyFields.name
								)
							}
							loading={form.formState.isSubmitting}
						>
							{t("settings.save")}
						</Button>
					</div>
				</form>
			</Form>
		</SettingsItem>
	);
}
