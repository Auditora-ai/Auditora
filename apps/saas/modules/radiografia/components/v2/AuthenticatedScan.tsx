"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { INDUSTRIES } from "@radiografia/lib/industries";
import { WizardNavigation } from "./WizardNavigation";
import { StepIntake, type IntakeData } from "./steps/StepIntake";
import { StepDiscovery } from "./steps/StepDiscovery";
import { StepEntregables } from "./steps/StepEntregables";

interface DeliverableResult {
	type: string;
	status: "pending" | "running" | "completed" | "failed";
	error?: string;
}

interface AuthenticatedScanProps {
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
	orgIndustry?: string;
}

export function AuthenticatedScan({
	organizationId,
	organizationSlug,
	organizationName,
	orgIndustry,
}: AuthenticatedScanProps) {
	const t = useTranslations("scan");

	const [step, setStep] = useState(1);

	// Intake data
	const [intake, setIntake] = useState<IntakeData>({
		industry: orgIndustry || "",
		companySize: "51-200",
		country: "MX",
		url: "",
		challenge: "",
	});

	// Discovery context
	const [initialDiscoveryMessage, setInitialDiscoveryMessage] = useState<string>("");
	const [intakeSubmitting, setIntakeSubmitting] = useState(false);

	// Deliverables
	const [deliverables, setDeliverables] = useState<DeliverableResult[]>([]);
	const [generatingDeliverables, setGeneratingDeliverables] = useState(false);

	// --- Step 1 → Step 2: Submit intake, crawl, and build context ---
	const handleIntakeSubmit = useCallback(async () => {
		if (intakeSubmitting) return;
		setIntakeSubmitting(true);

		const industryLabel = INDUSTRIES.find((i) => i.value === intake.industry)?.label || intake.industry;

		// Try to crawl URL for context (fire and forget)
		if (intake.url.trim().length > 3) {
			try {
				await fetch("/api/public/scan/session", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});

				let normalized = intake.url.trim().replace(/^(https?:\/\/)+/i, "");
				normalized = normalized.replace(/^[.\s/]+|[.\s/]+$/g, "");
				await fetch("/api/public/scan/crawl", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ url: `https://${normalized}` }),
				});
			} catch {
				// Non-fatal
			}
		}

		// Build context message for the discovery chat
		const contextParts = [
			`Empresa: ${organizationName}`,
			`Industria: ${industryLabel}`,
			`Tamaño: ${intake.companySize} empleados`,
		];
		if (intake.challenge.trim()) {
			contextParts.push(`Principal desafío operativo: ${intake.challenge.trim()}`);
		}

		setInitialDiscoveryMessage(
			`${contextParts.join(". ")}. Quiero hacer un discovery de los procesos de esta empresa para construir su arquitectura de procesos.`,
		);

		setIntakeSubmitting(false);
		setStep(2);
	}, [intake, intakeSubmitting, organizationName]);

	// --- Step 2 → Step 3: Generate deliverables ---
	const handleGenerateDeliverables = useCallback(async (types: string[]) => {
		setGeneratingDeliverables(true);

		const initial: DeliverableResult[] = types.map((type) => ({
			type,
			status: "pending" as const,
		}));
		setDeliverables(initial);
		setStep(3);

		// Company Brain enrichment (fire and forget)
		fetch("/api/company-brain", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ organizationId }),
		}).catch(() => {});

		// Generate each deliverable sequentially
		for (const type of types) {
			setDeliverables((prev) =>
				prev.map((d) => (d.type === type ? { ...d, status: "running" as const } : d)),
			);

			try {
				const res = await fetch(`/api/deliverables/${type}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ organizationId }),
				});

				if (!res.ok) {
					const err = await res.json().catch(() => ({}));
					setDeliverables((prev) =>
						prev.map((d) =>
							d.type === type ? { ...d, status: "failed" as const, error: err.error || "Error" } : d,
						),
					);
				} else {
					setDeliverables((prev) =>
						prev.map((d) => (d.type === type ? { ...d, status: "completed" as const } : d)),
					);
				}
			} catch {
				setDeliverables((prev) =>
					prev.map((d) =>
						d.type === type ? { ...d, status: "failed" as const, error: "Error de conexión" } : d,
					),
				);
			}
		}

		setGeneratingDeliverables(false);
	}, [organizationId]);

	// --- Navigation ---
	const canGoNext = step === 1 && intake.industry.length > 0;

	const handleNext = () => {
		if (step === 1) handleIntakeSubmit();
	};

	const handleBack = () => {
		if (step === 2 && !generatingDeliverables) setStep(1);
	};

	const updateIntake = useCallback((patch: Partial<IntakeData>) => {
		setIntake((prev) => ({ ...prev, ...patch }));
	}, []);

	// Step labels for inline header
	const STEP_LABELS = [
		t("discovery.intakeTitle", { company: organizationName }),
		t("discovery.chatWelcome").slice(0, 30) + "...",
		t("discovery.deliverablesTitle"),
	];

	return (
		<div className="flex h-[calc(100vh-3.5rem)] flex-col">
			{/* Inline step indicator */}
			<div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
				<div>
					<h1 className="text-lg font-display font-semibold text-foreground">
						{step === 1 ? t("discovery.intakeTitle", { company: organizationName })
							: step === 2 ? "Discovery"
							: t("discovery.deliverablesTitle")}
					</h1>
					<p className="text-xs text-muted-foreground">
						{t("v2.pasoNdeM", { n: step, m: 3 })}
					</p>
				</div>
				{/* Step dots */}
				<div className="flex items-center gap-1.5">
					{[1, 2, 3].map((s) => (
						<div
							key={s}
							className={`size-2 rounded-full transition-colors ${
								s === step ? "bg-primary" : s < step ? "bg-success" : "bg-border"
							}`}
						/>
					))}
				</div>
			</div>

			{/* Step 1: Intake */}
			{step === 1 && (
				<>
					<div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
						<StepIntake
							data={intake}
							onChange={updateIntake}
							organizationName={organizationName}
						/>
					</div>
					<WizardNavigation
						currentStep={1}
						totalSteps={3}
						canGoNext={canGoNext}
						loading={intakeSubmitting}
						onNext={handleNext}
						onBack={handleBack}
					/>
				</>
			)}

			{/* Step 2: Discovery */}
			{step === 2 && (
				<StepDiscovery
					organizationId={organizationId}
					initialMessage={initialDiscoveryMessage}
					onGenerateDeliverables={handleGenerateDeliverables}
					generating={generatingDeliverables}
				/>
			)}

			{/* Step 3: Entregables */}
			{step === 3 && (
				<div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
					<StepEntregables
						deliverables={deliverables}
						organizationSlug={organizationSlug}
					/>
				</div>
			)}
		</div>
	);
}
