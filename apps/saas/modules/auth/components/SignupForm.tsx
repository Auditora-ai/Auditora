"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { useSession } from "@auth/hooks/use-session";
import { config } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationInvitationAlert } from "@organizations/components/OrganizationInvitationAlert";
import { authClient } from "@repo/auth/client";
import { config as authConfig } from "@repo/auth/config";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
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
import { cn } from "@repo/ui";
import { passwordSchema } from "@repo/utils";
import { PasswordInput } from "@shared/components/PasswordInput";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	LockIcon,
	MailIcon,
	MailboxIcon,
	ShieldCheckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import {
	type OAuthProvider,
	oAuthProviders,
} from "../constants/oauth-providers";
import { SocialSigninButton } from "./SocialSigninButton";

export function SignupForm({ prefillEmail }: { prefillEmail?: string }) {
	const t = useTranslations();
	const { user, loaded: sessionLoaded } = useSession();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const searchParams = useSearchParams();

	const formSchema = z.object({
		email: z.email(),
		name: z.string().min(1),
		password: passwordSchema,
		acceptTerms: z.boolean().refine((val) => val === true, {
			message: t("auth.signup.acceptRequired"),
		}),
	});

	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: prefillEmail ?? email ?? "",
			password: "",
			acceptTerms: false as boolean,
		},
	});

	const invitationOnlyMode = !authConfig.enableSignup && invitationId;

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			window.location.href = redirectPath;
		}
	}, [user, sessionLoaded]);

	const onSubmit = form.handleSubmit(async ({ email, password, name }) => {
		try {
			const { error } = await (authConfig.enablePasswordLogin
				? await authClient.signUp.email({
						email,
						password,
						name,
						callbackURL: redirectPath,
					})
				: authClient.signIn.magicLink({
						email,
						name,
						callbackURL: redirectPath,
					}));

			if (error) {
				throw error;
			}

			if (invitationOnlyMode) {
				const { error } =
					await authClient.organization.acceptInvitation({
						invitationId,
					});

				if (error) {
					throw error;
				}

				window.location.href = config.redirectAfterSignIn;
			}
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e
						? (e.code as string)
						: undefined,
				),
			});
		}
	});

	return (
		<div>
			<h1 className="auth-title text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
				{t("auth.signup.title")}
			</h1>
			<p className="auth-subtitle mt-2 mb-8 text-base text-muted-foreground">
				{t("auth.signup.message")}
			</p>

			{form.formState.isSubmitSuccessful && !invitationOnlyMode ? (
				<Alert variant="success">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.signup.hints.verifyEmail")}
					</AlertTitle>
				</Alert>
			) : (
				<>
					{invitationId && (
						<OrganizationInvitationAlert className="mb-6" />
					)}

					<Form {...form}>
						<form
							className="flex flex-col items-stretch gap-4"
							onSubmit={onSubmit}
						>
							{form.formState.isSubmitted &&
								form.formState.errors.root && (
									<Alert variant="error">
										<AlertTriangleIcon />
										<AlertDescription>
											{form.formState.errors.root.message}
										</AlertDescription>
									</Alert>
								)}

							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("auth.signup.name")}
										</FormLabel>
										<FormControl>
											<div className="relative">
												<UserIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
												<Input
													{...field}
													className="pl-10"
												/>
											</div>
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
											{t("auth.signup.email")}
										</FormLabel>
										<FormControl>
											<div className="relative">
												<MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
												<Input
													{...field}
													className="pl-10"
													autoComplete="email"
													readOnly={!!prefillEmail}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{authConfig.enablePasswordLogin && (
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("auth.signup.password")}
											</FormLabel>
											<FormControl>
												<PasswordInput
													autoComplete="new-password"
													showGenerateButton
													showPasswordCriteria
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="acceptTerms"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start gap-3 space-y-0">
										<FormControl>
											<input
												type="checkbox"
												checked={field.value === true}
												onChange={(e) =>
													field.onChange(
														e.target.checked,
													)
												}
												className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
											/>
										</FormControl>
										<div className="space-y-1">
											<FormLabel className="text-xs font-normal leading-relaxed text-muted-foreground">
												{t.rich(
													"auth.signup.acceptTerms",
													{
														termsLink: (chunks) => (
															<Link
																href="/legal/terms"
																target="_blank"
																className="underline text-foreground hover:text-foreground"
															>
																{chunks}
															</Link>
														),
														privacyLink: (
															chunks,
														) => (
															<Link
																href="/legal/privacy-policy"
																target="_blank"
																className="underline text-foreground hover:text-foreground"
															>
																{chunks}
															</Link>
														),
													},
												)}
											</FormLabel>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							<Button
								variant="primary"
								size="lg"
								className="min-h-[48px] w-full"
								loading={form.formState.isSubmitting}
							>
								{t("auth.signup.submit")}
								<ArrowRightIcon className="ml-2 size-4" />
							</Button>
						</form>
					</Form>

					{/* Security message */}
					<p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
						<ShieldCheckIcon className="size-3.5" />
						{t("auth.login.security")}
					</p>

					{authConfig.enableSignup &&
						authConfig.enableSocialLogin && (
							<>
								<div className="relative my-6 h-4">
									<hr className="relative top-2 border-border" />
									<p className="-translate-x-1/2 absolute top-0 left-1/2 mx-auto inline-block h-4 bg-background px-2 text-center font-medium text-muted-foreground text-sm leading-tight">
										{t("auth.login.continueWith")}
									</p>
								</div>

								<div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2">
									{Object.keys(oAuthProviders).map(
										(providerId) => (
											<SocialSigninButton
												key={providerId}
												provider={
													providerId as OAuthProvider
												}
											/>
										),
									)}
								</div>
							</>
						)}
				</>
			)}

			<div className="mt-6 text-center text-sm">
				<span className="text-muted-foreground">
					{t("auth.signup.alreadyHaveAccount")}{" "}
				</span>
				<Link
					href={withQuery(
						"/login",
						Object.fromEntries(searchParams.entries()),
					)}
				>
					{t("auth.signup.signIn")}
					<ArrowRightIcon className="ml-1 inline size-4 align-middle" />
				</Link>
			</div>
		</div>
	);
}
