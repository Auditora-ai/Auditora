"use client";

import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useTranslations } from "next-intl";

interface WizardNavigationProps {
	currentStep: number;
	totalSteps?: number;
	canGoNext: boolean;
	loading?: boolean;
	onNext: () => void;
	onBack: () => void;
}

export function WizardNavigation({
	currentStep,
	totalSteps = 4,
	canGoNext,
	loading,
	onNext,
	onBack,
}: WizardNavigationProps) {
	const t = useTranslations("scan");

	const isLastStep = currentStep === totalSteps;
	const isFirstStep = currentStep === 1;

	return (
		<div className="flex items-center justify-between border-t border-border bg-background/80 px-6 py-4 backdrop-blur-sm">
			{/* Back */}
			{!isFirstStep ? (
				<Button
					variant="ghost"
					onClick={onBack}
					disabled={loading}
					className="gap-2 text-muted-foreground hover:text-foreground"
				>
					<ChevronLeftIcon className="size-4" />
					{t("v2.back")}
				</Button>
			) : (
				<div />
			)}

			{/* Next / View Results */}
			<Button
				onClick={onNext}
				disabled={!canGoNext || loading}
				className="gap-2"
			>
				{loading ? (
					<>
						<Loader2Icon className="size-4 animate-spin" />
						{t("v2.processing")}
					</>
				) : isLastStep ? (
					t("v2.viewResults")
				) : (
					<>
						{t("v2.next")}
						<ChevronRightIcon className="size-4" />
					</>
				)}
			</Button>
		</div>
	);
}
