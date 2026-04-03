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
					<h1 className="text-2xl font-serif text-foreground mb-2">
						Link Expired
					</h1>
					<p className="text-muted-foreground">
						This shared scan link has expired. Scan results are available for 7 days after sharing.
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
							Operational Risk Scan
						</span>
					</div>
					<h1 className="text-3xl font-serif text-foreground">
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
							Vulnerability Score
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
						Executive Summary
					</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">
						{analysis.summary}
					</p>
				</div>

				{/* Business Processes */}
				<div className="mb-8">
					<h2 className="text-xl font-serif text-foreground mb-4 border-b border-border pb-2">
						Critical Business Processes
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
						<h2 className="text-xl font-serif text-foreground mb-4 border-b border-border pb-2">
							Highest Risk: {analysis.highestRiskProcess.name}
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

				{/* Footer */}
				<div className="text-center text-xs text-muted-foreground pt-8 border-t border-border space-y-1">
					<p>
						Generated on{" "}
						{session.createdAt.toLocaleDateString("en-US", {
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
