"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { SipocResult } from "@repo/ai";
import type { IndustryInferenceResult } from "@radiografia/lib/industry-inference";
import type { DiagramNode } from "@radiografia/lib/sipoc-to-nodes";
import type { RiskData } from "@radiografia/lib/types";
import { INDUSTRIES } from "@radiografia/lib/industries";
import { ScanHeader } from "../ScanHeader";
import { WizardStepper } from "./WizardStepper";
import { WizardNavigation } from "./WizardNavigation";
import { StepDatosBasicos, type DatosBasicosData } from "./steps/StepDatosBasicos";
import { StepExploracion } from "./steps/StepExploracion";
import { StepResultados } from "./steps/StepResultados";

type PipelinePhase =
	| "idle"
	| "creating-session"
	| "crawling"
	| "researching"
	| "analyzing"
	| "complete"
	| "error";

const STEP_PROGRESS: Record<number, number> = {
	1: 0,
	2: 50,
	3: 100,
};

interface RadiografiaWizardProps {
	mode?: "anonymous" | "authenticated";
	organizationId?: string;
	organizationSlug?: string;
	organizationName?: string;
	orgIndustry?: string;
}

export function RadiografiaWizard({
	mode = "anonymous",
	organizationId,
	organizationSlug,
	organizationName,
	orgIndustry,
}: RadiografiaWizardProps) {
	const t = useTranslations("scan");
	const searchParams = useSearchParams();

	// Wizard step (3 steps now: Datos → Exploración → Resultados)
	const [step, setStep] = useState(1);

	// Step 1 data — pre-fill from org when authenticated
	const [datos, setDatos] = useState<DatosBasicosData>({
		companyName: organizationName || "",
		industry: orgIndustry || "",
		companySize: "51-200",
		country: "MX",
		url: searchParams.get("url") || "",
	});
	const [captchaToken, setCaptchaToken] = useState<string | null>(null);

	// Pipeline results
	const [inferenceResult, setInferenceResult] = useState<IndustryInferenceResult | null>(null);
	const [sipoc, setSipoc] = useState<SipocResult | null>(null);
	const [nodes, setNodes] = useState<DiagramNode[] | null>(null);
	const [risks, setRisks] = useState<RiskData | null>(null);
	const [selectedProcess, setSelectedProcess] = useState<string>("");

	// Pipeline state
	const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>("idle");
	const [statusMessage, setStatusMessage] = useState("");
	const [error, setError] = useState<string | null>(null);

	// Prevent double-firing
	const pipelineStarted = useRef(false);

	// --- Step 1 → Step 2 transition: create session + crawl ---
	const handleStep1Submit = useCallback(async () => {
		if (pipelinePhase !== "idle" && pipelinePhase !== "error") return;

		setPipelinePhase("creating-session");
		setStatusMessage(t("v2.creatingSession"));
		setError(null);

		// Create anonymous session (works for both modes — scan pipeline needs it)
		try {
			const sessionRes = await fetch("/api/public/scan/session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					turnstileToken: captchaToken === "__skip__" ? undefined : captchaToken || undefined,
				}),
			});

			if (!sessionRes.ok) {
				setPipelinePhase("error");
				setError(t("errorCreatingSession"));
				return;
			}
		} catch {
			setPipelinePhase("error");
			setError(t("connectionError"));
			return;
		}

		// Crawl
		setPipelinePhase("crawling");
		setStatusMessage(t("v2.crawling"));

		const industryLabel = INDUSTRIES.find((i) => i.value === datos.industry)?.label || datos.industry;

		let crawlBody: Record<string, string>;
		if (datos.url.trim().length > 3) {
			let normalized = datos.url.trim().replace(/^(https?:\/\/)+/i, "");
			normalized = normalized.replace(/^[.\s/]+|[.\s/]+$/g, "");
			crawlBody = { url: `https://${normalized}` };
		} else {
			crawlBody = {
				description: `${datos.companyName} es una empresa de ${industryLabel} con ${datos.companySize} empleados en ${datos.country}. Industria: ${industryLabel}.`,
			};
		}

		try {
			const crawlRes = await fetch("/api/public/scan/crawl", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(crawlBody),
			});

			const crawlData = await crawlRes.json();

			if (!crawlData.success && datos.url.trim().length > 3) {
				await fetch("/api/public/scan/crawl", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						description: `${datos.companyName} es una empresa de ${industryLabel} con ${datos.companySize} empleados en ${datos.country}. Industria: ${industryLabel}.`,
					}),
				}).catch(() => {});
			}
		} catch {
			// Non-fatal
		}

		// Move to step 2 (Exploración)
		setPipelinePhase("researching");
		setStatusMessage(t("v2.researching"));
		setStep(2);
	}, [datos, captchaToken, pipelinePhase, t]);

	// --- Step 2: run research + instant pipeline in background ---
	useEffect(() => {
		if (step !== 2 || pipelineStarted.current) return;
		if (pipelinePhase !== "researching") return;
		pipelineStarted.current = true;

		async function runPipeline() {
			// Research (fire and forget)
			fetch("/api/public/scan/research", { method: "POST" }).catch(() => {});

			// Instant pipeline (SSE)
			setPipelinePhase("analyzing");
			setStatusMessage(t("v2.analyzingIndustry"));

			try {
				const res = await fetch("/api/public/scan/instant", { method: "POST" });

				if (!res.ok || !res.body) {
					setPipelinePhase("error");
					setError(t("errorGenerating"));
					return;
				}

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n\n");
					buffer = lines.pop() || "";

					for (const line of lines) {
						if (!line.startsWith("data: ")) continue;
						try {
							const event = JSON.parse(line.slice(6));
							handleSSEEvent(event);
						} catch {
							// Skip malformed
						}
					}
				}
			} catch {
				setPipelinePhase("error");
				setError(t("connectionError"));
			}
		}

		runPipeline();
	}, [step, pipelinePhase]);

	function handleSSEEvent(event: { phase: string; data: unknown; message: string }) {
		setStatusMessage(event.message);

		switch (event.phase) {
			case "industry":
				if (event.data) {
					const result = event.data as IndustryInferenceResult;
					setInferenceResult(result);
					if (result.selectedProcess) {
						setSelectedProcess(result.selectedProcess.name);
					}
				}
				break;
			case "sipoc":
				if (event.data) setSipoc(event.data as SipocResult);
				break;
			case "diagram":
				if (event.data) {
					const d = event.data as { nodes: DiagramNode[] };
					setNodes(d.nodes);
				}
				break;
			case "risks":
				if (event.data) setRisks(event.data as RiskData);
				break;
			case "complete":
				setPipelinePhase("complete");
				setStatusMessage("");
				break;
			case "error":
				setPipelinePhase("error");
				setError(event.message);
				break;
		}
	}

	// --- Navigation ---
	function canGoNext(): boolean {
		if (step === 1) {
			return datos.companyName.trim().length > 0 && datos.industry.length > 0;
		}
		return false; // Step 2 uses its own "Ver resultados" button
	}

	function handleNext() {
		if (step === 1) {
			handleStep1Submit();
		}
	}

	function handleBack() {
		// Only allow going back from step 2 if pipeline hasn't started
		if (step === 2 && !pipelineStarted.current) {
			setStep(1);
		}
	}

	function handleViewResults() {
		setStep(3);
	}

	const updateDatos = useCallback((patch: Partial<DatosBasicosData>) => {
		setDatos((prev) => ({ ...prev, ...patch }));
	}, []);

	const isLoading =
		pipelinePhase === "creating-session" ||
		pipelinePhase === "crawling";

	return (
		<>
			<ScanHeader progress={STEP_PROGRESS[step]} />

			<div className="flex min-h-screen flex-col bg-background pt-12">
				{/* Stepper */}
				<div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-2 md:px-6">
					<WizardStepper currentStep={step} totalSteps={3} />
				</div>

				{/* Step content */}
				{step === 1 && (
					<div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">
						{error && (
							<div className="mx-auto mb-4 max-w-lg rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								{error}
							</div>
						)}
						<StepDatosBasicos
							data={datos}
							onChange={updateDatos}
							onCaptchaToken={setCaptchaToken}
							isAuthenticated={mode === "authenticated"}
						/>
					</div>
				)}

				{step === 2 && (
					<StepExploracion
						inferenceResult={inferenceResult}
						sipoc={sipoc}
						risks={risks}
						selectedProcess={selectedProcess}
						onSelectProcess={setSelectedProcess}
						pipelineLoading={pipelinePhase === "analyzing" || pipelinePhase === "researching"}
						statusMessage={statusMessage}
						onViewResults={handleViewResults}
					/>
				)}

				{step === 3 && (
					<div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">
						<StepResultados
							inferenceResult={inferenceResult}
							sipoc={sipoc}
							risks={risks}
							companyName={datos.companyName}
							mode={mode}
							organizationId={organizationId}
							organizationSlug={organizationSlug}
						/>
					</div>
				)}

				{/* Navigation — only on step 1 */}
				{step === 1 && (
					<WizardNavigation
						currentStep={step}
						totalSteps={3}
						canGoNext={canGoNext()}
						loading={isLoading}
						onNext={handleNext}
						onBack={handleBack}
					/>
				)}
			</div>
		</>
	);
}
