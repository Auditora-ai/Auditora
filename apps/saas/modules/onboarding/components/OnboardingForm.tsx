"use client";
import { authClient } from "@repo/auth/client";
import { Progress } from "@repo/ui/components/progress";
import { Button } from "@repo/ui/components/button";
import { useRouter } from "@shared/hooks/router";
import { clearCache } from "@shared/lib/cache";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useRef } from "react";
import { withQuery } from "ufo";
import { OnboardingAccountStep } from "./OnboardingAccountStep";
import { OnboardingCompanyStep } from "./OnboardingCompanyStep";
import { OnboardingFirstValueStep } from "./OnboardingFirstValueStep";
import { OnboardingSetupCompleteStep } from "./OnboardingSetupCompleteStep";

const stepTransition = {
	initial: { opacity: 0, x: 20 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: -20 },
	transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export function OnboardingForm() {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();
	const directionRef = useRef<"forward" | "back">("forward");

	const stepSearchParam = searchParams.get("step");
	const redirectTo = searchParams.get("redirectTo");
	const parsedStep = stepSearchParam
		? Number.parseInt(stepSearchParam, 10)
		: 1;
	// Clamp step to valid range (1–4)
	const onboardingStep = Number.isNaN(parsedStep)
		? 1
		: Math.max(1, Math.min(4, parsedStep));

	const setStep = (step: number) => {
		directionRef.current = step > onboardingStep ? "forward" : "back";
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

	const handleBack = useCallback(() => {
		if (onboardingStep > 1) {
			setStep(onboardingStep - 1);
		}
	}, [onboardingStep]);

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

	const xDirection = directionRef.current === "forward" ? 1 : -1;

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
					{onboardingStep > 1 && (
						<Button
							variant="ghost"
							size="icon"
							onClick={handleBack}
							className="shrink-0 size-9 min-h-[44px] min-w-[44px]"
							aria-label={t("common.back")}
						>
							<ArrowLeftIcon className="size-4" />
						</Button>
					)}
					<Progress
						value={(onboardingStep / steps.length) * 100}
						className="h-2"
					/>
					<span className="shrink-0 text-foreground/60 text-xs tabular-nums">
						{t("onboarding.step", {
							step: onboardingStep,
							total: steps.length,
						})}
					</span>
				</div>
			)}

			<AnimatePresence mode="wait" initial={false}>
				<motion.div
					key={onboardingStep}
					initial={{ opacity: 0, x: 20 * xDirection }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -20 * xDirection }}
					transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
				>
					{steps[onboardingStep - 1]?.component}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
