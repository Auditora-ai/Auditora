"use client";

import { useSession } from "@auth/hooks/use-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { UserAvatarUpload } from "@settings/components/UserAvatarUpload";
import { AlertCircleIcon, ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(1),
});

export function OnboardingAccountStep({
	onCompleted,
}: {
	onCompleted: () => void;
}) {
	const t = useTranslations();
	const { user } = useSession();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name ?? "",
		},
	});

	useEffect(() => {
		if (user) {
			form.setValue("name", user.name ?? "");
		}
	}, [user]);

	const onSubmit = form.handleSubmit(async ({ name }) => {
		form.clearErrors("root");

		try {
			await authClient.updateUser({
				name,
			});

			onCompleted();
		} catch {
			form.setError("root", {
				type: "server",
				message: t("onboarding.notifications.accountSetupFailed"),
			});
		}
	});

	return (
		<div>
			<div className="mb-6 space-y-1">
				<h2 className="text-lg font-semibold">
					{t("onboarding.account.title")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("onboarding.account.subtitle")}
				</p>
			</div>

			<Form {...form}>
				<form
					className="flex flex-col items-stretch gap-8"
					onSubmit={onSubmit}
				>
					{form.formState.errors.root && (
						<div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
							<AlertCircleIcon className="size-4 shrink-0" />
							{form.formState.errors.root.message}
						</div>
					)}

					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.account.name")}
								</FormLabel>
								<FormControl>
									<Input {...field} autoFocus />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormItem className="flex items-center justify-between gap-4">
						<div>
							<FormLabel>
								{t("onboarding.account.avatar")}
							</FormLabel>

							<FormDescription>
								{t("onboarding.account.avatarDescription")}
							</FormDescription>
						</div>
						<FormControl>
							<UserAvatarUpload
								onSuccess={() => {
									return;
								}}
								onError={() => {
									return;
								}}
							/>
						</FormControl>
					</FormItem>

					<Button
						type="submit"
						loading={form.formState.isSubmitting}
						className="mt-2 w-full sm:w-auto min-h-[44px]"
						size="lg"
					>
						{t("onboarding.continue")}
						<ArrowRightIcon className="ml-2 size-4" />
					</Button>
				</form>
			</Form>
		</div>
	);
}
