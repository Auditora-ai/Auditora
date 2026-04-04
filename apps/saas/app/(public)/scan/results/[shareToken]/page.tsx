/**
 * Shared Scan Results Page
 *
 * Server component that looks up an AnonymousSession by shareToken,
 * validates expiry, and renders the scan analysis results.
 *
 * Route: /scan/results/[shareToken]
 */

import { db } from "@repo/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ScanAnalysis } from "@scan/lib/types";

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
	params,
}: {
	params: Promise<{ shareToken: string }>;
}): Promise<Metadata> {
	const { shareToken } = await params;

	const session = await db.anonymousSession.findUnique({
		where: { shareToken },
		select: { riskResults: true },
	});

	const analysis = session?.riskResults as unknown as ScanAnalysis | null;

	return {
		title: analysis
			? `${analysis.companyName} — Operational Risk Scan | Auditora`
			: "Scan Results | Auditora",
		description: analysis?.summary?.slice(0, 160) || "Operational risk analysis results",
	};
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function riskLevelColor(level: string): string {
	switch (level) {
		case "critical":
			return "bg-red-100 text-red-800 border-red-200";
		case "high":
			return "bg-amber-100 text-amber-800 border-amber-200";
		case "medium":
			return "bg-sky-100 text-sky-800 border-sky-200";
		case "low":
			return "bg-green-100 text-green-800 border-green-200";
		default:
			return "bg-gray-100 text-gray-800 border-gray-200";
	}
}

function severityColor(severity: number): string {
	if (severity >= 8) return "text-red-600";
	if (severity >= 5) return "text-amber-600";
	return "text-green-600";
}

function scoreGradient(score: number): string {
	if (score >= 75) return "from-red-500 to-red-600";
	if (score >= 50) return "from-amber-500 to-amber-600";
	if (score >= 25) return "from-sky-500 to-sky-600";
	return "from-green-500 to-green-600";
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function SharedScanResultsPage({
	params,
}: {
	params: Promise<{ shareToken: string }>;
}) {
	const { shareToken } = await params;

	const session = await db.anonymousSession.findUnique({
		where: { shareToken },
		select: {
			id: true,
			sourceUrl: true,
			riskResults: true,
			shareExpiresAt: true,
			createdAt: true,
		},
	});

	// Not found or no results
	if (!session || !session.riskResults) {
		notFound();
	}

	// Expired
	if (session.shareExpiresAt && session.shareExpiresAt < new Date()) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center px-6">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
						Enlace Expirado
					</h1>
					<p className="text-muted-foreground">
						Este enlace ha expirado. Los resultados del escaneo están disponibles por 7 días.
					</p>
				</div>
			</div>
		);
	}

	const analysis = session.riskResults as unknown as ScanAnalysis;

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-2 mb-1">
					<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Escaneo de Riesgo Operativo
					</span>
					</div>
					<h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
						{analysis.companyName}
					</h1>
					<p className="text-muted-foreground mt-1">
						{analysis.industry}
						{session.sourceUrl && (
							<>
								{" — "}
								<span className="text-xs">{session.sourceUrl}</span>
							</>
						)}
					</p>
				</div>

				{/* Vulnerability Score */}
				<div className="mb-8 p-6 border border-border rounded-lg">
					<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-medium text-foreground">
						Puntuación de Vulnerabilidad
					</h2>
						<span
							className={`text-3xl font-bold bg-gradient-to-r ${scoreGradient(analysis.vulnerabilityScore)} bg-clip-text text-transparent`}
						>
							{analysis.vulnerabilityScore}/100
						</span>
					</div>
					<div className="w-full bg-muted rounded-full h-3">
						<div
							className={`h-3 rounded-full bg-gradient-to-r ${scoreGradient(analysis.vulnerabilityScore)} transition-all`}
							style={{ width: `${analysis.vulnerabilityScore}%` }}
						/>
					</div>
				</div>

				{/* Executive Summary */}
				<div className="mb-8 p-6 bg-muted/50 border border-border rounded-lg">
				<h2 className="text-lg font-medium text-foreground mb-2">
					Resumen Ejecutivo
				</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">
						{analysis.summary}
					</p>
				</div>

				{/* Business Processes */}
				<div className="mb-8">
				<h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
					Procesos Críticos de Negocio
				</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{analysis.processes.map((process, idx) => (
							<div
								key={idx}
								className="border border-border rounded-md p-4"
							>
								<div className="flex items-start justify-between mb-2">
									<h3 className="font-medium text-foreground text-sm">
										{process.name}
									</h3>
									<span
										className={`text-xs px-2 py-0.5 rounded-full border ${riskLevelColor(process.riskLevel)}`}
									>
										{process.riskLevel}
									</span>
								</div>
								<p className="text-xs text-muted-foreground">
									{process.description}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* Highest Risk Process Detail */}
				{analysis.highestRiskProcess && (
					<div className="mb-8">
					<h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
						Mayor Riesgo: {analysis.highestRiskProcess.name}
					</h2>
						<div className="space-y-3">
							{analysis.highestRiskProcess.risks.map((risk, idx) => (
								<div
									key={idx}
									className="border border-border rounded-md p-4 border-l-4"
									style={{
										borderLeftColor:
											risk.severity >= 8
												? "#DC2626"
												: risk.severity >= 5
													? "#D97706"
													: "#16A34A",
									}}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h3 className="font-medium text-foreground text-sm">
												{risk.title}
											</h3>
											<p className="text-xs text-muted-foreground mt-1">
												{risk.description}
											</p>
										</div>
										<div className="ml-4 text-center">
											<span
												className={`text-lg font-bold tabular-nums ${severityColor(risk.severity)}`}
											>
												{risk.severity}
											</span>
											<div className="text-xs text-muted-foreground">
												/10
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

			{/* Disclaimer */}
			<div className="p-5 bg-muted/30 border border-border rounded-lg">
				<p className="text-xs text-muted-foreground leading-relaxed">
					Este es un análisis superficial basado en información pública.
					Para una evaluación completa que incluya procesos internos, matrices
					de riesgo detalladas y recomendaciones accionables, crea un diagnóstico completo.
				</p>
			</div>

			{/* CTA to register */}
			<div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center space-y-4">
				<h2 className="text-xl font-semibold text-foreground">
					¿Quieres el diagnóstico completo?
				</h2>
				<p className="text-sm text-muted-foreground max-w-md mx-auto">
					Regístrate gratis y accede a entrevistas guiadas por IA, diagramas BPMN
					y evaluaciones de tu equipo basadas en tus procesos reales.
				</p>
				<div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center pt-2">
					<a
						href="/signup"
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 min-h-[44px]"
					>
						Regístrate gratis
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
					</a>
					<a
						href="/scan"
						className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-[44px]"
					>
						Escanear otro sitio
					</a>
				</div>
			</div>

			{/* Footer */}
			<div className="text-center text-xs text-muted-foreground pt-8 border-t border-border space-y-1">
			<p>
				Generado el{" "}
				{session.createdAt.toLocaleDateString("es-MX", {
					year: "numeric",
					month: "long",
					day: "numeric",
					})}
				</p>
				<p>Powered by Auditora.ai</p>
			</div>
			</div>
		</div>
	);
}
