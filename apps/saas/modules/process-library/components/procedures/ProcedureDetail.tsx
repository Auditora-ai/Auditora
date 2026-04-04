"use client";

import { cn } from "@repo/ui";
import { ArrowLeftIcon, ShieldAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProcedureStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

interface ProcedureStep {
	action: string;
	description?: string;
	responsibleRole?: string;
	systems?: string[];
	inputs?: string[];
	outputs?: string[];
	controls?: string[];
	exceptions?: string[];
	estimatedDuration?: string;
}

interface LinkedRisk {
	id: string;
	title: string;
	riskType: string;
	severity: number;
	probability: number;
	riskScore: number;
}

interface ProcedureData {
	id: string;
	title: string;
	version: number;
	status: ProcedureStatus;
	objective: string | null;
	scope: string | null;
	responsible: string | null;
	frequency: string | null;
	prerequisites: unknown;
	steps: unknown;
	indicators: unknown;
	processDefinition: { name: string; level: string };
	linkedRisks: LinkedRisk[];
}

interface ProcedureDetailProps {
	procedure: ProcedureData;
	organizationSlug: string;
}

const statusConfig: Record<ProcedureStatus, { label: string; color: string; next?: { status: ProcedureStatus; label: string } }> = {
	DRAFT: { label: "Borrador", color: "bg-slate-500/20 text-slate-400", next: { status: "IN_REVIEW", label: "Enviar a Revisión" } },
	IN_REVIEW: { label: "En revisión", color: "bg-amber-500/20 text-amber-400", next: { status: "APPROVED", label: "Aprobar" } },
	APPROVED: { label: "Aprobado", color: "bg-blue-500/20 text-blue-400", next: { status: "PUBLISHED", label: "Publicar" } },
	PUBLISHED: { label: "Publicado", color: "bg-emerald-500/20 text-emerald-400" },
	ARCHIVED: { label: "Archivado", color: "bg-slate-500/20 text-slate-500" },
};

const riskTypeLabels: Record<string, string> = {
	OPERATIONAL: "Operacional",
	COMPLIANCE: "Cumplimiento",
	STRATEGIC: "Estratégico",
	FINANCIAL: "Financiero",
	TECHNOLOGY: "Tecnología",
	HUMAN_RESOURCE: "RRHH",
	REPUTATIONAL: "Reputacional",
};

export function ProcedureDetail({ procedure, organizationSlug }: ProcedureDetailProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"estructura" | "riesgos">("estructura");
	const [updating, setUpdating] = useState(false);
	const status = statusConfig[procedure.status];
	const steps = (procedure.steps || []) as ProcedureStep[];
	const prerequisites = (procedure.prerequisites || []) as string[];
	const indicators = (procedure.indicators || []) as string[];

	const handleStatusChange = async (newStatus: ProcedureStatus) => {
		setUpdating(true);
		try {
			await fetch(`/api/procedures/${procedure.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			router.refresh();
		} catch (e) {
			console.error(e);
		} finally {
			setUpdating(false);
		}
	};

	return (
		<div className="mx-auto max-w-4xl p-6">
			{/* Header */}
			<div className="mb-6">
				<Link
					href={`/${organizationSlug}/processes`}
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
				>
					<ArrowLeftIcon className="h-3 w-3" /> Procedimientos
				</Link>
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-foreground">{procedure.title}</h1>
						<div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
							<span>{procedure.processDefinition.name}</span>
							<span>·</span>
							<span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", status.color)}>
								{status.label}
							</span>
							<span>·</span>
							<span>v{procedure.version}</span>
							{procedure.responsible && (<><span>·</span><span>{procedure.responsible}</span></>)}
						</div>
					</div>
					{status.next && (
						<button
							onClick={() => handleStatusChange(status.next!.status)}
							disabled={updating}
							className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
						>
							{status.next.label}
						</button>
					)}
				</div>
			</div>

			{/* Tabs */}
			<div className="mb-6 flex gap-1 border-b border-border/50">
				{(["estructura", "riesgos"] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={cn(
							"px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
							activeTab === tab
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						{tab === "estructura" ? "Estructura" : `Riesgos (${procedure.linkedRisks.length})`}
					</button>
				))}
			</div>

			{/* Estructura tab */}
			{activeTab === "estructura" && (
				<div className="space-y-6">
					{procedure.objective && (
						<Section title="Objetivo">
							<p className="text-foreground">{procedure.objective}</p>
						</Section>
					)}
					{procedure.scope && (
						<Section title="Alcance">
							<p className="text-foreground">{procedure.scope}</p>
						</Section>
					)}
					{prerequisites.length > 0 && (
						<Section title="Prerrequisitos">
							<ul className="list-disc list-inside space-y-1 text-foreground">
								{prerequisites.map((p, i) => <li key={i}>{p}</li>)}
							</ul>
						</Section>
					)}
					{steps.length > 0 && (
						<Section title="Pasos">
							<div className="space-y-3">
								{steps.map((step, i) => (
									<div key={i} className="rounded-lg border border-border/50 bg-card p-4">
										<div className="flex items-start gap-3">
											<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-medium text-blue-400">
												{i + 1}
											</span>
											<div className="min-w-0">
												<p className="font-medium text-foreground">{step.action}</p>
												{step.description && <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>}
												<div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
													{step.responsibleRole && <span className="rounded bg-muted/50 px-2 py-0.5">{step.responsibleRole}</span>}
													{step.systems?.map((s) => <span key={s} className="rounded bg-muted/50 px-2 py-0.5">{s}</span>)}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</Section>
					)}
					{indicators.length > 0 && (
						<Section title="Indicadores">
							<ul className="list-disc list-inside space-y-1 text-foreground">
								{indicators.map((ind, i) => <li key={i}>{ind}</li>)}
							</ul>
						</Section>
					)}
				</div>
			)}

			{/* Riesgos tab */}
			{activeTab === "riesgos" && (
				<div className="space-y-3">
					{procedure.linkedRisks.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<ShieldAlertIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
							<p>Sin riesgos vinculados</p>
						</div>
					) : (
						procedure.linkedRisks.map((risk) => (
							<div key={risk.id} className="rounded-lg border border-border/50 bg-card p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-foreground">{risk.title}</p>
										<span className="text-xs text-muted-foreground">{riskTypeLabels[risk.riskType] || risk.riskType}</span>
									</div>
									<span className={cn(
										"text-sm font-medium",
										risk.riskScore >= 20 ? "text-red-400" : risk.riskScore >= 12 ? "text-amber-400" : "text-emerald-400",
									)}>
										{risk.riskScore}
									</span>
								</div>
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="rounded-lg border border-border/50 bg-card p-5">
			<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
			{children}
		</div>
	);
}
