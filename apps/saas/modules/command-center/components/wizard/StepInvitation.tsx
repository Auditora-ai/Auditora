"use client";

import { useState } from "react";
import {
	SparklesIcon,
	Loader2Icon,
	CopyIcon,
	CheckIcon,
	ExternalLinkIcon,
	PartyPopperIcon,
	MailIcon,
	MessageCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { WizardData } from "../SessionWizard";

interface StepInvitationProps {
	data: WizardData;
	onChange: (patch: Partial<WizardData>) => void;
	createdSessionId: string | null;
	intakeToken: string | null;
	organizationSlug: string;
	onGoToCommandCenter: () => void;
}

export function StepInvitation({
	data,
	onChange,
	createdSessionId,
	intakeToken,
	organizationSlug,
	onGoToCommandCenter,
}: StepInvitationProps) {
	const [generating, setGenerating] = useState(false);
	const [copied, setCopied] = useState<string | null>(null);
	const [includeIntakeLink, setIncludeIntakeLink] = useState(true);

	const invitation = data.generatedInvitation;

	const handleGenerate = async () => {
		setGenerating(true);
		try {
			const res = await fetch("/api/sessions/prepare-invitation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					processName: data.processName,
					sessionType: data.sessionType,
					participants: data.participants,
					contextText: data.contextText,
					scheduledFor: data.scheduledFor,
					duration: data.duration,
				}),
			});

			if (!res.ok) throw new Error("Error generando invitacion");

			const result = await res.json();
			onChange({ generatedInvitation: result });
		} catch {
			toast.error("No se pudo generar la invitacion. Intenta de nuevo.");
		} finally {
			setGenerating(false);
		}
	};

	const rawIntakeUrl = intakeToken
		? `${typeof window !== "undefined" ? window.location.origin : ""}/intake/${intakeToken}`
		: null;
	const intakeUrl = includeIntakeLink ? rawIntakeUrl : null;

	const formatPlainText = () => {
		if (!invitation) return "";
		return [
			invitation.title,
			"",
			invitation.intro,
			"",
			"Instrucciones por rol:",
			...Object.entries(invitation.roleInstructions).map(
				([role, instr]) => `  ${role}: ${instr}`,
			),
			"",
			"Preguntas previas:",
			...invitation.intakeQuestions.map((q, i) => `  ${i + 1}. ${q}`),
			"",
			invitation.contextSummary ? `Contexto: ${invitation.contextSummary}` : "",
			invitation.suggestedDuration ? `Duración sugerida: ${invitation.suggestedDuration} min` : "",
			"",
			intakeUrl ? `Formulario de preparación: ${intakeUrl}` : "",
			intakeUrl ? "Por favor completa el formulario antes de la sesión para que podamos aprovechar mejor el tiempo." : "",
		].filter(Boolean).join("\n");
	};

	const formatWhatsApp = () => {
		if (!invitation) return "";
		return [
			`*${invitation.title}*`,
			"",
			invitation.intro,
			"",
			"*Instrucciones por rol:*",
			...Object.entries(invitation.roleInstructions).map(
				([role, instr]) => `▸ *${role}:* ${instr}`,
			),
			"",
			"*Preguntas previas:*",
			...invitation.intakeQuestions.map((q, i) => `${i + 1}. ${q}`),
			"",
			invitation.contextSummary ? `_${invitation.contextSummary}_` : "",
			invitation.suggestedDuration ? `⏱ ${invitation.suggestedDuration} min` : "",
			"",
			intakeUrl ? `📋 *Formulario de preparación:*\n${intakeUrl}` : "",
			intakeUrl ? "_Complétalo antes de la sesión para aprovechar mejor el tiempo._" : "",
		].filter(Boolean).join("\n");
	};

	const formatEmailHtml = () => {
		if (!invitation) return "";
		const roles = Object.entries(invitation.roleInstructions)
			.map(([role, instr]) => `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top;white-space:nowrap;color:#0F172A">${role}</td><td style="padding:6px 12px;color:#334155">${instr}</td></tr>`)
			.join("");
		const questions = invitation.intakeQuestions
			.map((q) => `<li style="margin-bottom:4px;color:#334155">${q}</li>`)
			.join("");
		const intakeBlock = intakeUrl
			? `<div style="margin-top:20px;padding:16px;background:#EFF6FF;border-radius:8px;border:1px solid #BFDBFE">
<p style="margin:0 0 8px;font-weight:600;color:#1D4ED8;font-size:14px">📋 Formulario de preparación</p>
<p style="margin:0 0 8px;color:#334155;font-size:13px">Completa este formulario antes de la sesión para que podamos aprovechar mejor el tiempo:</p>
<a href="${intakeUrl}" style="display:inline-block;padding:10px 20px;background:#2563EB;color:white;text-decoration:none;border-radius:6px;font-weight:500;font-size:14px">Completar formulario</a>
</div>`
			: "";
		return `<div style="font-family:'Geist Sans',system-ui,sans-serif;max-width:600px">
<h2 style="color:#0F172A;margin-bottom:8px">${invitation.title}</h2>
<p style="color:#334155;line-height:1.6">${invitation.intro}</p>
<h3 style="color:#0F172A;margin-top:20px;margin-bottom:8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em">Instrucciones por rol</h3>
<table style="border-collapse:collapse;width:100%;border:1px solid #E2E8F0;border-radius:8px">${roles}</table>
<h3 style="color:#0F172A;margin-top:20px;margin-bottom:8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em">Preguntas previas</h3>
<ol style="padding-left:20px;line-height:1.8">${questions}</ol>
${invitation.contextSummary ? `<p style="margin-top:16px;padding:12px;background:#F8FAFC;border-radius:8px;color:#64748B;font-size:13px">${invitation.contextSummary}</p>` : ""}
${intakeBlock}
${invitation.suggestedDuration ? `<p style="margin-top:12px;color:#64748B;font-size:13px">Duración sugerida: <strong>${invitation.suggestedDuration} minutos</strong></p>` : ""}
</div>`;
	};

	const handleCopy = async (format: "plain" | "whatsapp" | "email") => {
		if (!invitation) return;
		try {
			if (format === "email") {
				const html = formatEmailHtml();
				const blob = new Blob([html], { type: "text/html" });
				const plainBlob = new Blob([formatPlainText()], { type: "text/plain" });
				await navigator.clipboard.write([
					new ClipboardItem({
						"text/html": blob,
						"text/plain": plainBlob,
					}),
				]);
			} else {
				const text = format === "whatsapp" ? formatWhatsApp() : formatPlainText();
				await navigator.clipboard.writeText(text);
			}
			setCopied(format);
			const labels = { plain: "Texto plano", whatsapp: "WhatsApp", email: "Email" };
			toast.success(`Copiado formato ${labels[format]}`);
			setTimeout(() => setCopied(null), 2000);
		} catch {
			toast.error("No se pudo copiar");
		}
	};

	// Confirmation state after session creation
	if (createdSessionId) {
		const intakeUrl = intakeToken
			? `${window.location.origin}/intake/${intakeToken}`
			: null;

		return (
			<div className="flex h-full flex-col items-center justify-center text-center">
				<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
					<PartyPopperIcon className="h-8 w-8 text-success" />
				</div>

				<h2 className="mb-2 text-2xl font-semibold text-chrome-text">
					Sesion creada
				</h2>
				<p className="mb-8 max-w-sm text-sm text-chrome-text-muted">
					Tu sesion ha sido programada exitosamente. Comparte el link de intake con
					los participantes para que se preparen antes de la reunion.
				</p>

				{intakeUrl && (
					<div className="mb-6 w-full max-w-md">
						<label className="mb-2 block text-xs font-medium text-chrome-text-secondary">
							Link de Intake
						</label>
						<div className="flex items-center gap-2 rounded-lg border border-chrome-border bg-chrome-raised p-1">
							<span className="flex-1 truncate px-3 text-sm text-chrome-text">
								{intakeUrl}
							</span>
							<button
								type="button"
								onClick={async () => {
									await navigator.clipboard.writeText(intakeUrl);
									toast.success("Link copiado");
								}}
								className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-action-hover"
							>
								<CopyIcon className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}

				<button
					type="button"
					onClick={onGoToCommandCenter}
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-action-hover"
				>
					<ExternalLinkIcon className="h-4 w-4" />
					Ir al Centro de Comando
				</button>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<h2 className="mb-1 text-xl font-semibold text-chrome-text">Invitacion</h2>
			<p className="mb-6 text-sm text-chrome-text-muted">
				Genera una invitacion inteligente con instrucciones personalizadas para cada
				participante.
			</p>

			{/* Generate button or loading state */}
			{!invitation && !generating && (
				<div className="flex flex-1 flex-col items-center justify-center">
					<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
						<SparklesIcon className="h-7 w-7 text-primary" />
					</div>
					<p className="mb-6 max-w-xs text-center text-sm text-chrome-text-muted">
						La IA generará una invitación con instrucciones por rol, preguntas
						previas y un resumen del contexto.
					</p>
					<button
						type="button"
						onClick={handleGenerate}
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-action-hover"
					>
						<SparklesIcon className="h-4 w-4" />
						Generar Invitación
					</button>
				</div>
			)}

			{/* Generating animation */}
			{!invitation && generating && (
				<div className="flex flex-1 flex-col items-center justify-center">
					<style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
					<div className="flex items-center gap-1.5 mb-4">
						<div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
						<div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
						<div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
					</div>
					<p className="text-sm font-medium text-chrome-text">Generando invitación inteligente</p>
					<p className="mt-1 mb-4 max-w-xs text-center text-xs text-chrome-text-muted">
						Creando instrucciones por rol, preguntas de preparación y resumen de contexto...
					</p>
					<div className="h-1 w-48 overflow-hidden rounded-full bg-chrome-raised">
						<div className="h-full animate-[shimmer_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" style={{ width: "200%", marginLeft: "-50%" }} />
					</div>
				</div>
			)}

			{/* Invitation preview */}
			{invitation && (
				<div className="flex-1 space-y-4 overflow-y-auto">
					{/* Title + Intro */}
					<div className="rounded-lg border border-chrome-border bg-chrome-raised p-4">
						<h3 className="mb-2 text-lg font-semibold text-chrome-text">
							{invitation.title}
						</h3>
						<p className="text-sm leading-relaxed text-chrome-text-secondary">{invitation.intro}</p>
					</div>

					{/* Role instructions */}
					{Object.entries(invitation.roleInstructions).length > 0 && (
						<div className="rounded-lg border border-chrome-border bg-chrome-raised p-4">
							<h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-chrome-text-muted">
								Instrucciones por rol
							</h4>
							<div className="space-y-3">
								{Object.entries(invitation.roleInstructions).map(
									([role, instruction]) => (
										<div key={role}>
											<span className="text-sm font-medium text-chrome-text">{role}</span>
											<p className="mt-0.5 text-sm text-chrome-text-secondary">{instruction}</p>
										</div>
									),
								)}
							</div>
						</div>
					)}

					{/* Intake questions */}
					{invitation.intakeQuestions.length > 0 && (
						<div className="rounded-lg border border-chrome-border bg-chrome-raised p-4">
							<h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-chrome-text-muted">
								Preguntas previas
							</h4>
							<ol className="space-y-2">
								{invitation.intakeQuestions.map((q, i) => (
									<li key={i} className="flex gap-2 text-sm text-chrome-text-secondary">
										<span className="shrink-0 font-medium text-chrome-text">
											{i + 1}.
										</span>
										{q}
									</li>
								))}
							</ol>
						</div>
					)}

					{/* Context summary */}
					{invitation.contextSummary && (
						<div className="rounded-lg border border-chrome-border bg-chrome-raised p-4">
							<h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-chrome-text-muted">
								Resumen de contexto
							</h4>
							<p className="text-sm leading-relaxed text-chrome-text-secondary">
								{invitation.contextSummary}
							</p>
						</div>
					)}

					{/* Duration suggestion */}
					{invitation.suggestedDuration && (
						<p className="text-xs text-chrome-text-muted">
							Duracion sugerida por IA:{" "}
							<span className="font-medium text-chrome-text-secondary">
								{invitation.suggestedDuration} minutos
							</span>
						</p>
					)}

					{/* Copy buttons — 3 formats */}
					<div className="pt-2">
						{rawIntakeUrl && (
							<label className="mb-3 flex cursor-pointer items-center gap-2">
								<input
									type="checkbox"
									checked={includeIntakeLink}
									onChange={(e) => setIncludeIntakeLink(e.target.checked)}
									className="h-4 w-4 rounded border-chrome-border bg-chrome-raised text-primary focus:ring-primary focus:ring-offset-0"
								/>
								<span className="text-xs text-chrome-text-secondary">Incluir link del formulario de preparación</span>
							</label>
						)}
						<p className="mb-2 text-xs font-medium text-chrome-text-muted">Copiar invitación</p>
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => handleCopy("plain")}
								className="inline-flex items-center gap-1.5 rounded-lg border border-chrome-border px-3 py-2 text-sm font-medium text-chrome-text-secondary transition-colors hover:border-chrome-text-muted hover:text-chrome-text"
							>
								{copied === "plain" ? <CheckIcon className="h-3.5 w-3.5 text-success" /> : <CopyIcon className="h-3.5 w-3.5" />}
								Texto plano
							</button>
							<button
								type="button"
								onClick={() => handleCopy("email")}
								className="inline-flex items-center gap-1.5 rounded-lg border border-chrome-border px-3 py-2 text-sm font-medium text-chrome-text-secondary transition-colors hover:border-chrome-text-muted hover:text-chrome-text"
							>
								{copied === "email" ? <CheckIcon className="h-3.5 w-3.5 text-success" /> : <MailIcon className="h-3.5 w-3.5" />}
								Email
							</button>
							<button
								type="button"
								onClick={() => handleCopy("whatsapp")}
								className="inline-flex items-center gap-1.5 rounded-lg border border-chrome-border px-3 py-2 text-sm font-medium text-chrome-text-secondary transition-colors hover:border-chrome-text-muted hover:text-chrome-text"
							>
								{copied === "whatsapp" ? <CheckIcon className="h-3.5 w-3.5 text-success" /> : <MessageCircleIcon className="h-3.5 w-3.5" />}
								WhatsApp
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
