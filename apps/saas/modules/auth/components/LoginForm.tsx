"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
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
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useRouter } from "@shared/hooks/router";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	EyeIcon,
	EyeOffIcon,
	KeyIcon,
	LockIcon,
	MailIcon,
	MailboxIcon,
	ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import {
	type OAuthProvider,
	oAuthProviders,
} from "../constants/oauth-providers";
import { useSession } from "../hooks/use-session";
import { LoginModeSwitch } from "./LoginModeSwitch";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.union([
	z.object({
		mode: z.literal("magic-link"),
		email: z.email(),
		rememberMe: z.boolean().optional(),
	}),
	z.object({
		mode: z.literal("password"),
		email: z.email(),
		password: z.string().min(1),
		rememberMe: z.boolean().optional(),
	}),
]);

export function LoginForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const [showPassword, setShowPassword] = useState(false);
	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: email ?? "",
			password: "",
			mode: authConfig.enablePasswordLogin ? "password" : "magic-link",
			rememberMe: true,
		},
	});

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			window.location.href = redirectPath;
		}
	}, [user, sessionLoaded]);

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			if (values.mode === "password") {
				const { data, error } = await authClient.signIn.email({
					email: values.email,
					password: values.password,
					rememberMe: values.rememberMe ?? true,
				});

				if (error) {
					throw error;
				}

				if ((data as any).twoFactorRedirect) {
					router.replace(
						withQuery(
							"/verify",
							Object.fromEntries(searchParams.entries()),
						),
					);
					return;
				}

				window.location.href = redirectPath;
			} else {
				const { error } = await authClient.signIn.magicLink({
					...values,
					callbackURL: redirectPath,
				});

				if (error) {
					throw error;
				}
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

	const signInWithPasskey = async () => {
		try {
			await authClient.signIn.passkey();

			window.location.href = redirectPath;
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e
						? (e.code as string)
						: undefined,
				),
			});
		}
	};

	const signinMode = form.watch("mode");

	return (
		<div>
		<h1 className="auth-title text-2xl md:text-3xl font-semibold tracking-tight">
			{t("auth.login.title")}
		</h1>
		<p className="auth-subtitle mt-1.5 mb-6 md:mt-2 md:mb-8 text-sm md:text-base text-foreground/60">
			{t("auth.login.subtitle")}
		</p>

			{form.formState.isSubmitSuccessful &&
			signinMode === "magic-link" ? (
				<Alert variant="success">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.login.hints.linkSent.title")}
					</AlertTitle>
					<AlertDescription>
						{t("auth.login.hints.linkSent.message")}
					</AlertDescription>
				</Alert>
			) : (
				<>
					{invitationId && (
						<OrganizationInvitationAlert className="mb-6" />
					)}

					<Form {...form}>
						<form
							className="auth-form-content space-y-4"
							onSubmit={onSubmit}
						>
							{authConfig.enableMagicLink &&
								authConfig.enablePasswordLogin && (
									<LoginModeSwitch
										activeMode={signinMode}
										onChange={(mode) =>
											form.setValue(
												"mode",
												mode as typeof signinMode,
											)
										}
									/>
								)}

							{form.formState.isSubmitted &&
								form.formState.errors.root?.message && (
									<Alert variant="error">
										<AlertTriangleIcon />
										<AlertTitle>
											{form.formState.errors.root.message}
										</AlertTitle>
									</Alert>
								)}

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem className="auth-form-field">
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
												/>
											</div>
										</FormControl>
									</FormItem>
								)}
							/>

							{authConfig.enablePasswordLogin &&
								signinMode === "password" && (
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem className="auth-form-field">
												<FormLabel>
													{t("auth.signup.password")}
												</FormLabel>
												<FormControl>
													<div className="relative">
														<LockIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
														<Input
															type={
																showPassword
																	? "text"
																	: "password"
															}
															className="pl-10 pr-10"
															{...field}
															autoComplete="current-password"
														/>
														<button
															type="button"
															onClick={() =>
																setShowPassword(
																	!showPassword,
																)
															}
															className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
															aria-label={
																showPassword
																	? "Hide password"
																	: "Show password"
															}
														>
															{showPassword ? (
																<EyeOffIcon className="size-4" />
															) : (
																<EyeIcon className="size-4" />
															)}
														</button>
													</div>
												</FormControl>
											</FormItem>
										)}
									/>
								)}

							{/* Remember me + Forgot password row */}
							{authConfig.enablePasswordLogin &&
								signinMode === "password" && (
									<div className="flex items-center justify-between">
								<label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
									<input
										type="checkbox"
										className="size-4 rounded border-border accent-primary"
										checked={form.watch("rememberMe") ?? true}
										onChange={(e) =>
											form.setValue("rememberMe", e.target.checked)
										}
									/>
									{t("auth.login.rememberMe")}
								</label>

										<Link
											href="/forgot-password"
											className="text-sm text-primary hover:underline"
										>
											{t("auth.login.forgotPassword")}
										</Link>
									</div>
								)}

							<Button
								className="w-full"
								type="submit"
								variant="primary"
								size="lg"
								loading={form.formState.isSubmitting}
							>
								{signinMode === "magic-link"
									? t("auth.login.sendMagicLink")
									: t("auth.login.submit")}
								<ArrowRightIcon className="ml-2 size-4" />
							</Button>
						</form>
					</Form>

					{/* Security message */}
					<p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
						<ShieldCheckIcon className="size-3.5" />
						{t("auth.login.security")}
					</p>

					{(authConfig.enablePasskeys ||
						(authConfig.enableSignup &&
							authConfig.enableSocialLogin)) && (
						<>
							<div className="relative my-6 h-4">
								<hr className="relative top-2" />
								<p className="-translate-x-1/2 absolute top-0 left-1/2 mx-auto inline-block h-4 bg-background px-2 text-center font-medium text-foreground/60 text-sm leading-tight">
									{t("auth.login.continueWith")}
								</p>
							</div>

							<div className="grid grid-cols-1 items-stretch gap-2.5">
								{authConfig.enableSignup &&
									authConfig.enableSocialLogin &&
									Object.keys(oAuthProviders).map(
										(providerId) => (
											<SocialSigninButton
												key={providerId}
												provider={
													providerId as OAuthProvider
												}
											/>
										),
									)}

								{authConfig.enablePasskeys && (
							<Button
								variant="secondary"
								className="w-full min-h-[44px]"
								onClick={() => signInWithPasskey()}
									>
										<KeyIcon className="mr-1.5 size-4 text-primary" />
										{t("auth.login.loginWithPasskey")}
									</Button>
								)}
							</div>
						</>
					)}

					{authConfig.enableSignup && (
						<div className="mt-6 text-center text-sm">
							<span className="text-foreground/60">
								{t("auth.login.dontHaveAnAccount")}{" "}
							</span>
							<Link
								href={withQuery(
									"/signup",
									Object.fromEntries(searchParams.entries()),
								)}
							>
								{t("auth.login.createAnAccount")}
								<ArrowRightIcon className="ml-1 inline size-4 align-middle" />
							</Link>
						</div>
					)}
				</>
			)}
		</div>
	);
}
