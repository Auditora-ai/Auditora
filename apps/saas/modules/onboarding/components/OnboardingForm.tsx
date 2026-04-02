"use client";
import { authClient } from "@repo/auth/client";
import { Progress } from "@repo/ui/components/progress";
import { useRouter } from "@shared/hooks/router";
import { clearCache } from "@shared/lib/cache";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { withQuery } from "ufo";
import { OnboardingAccountStep } from "./OnboardingAccountStep";
import { OnboardingCompanyStep } from "./OnboardingCompanyStep";
import { OnboardingFirstValueStep } from "./OnboardingFirstValueStep";
import { OnboardingSetupCompleteStep } from "./OnboardingSetupCompleteStep";

export function OnboardingForm() {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const stepSearchParam = searchParams.get("step");
	const redirectTo = searchParams.get("redirectTo");
	const onboardingStep = stepSearchParam
		? Number.parseInt(stepSearchParam, 10)
		: 1;

	const setStep = (step: number) => {
		router.replace(
			withQuery(window.location.search ?? "", {
				step,
			}),
		);
	};

	const onCompleted = useCallback(async () => {
		await authClient.updateUser({
			onboardingComplete: true,
		});

		await clearCache();
		router.replace(redirectTo ?? "/");
	}, [router, redirectTo]);

	const handleAccountComplete = useCallback(() => {
		setStep(2);
	}, []);

	const handleCompanyComplete = useCallback(() => {
		setStep(3);
	}, []);

	const handleFirstValueComplete = useCallback(() => {
		setStep(4);
	}, []);

	const steps = useMemo(() => {
		const allSteps: { component: React.ReactNode }[] = [
			{
				component: (
					<OnboardingAccountStep onCompleted={handleAccountComplete} />
				),
			},
			{
				component: (
					<OnboardingCompanyStep onCompleted={handleCompanyComplete} />
				),
			},
			{
				component: (
					<OnboardingFirstValueStep
						onCompleted={handleFirstValueComplete}
					/>
				),
			},
			{
				component: (
					<OnboardingSetupCompleteStep onCompleted={onCompleted} />
				),
			},
		];

		return allSteps;
	}, [
		handleAccountComplete,
		handleCompanyComplete,
		handleFirstValueComplete,
		onCompleted,
	]);

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">
				{t("onboarding.title")}
			</h1>
			<p className="mt-2 mb-6 text-foreground/60">
				{t("onboarding.message")}
			</p>

			{steps.length > 1 && (
				<div className="mb-6 flex items-center gap-3">
					<Progress
						value={(onboardingStep / steps.length) * 100}
						className="h-2"
					/>
					<span className="shrink-0 text-foreground/60 text-xs">
						{t("onboarding.step", {
							step: onboardingStep,
							total: steps.length,
						})}
					</span>
				</div>
			)}

			{steps[onboardingStep - 1]?.component}
		</div>
	);
}
