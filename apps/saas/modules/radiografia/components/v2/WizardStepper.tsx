"use client";

import { useEffect, useRef } from "react";
import {
	Building2Icon,
	MessageSquareIcon,
	FileTextIcon,
	CheckIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

const STEP_ICONS_3 = [Building2Icon, MessageSquareIcon, FileTextIcon] as const;

interface WizardStepperProps {
	currentStep: number;
	totalSteps?: number;
}

export function WizardStepper({ currentStep, totalSteps = 3 }: WizardStepperProps) {
	const t = useTranslations("scan");
	const progressRef = useRef<HTMLDivElement>(null);

	const STEP_LABELS = [
		t("v2.stepDatosBasicos"),
		t("v2.stepExploracion"),
		t("v2.stepResultados"),
	];

	const icons = STEP_ICONS_3;

	useEffect(() => {
		const bar = progressRef.current;
		if (!bar) return;

		const pct = ((currentStep - 1) / (totalSteps - 1)) * 100;

		let raf: number;
		const start = parseFloat(bar.style.width || "0");
		const duration = 500;
		const startTime = performance.now();

		function animate(now: number) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			const current = start + (pct - start) * eased;
			bar!.style.width = `${current}%`;
			if (progress < 1) raf = requestAnimationFrame(animate);
		}

		raf = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(raf);
	}, [currentStep, totalSteps]);

	return (
		<nav
			role="navigation"
			aria-label="Progreso del escaneo"
			className="w-full"
		>
			{/* Mobile: compact */}
			<div className="flex items-center justify-between md:hidden">
				<p className="text-sm font-medium text-muted-foreground">
					{t("v2.pasoNdeM", { n: currentStep, m: totalSteps })}
				</p>
				<p className="text-sm font-semibold text-foreground">
					{STEP_LABELS[currentStep - 1]}
				</p>
			</div>

			{/* Mobile progress bar */}
			<div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border/50 md:hidden">
				<div
					ref={progressRef}
					className="h-full rounded-full bg-primary transition-none"
					style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
				/>
			</div>

			{/* Desktop: full stepper */}
			<div className="hidden md:block">
				<div className="relative flex items-center justify-between">
					<div className="absolute top-5 right-10 left-10 h-0.5 bg-border/50" />

					<div className="absolute top-5 right-10 left-10 h-0.5">
						<div
							className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
							style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
						/>
					</div>

					{STEP_LABELS.map((label, i) => {
						const stepNum = i + 1;
						const isActive = stepNum === currentStep;
						const isCompleted = stepNum < currentStep;
						const Icon = icons[i];

						return (
							<div
								key={stepNum}
								className="relative z-10 flex flex-col items-center gap-2"
								aria-current={isActive ? "step" : undefined}
							>
								<div
									className={`flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
										isCompleted
											? "border-success bg-success text-white"
											: isActive
												? "border-primary bg-primary text-white shadow-lg shadow-primary/25"
												: "border-border bg-background text-muted-foreground"
									}`}
								>
									{isCompleted ? (
										<CheckIcon className="size-4" />
									) : (
										<Icon className="size-4" />
									)}
								</div>
								<span
									className={`text-xs font-medium transition-colors duration-300 ${
										isActive
											? "text-foreground"
											: isCompleted
												? "text-success"
												: "text-muted-foreground"
									}`}
								>
									{label}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
