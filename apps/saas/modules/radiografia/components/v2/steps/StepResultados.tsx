"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	ShieldAlertIcon,
	DownloadIcon,
	CheckIcon,
	ArrowRightIcon,
	Loader2Icon,
	SparklesIcon,
	SaveIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import type { IndustryInferenceResult } from "@radiografia/lib/industry-inference";
import type { SipocResult } from "@repo/ai";
import type { RiskData } from "@radiografia/lib/types";
import { RiskCard } from "../../RiskCard";

const SIPOC_COLS = ["suppliers", "inputs", "processSteps", "outputs", "customers"] as const;
const SIPOC_LABELS: Record<string, string> = {
	suppliers: "Proveedores",
	inputs: "Entradas",
	processSteps: "Proceso",
	outputs: "Salidas",
	customers: "Clientes",
};

interface StepResultadosProps {
	inferenceResult: IndustryInferenceResult | null;
	sipoc: SipocResult | null;
	risks: RiskData | null;
	companyName: string;
	mode?: "anonymous" | "authenticated";
	organizationId?: string;
	organizationSlug?: string;
}

export function StepResultados({
	inferenceResult,
	sipoc,
	risks,
	companyName,
	mode = "anonymous",
	organizationId,
	organizationSlug,
}: StepResultadosProps) {
	const t = useTranslations("scan");
	const confettiFired = useRef(false);

	// Anonymous conversion form state
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [orgName, setOrgName] = useState("");
	const [converting, setConverting] = useState(false);
	const [convertError, setConvertError] = useState<string | null>(null);
	const [existingUser, setExistingUser] = useState(false);

	// Authenticated save state
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const canConvert = email.trim().includes("@") && name.trim().length > 1;

	// Fire confetti + toast on mount
	useEffect(() => {
		if (confettiFired.current) return;
		confettiFired.current = true;

		toast.success(t("v2.completed"), {
			icon: <SparklesIcon className="size-4" />,
		});

		import("canvas-confetti").then((mod) => {
			const confetti = mod.default;
			confetti({
				particleCount: 80,
				spread: 70,
				origin: { y: 0.6 },
				colors: ["#00E5C0", "#D97706", "#3B82F6", "#16A34A"],
			});
		}).catch(() => {});
	}, [t]);

	function handleDownloadPdf() {
		window.open("/api/public/scan/report", "_blank");
	}

	// Authenticated save
	async function handleSaveToOrg() {
		if (saving || saved || !organizationId) return;
		setSaving(true);
		setConvertError(null);

		try {
			const res = await fetch("/api/scan/save", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId }),
			});

			const data = await res.json();

			if (!res.ok) {
				setConvertError(data.error || t("connectionError"));
				setSaving(false);
				return;
			}

			setSaved(true);
			setSaving(false);

			toast.success(t("v2.savedToOrg"));

			// Redirect to the new process
			if (data.redirectUrl) {
				setTimeout(() => {
					window.location.href = data.redirectUrl;
				}, 1500);
			}
		} catch {
			setConvertError(t("connectionError"));
			setSaving(false);
		}
	}

	// Anonymous conversion
	async function handleConvert() {
		if (!canConvert || converting) return;
		setConverting(true);
		setConvertError(null);

		try {
			const res = await fetch("/api/public/scan/convert", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					name: name.trim(),
					organizationName: orgName.trim() || undefined,
				}),
			});

			const data = await res.json();

			if (data.error === "existing_user") {
				setExistingUser(true);
				setConvertError(t("existingUserError"));
				setConverting(false);
				return;
			}

			if (!res.ok) {
				setConvertError(data.error || t("connectionError"));
				setConverting(false);
				return;
			}

			if (data.redirectUrl) {
				window.location.href = data.redirectUrl;
			}
		} catch {
			setConvertError(t("connectionError"));
			setConverting(false);
		}
	}

	return (
		<div className="mx-auto w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
			{/* Header */}
			<div className="space-y-1">
				<h2 className="text-2xl md:text-3xl font-display text-foreground tracking-tight">
					{t("v2.stepResultados")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("v2.resultsDesc", { company: companyName })}
				</p>
			</div>

			{/* PDF download */}
			<Button
				variant="outline"
				onClick={handleDownloadPdf}
				className="w-full gap-2 border-primary/30 hover:bg-primary/5"
			>
				<DownloadIcon className="size-4" />
				{t("v2.downloadPdf")}
			</Button>

			{/* Industry header */}
			{inferenceResult && (
				<div>
					<span className="mb-2 inline-block rounded-full border border-orientation bg-orientation-subtle px-3 py-1 text-xs font-medium text-orientation">
						{inferenceResult.industry}
					</span>
					<h3 className="text-xl md:text-2xl font-display text-foreground">
						{inferenceResult.selectedProcess.name}
					</h3>
					<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
						{inferenceResult.selectedProcess.description}
					</p>
				</div>
			)}

			{/* Risk score banner */}
			{risks && (
				<div className="overflow-hidden rounded-xl border border-chrome-border bg-chrome-base">
					<div className="flex items-stretch">
						<div className="flex flex-col items-center justify-center border-r border-chrome-border px-8 py-6 md:px-12">
							<ShieldAlertIcon className="mb-2 size-5 text-destructive" />
							<p className="font-display text-5xl md:text-6xl font-bold text-destructive">
								{risks.riskSummary.totalRiskScore}
							</p>
							<p className="mt-1 text-xs font-medium uppercase tracking-wider text-chrome-text-muted">
								{t("totalScore")}
							</p>
						</div>
						<div className="flex flex-1 flex-col justify-center gap-3 px-6 py-6">
							<div className="flex items-center gap-3">
								<span className="inline-flex size-8 items-center justify-center rounded-lg bg-destructive/20 text-sm font-bold text-destructive">
									{risks.riskSummary.criticalCount}
								</span>
								<div>
									<p className="text-sm font-semibold text-chrome-text">{t("critical")}</p>
									<p className="text-xs text-chrome-text-muted">
										{t("highestRiskArea")}: {risks.riskSummary.topRiskArea}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<span className="inline-flex size-8 items-center justify-center rounded-lg bg-orientation/20 text-sm font-bold text-orientation">
									{risks.riskSummary.highCount}
								</span>
								<p className="text-sm font-semibold text-chrome-text">{t("high")}</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* SIPOC table */}
			{sipoc && (
				<div>
					<h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						SIPOC
					</h3>
					<div className="overflow-x-auto rounded-lg border border-border">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-accent/50">
									{SIPOC_COLS.map((col) => (
										<th
											key={col}
											className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
										>
											{SIPOC_LABELS[col]}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								<tr>
									{SIPOC_COLS.map((col) => {
										const items = (sipoc as unknown as Record<string, unknown>)[col];
										const list = Array.isArray(items) ? items : [];
										return (
											<td key={col} className="px-3 py-3 align-top text-foreground/80">
												{list.length > 0 ? (
													<ul className="space-y-1">
														{list.map((item: string | { name?: string; step?: string }, j: number) => (
															<li key={j} className="text-xs leading-relaxed">
																{typeof item === "string"
																	? item
																	: (item as { name?: string; step?: string }).name ||
																		(item as { name?: string; step?: string }).step ||
																		JSON.stringify(item)}
															</li>
														))}
													</ul>
												) : (
													<span className="text-xs text-muted-foreground">—</span>
												)}
											</td>
										);
									})}
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Risk cards */}
			{risks && risks.newRisks.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						{t("v2.risksDetected", { count: risks.newRisks.length })}
					</h3>
					{risks.newRisks.map((risk, i) => (
						<RiskCard key={risk.title} risk={risk} index={i} />
					))}
				</div>
			)}

			{/* AI disclaimer */}
			<p className="text-xs leading-relaxed text-muted-foreground/70">
				{t("aiDisclaimer")}
			</p>

			{/* === AUTHENTICATED: Save to org === */}
			{mode === "authenticated" && (
				<div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
					<div className="space-y-1">
						<h3 className="text-lg font-semibold text-foreground">
							{t("v2.saveToOrg")}
						</h3>
						<p className="text-sm text-muted-foreground">
							{t("v2.saveToOrgDesc")}
						</p>
					</div>

					{convertError && (
						<p className="text-sm text-destructive">{convertError}</p>
					)}

					<Button
						onClick={handleSaveToOrg}
						disabled={saving || saved}
						className="w-full gap-2"
					>
						{saving ? (
							<>
								<Loader2Icon className="size-4 animate-spin" />
								{t("v2.savingToOrg")}
							</>
						) : saved ? (
							<>
								<CheckIcon className="size-4" />
								{t("v2.savedToOrg")}
							</>
						) : (
							<>
								<SaveIcon className="size-4" />
								{t("v2.saveToOrgButton")}
							</>
						)}
					</Button>

					{saved && organizationSlug && (
						<Button
							variant="outline"
							onClick={() => (window.location.href = `/${organizationSlug}`)}
							className="w-full gap-2"
						>
							{t("v2.goToProcesses")}
							<ArrowRightIcon className="size-4" />
						</Button>
					)}
				</div>
			)}

			{/* === ANONYMOUS: Conversion CTA === */}
			{mode === "anonymous" && (
				<div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
					<div className="space-y-1">
						<h3 className="text-lg font-semibold text-foreground">
							{t("v2.saveScan")}
						</h3>
						<p className="text-sm text-muted-foreground">
							{t("v2.saveScanDesc")}
						</p>
					</div>

					<div className="space-y-2">
						{[t("convertBullet1"), t("convertBullet2"), t("convertBullet3")].map((bullet, i) => (
							<div key={i} className="flex items-start gap-2">
								<span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20">
									<CheckIcon className="size-2.5 text-primary" />
								</span>
								<p className="text-sm text-foreground/80">{bullet}</p>
							</div>
						))}
					</div>

					<div className="space-y-3">
						<div className="space-y-1.5">
							<Label htmlFor="convert-name">{t("v2.yourName")} *</Label>
							<Input id="convert-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="convert-email">{t("v2.yourEmail")} *</Label>
							<Input id="convert-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="convert-org">{t("v2.orgName")}</Label>
							<Input id="convert-org" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={t("v2.orgNamePlaceholder")} />
						</div>

						{convertError && <p className="text-sm text-destructive">{convertError}</p>}

						{existingUser && (
							<Button variant="outline" onClick={() => (window.location.href = "/login")} className="w-full">
								{t("goToLogin")}
							</Button>
						)}

						<Button onClick={handleConvert} disabled={!canConvert || converting} className="w-full gap-2">
							{converting ? (
								<><Loader2Icon className="size-4 animate-spin" />{t("v2.creating")}</>
							) : (
								<>{t("v2.createAccount")}<ArrowRightIcon className="size-4" /></>
							)}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
