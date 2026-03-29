"use client";

import { useState, useCallback, useEffect } from "react";
import {
	XIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	Loader2Icon,
	CheckIcon,
	GitBranchIcon,
	UsersIcon,
	FileTextIcon,
	CalendarIcon,
	MailIcon,
} from "lucide-react";
import { toast } from "sonner";
import { StepProcess } from "./wizard/StepProcess";
import { StepParticipants } from "./wizard/StepParticipants";
import { StepContext } from "./wizard/StepContext";
import { StepSchedule } from "./wizard/StepSchedule";
import { StepInvitation } from "./wizard/StepInvitation";
import { WizardPreview } from "./wizard/WizardPreview";

export interface WizardData {
	// Step 1
	processId?: string;
	processName: string;
	isNewProcess: boolean;
	sessionType: string;
	// Step 2
	participants: Array<{ name: string; email: string; role: string }>;
	// Step 3
	contextText: string;
	contextFiles: File[];
	wizardNonce: string;
	preBuildNodes: Array<{ id: string; type: string; label: string; lane?: string; connectFrom?: string | null }> | null;
	preBuildLanes: string[] | null;
	// Step 4
	scheduledFor: string;
	duration: string;
	meetingUrl: string;
	isNoCall: boolean;
	// Step 5
	generatedInvitation: null | {
		title: string;
		intro: string;
		roleInstructions: Record<string, string>;
		intakeQuestions: string[];
		contextSummary: string;
		suggestedDuration: number;
	};
}

export interface SessionCloneData {
	processId?: string;
	processName?: string;
	sessionType?: string;
	participants?: Array<{ name: string; email: string; role: string }>;
}

const STEPS = [
	{ number: 1, label: "Proceso", icon: GitBranchIcon },
	{ number: 2, label: "Participantes", icon: UsersIcon },
	{ number: 3, label: "Contexto", icon: FileTextIcon },
	{ number: 4, label: "Agendar", icon: CalendarIcon },
	{ number: 5, label: "Invitacion", icon: MailIcon },
] as const;

function generateNonce(): string {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createInitialData(cloneFrom?: SessionCloneData): WizardData {
	return {
		processId: cloneFrom?.processId ?? undefined,
		processName: cloneFrom?.processName ?? "",
		isNewProcess: false,
		sessionType: cloneFrom?.sessionType ?? "DISCOVERY",
		participants: cloneFrom?.participants ?? [],
		contextText: "",
		contextFiles: [],
		wizardNonce: generateNonce(),
		preBuildNodes: null,
		preBuildLanes: null,
		scheduledFor: "",
		duration: "60",
		meetingUrl: "",
		isNoCall: false,
		generatedInvitation: null,
	};
}

export function SessionWizard({
	open,
	onClose,
	onCreated,
	cloneFrom,
	isOnboarding,
	organizationSlug,
}: {
	open: boolean;
	onClose: () => void;
	onCreated: () => void | Promise<void>;
	cloneFrom?: SessionCloneData;
	isOnboarding?: boolean;
	organizationSlug: string;
}) {
	const [currentStep, setCurrentStep] = useState(1);
	const [data, setData] = useState<WizardData>(() => createInitialData(cloneFrom));
	const [submitting, setSubmitting] = useState(false);
	const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
	const [intakeToken, setIntakeToken] = useState<string | null>(null);

	// Reset when opening
	useEffect(() => {
		if (open) {
			setCurrentStep(1);
			setData(createInitialData(cloneFrom));
			setSubmitting(false);
			setCreatedSessionId(null);
			setIntakeToken(null);
		}
	}, [open, cloneFrom]);

	const updateData = useCallback((patch: Partial<WizardData>) => {
		setData((prev) => ({ ...prev, ...patch }));
	}, []);

	// Escape to close
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !createdSessionId) handleGoToCommandCenter();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, onClose, createdSessionId]);

	const canGoNext = (): boolean => {
		switch (currentStep) {
			case 1:
				return data.processName.trim().length > 0 && data.sessionType.length > 0;
			case 2:
				return true; // Participants are optional
			case 3:
				return true; // Context is optional
			case 4:
				return data.isNoCall || data.scheduledFor.length > 0;
			case 5:
				return true;
			default:
				return false;
		}
	};

	const handleNext = () => {
		if (currentStep < 5) {
			setCurrentStep((s) => s + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 1) {
			setCurrentStep((s) => s - 1);
		}
	};

	const handleCreate = async () => {
		setSubmitting(true);
		try {
			const body: Record<string, unknown> = {
				sessionType: data.sessionType,
			};

			// No-call mode = edit mode (no scheduling, no meeting URL)
			if (data.isNoCall) {
				body.editMode = true;
			} else {
				if (data.scheduledFor) {
					const scheduledDate = new Date(data.scheduledFor);
					const durationMs = parseInt(data.duration, 10) * 60 * 1000;
					const scheduledEnd = new Date(scheduledDate.getTime() + durationMs);
					body.scheduledFor = scheduledDate.toISOString();
					body.scheduledEnd = scheduledEnd.toISOString();
				}
				if (data.meetingUrl) {
					body.meetingUrl = data.meetingUrl;
				}
			}

			if (data.processId) {
				body.processDefinitionId = data.processId;
			} else if (data.processName.trim()) {
				body.processName = data.processName.trim();
			}

			if (data.participants.length > 0) {
				body.participants = data.participants.filter(
					(p) => p.name.trim() || p.email.trim(),
				);
			}

			if (data.contextText.trim()) {
				body.sessionGoals = data.contextText.trim();
				body.sessionContext = data.contextText.trim();
			}

			if (data.generatedInvitation) {
				body.invitation = data.generatedInvitation;
			}

			body.wizardNonce = data.wizardNonce;

			if (data.preBuildNodes && data.preBuildNodes.length > 0) {
				body.preBuildNodes = data.preBuildNodes;
				body.preBuildLanes = data.preBuildLanes;
			}

			const res = await fetch("/api/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Error creando sesion");
			}

			const session = await res.json();
			setCreatedSessionId(session.sessionId);
			setIntakeToken(session.intakeToken ?? null);

			// Upload context files if any
			if (data.contextFiles.length > 0 && session.id) {
				const formData = new FormData();
				for (const file of data.contextFiles) {
					formData.append("files", file);
				}
				formData.append("sessionId", session.id);

				await fetch(`/api/sessions/${session.id}/preparation`, {
					method: "POST",
					body: formData,
				}).catch(() => {
					// Non-critical: files upload failed
					toast.error("Algunos archivos no se pudieron subir");
				});
			}

			toast.success("Sesion creada exitosamente");
			// Don't call onCreated yet — stay in confirmation state.
			// onCreated (which refreshes sessions) is called when user closes the wizard.
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al crear la sesion");
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoToCommandCenter = async () => {
		if (createdSessionId) {
			await onCreated();
		}
		onClose();
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex bg-chrome-base">
			{/* Left column: Step indicator */}
			<div className="hidden w-[260px] shrink-0 flex-col border-r border-chrome-border bg-chrome-base p-6 lg:flex">
				<div className="mb-8">
					<h1 className="text-lg font-semibold text-chrome-text">
						{isOnboarding ? "Primera sesion" : "Nueva sesion"}
					</h1>
					<p className="mt-1 text-xs text-chrome-text-muted">5 pasos para preparar todo</p>
				</div>

				<nav className="flex-1 space-y-1">
					{STEPS.map((step) => {
						const isActive = currentStep === step.number;
						const isCompleted = currentStep > step.number;
						const StepIcon = step.icon;

						return (
							<button
								key={step.number}
								type="button"
								onClick={() => {
									if (!createdSessionId && step.number <= currentStep) {
										setCurrentStep(step.number);
									}
								}}
								disabled={!!createdSessionId}
								className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
									isActive
										? "bg-chrome-raised text-chrome-text"
										: isCompleted
											? "text-chrome-text-secondary hover:bg-chrome-raised/50"
											: "text-chrome-text-muted"
								} disabled:cursor-default`}
							>
								<div
									className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
										isActive
											? "bg-primary text-white"
											: isCompleted
												? "bg-success/10 text-success"
												: "bg-chrome-raised text-chrome-text-muted"
									}`}
								>
									{isCompleted ? (
										<CheckIcon className="h-4 w-4" />
									) : (
										<StepIcon className="h-4 w-4" />
									)}
								</div>
								<div>
									<p className="text-sm font-medium">{step.label}</p>
									<p className="text-[11px] text-chrome-text-muted">Paso {step.number}</p>
								</div>
							</button>
						);
					})}
				</nav>
			</div>

			{/* Center: Active step content */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Top bar (mobile step indicator + close) */}
				<div className="flex items-center justify-between border-b border-chrome-border px-6 py-4">
					<div className="flex items-center gap-3 lg:hidden">
						<span className="text-sm font-medium text-chrome-text">
							Paso {currentStep} de 5
						</span>
						<span className="text-sm text-chrome-text-muted">
							{STEPS[currentStep - 1].label}
						</span>
					</div>
					<div className="hidden lg:block" />

					{/* Progress bar (mobile) */}
					<div className="mx-4 hidden h-1 flex-1 rounded-full bg-chrome-raised sm:block lg:hidden">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${(currentStep / 5) * 100}%` }}
						/>
					</div>

					<button
						type="button"
						onClick={handleGoToCommandCenter}
						className="rounded-lg p-2 text-chrome-text-muted transition-colors hover:bg-chrome-raised hover:text-chrome-text"
					>
						<XIcon className="h-5 w-5" />
					</button>
				</div>

				{/* Step content */}
				<div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8 lg:px-16">
					<div className="mx-auto max-w-2xl">
						{currentStep === 1 && <StepProcess data={data} onChange={updateData} />}
						{currentStep === 2 && (
							<StepParticipants data={data} onChange={updateData} />
						)}
						{currentStep === 3 && <StepContext data={data} onChange={updateData} />}
						{currentStep === 4 && <StepSchedule data={data} onChange={updateData} />}
						{currentStep === 5 && (
							<StepInvitation
								data={data}
								onChange={updateData}
								createdSessionId={createdSessionId}
								intakeToken={intakeToken}
								organizationSlug={organizationSlug}
								onGoToCommandCenter={handleGoToCommandCenter}
							/>
						)}
					</div>
				</div>

				{/* Bottom navigation bar */}
				{!createdSessionId && (
					<div className="flex items-center justify-between border-t border-chrome-border px-6 py-4 sm:px-10">
						<button
							type="button"
							onClick={handleBack}
							disabled={currentStep === 1}
							className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-chrome-text-secondary transition-colors hover:bg-chrome-raised hover:text-chrome-text disabled:invisible"
						>
							<ChevronLeftIcon className="h-4 w-4" />
							Atras
						</button>

						{/* Step dots (mobile) */}
						<div className="flex gap-1.5 lg:hidden">
							{STEPS.map((step) => (
								<div
									key={step.number}
									className={`h-1.5 w-1.5 rounded-full transition-colors ${
										step.number === currentStep
											? "bg-primary"
											: step.number < currentStep
												? "bg-success"
												: "bg-chrome-hover"
									}`}
								/>
							))}
						</div>

						{currentStep < 5 ? (
							<button
								type="button"
								onClick={handleNext}
								disabled={!canGoNext()}
								className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-hover disabled:opacity-50"
							>
								Siguiente
								<ChevronRightIcon className="h-4 w-4" />
							</button>
						) : (
							<button
								type="button"
								onClick={handleCreate}
								disabled={submitting || !canGoNext()}
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-hover disabled:opacity-50"
							>
								{submitting ? (
									<>
										<Loader2Icon className="h-4 w-4 animate-spin" />
										Creando...
									</>
								) : (
									"Crear Sesion"
								)}
							</button>
						)}
					</div>
				)}
			</div>

			{/* Right column: Preview */}
			<div className="hidden w-[320px] shrink-0 xl:block">
				<WizardPreview data={data} />
			</div>
		</div>
	);
}
