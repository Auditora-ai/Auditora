import { db } from "@repo/database";
import { notFound, redirect } from "next/navigation";
import { RetryButton } from "./RetryButton";
import { ReviewPoller } from "./ReviewPoller";
import { ExportPdfButton } from "./ExportPdfButton";

export const metadata = {
	title: "Session Review — aiprocess.me",
};

// -- Type helpers for deliverable data shapes --

interface SummaryData {
	summary: string;
	actionItems: string[];
}

interface AuditGap {
	category: string;
	question: string;
	context: string;
	priority: number;
}

interface AuditContradiction {
	topic: string;
	claim1: string;
	claim2: string;
}

interface ProcessAuditData {
	completenessScore: number;
	newGaps: AuditGap[];
	contradictions?: AuditContradiction[];
}

interface RaciAssignment {
	activityName: string;
	role: string;
	assignment: "R" | "A" | "C" | "I";
}

interface RaciData {
	assignments: RaciAssignment[];
}

interface RiskItem {
	title: string;
	description: string;
	riskType: string;
	severity: number;
	probability: number;
	affectedStep?: string;
	isOpportunity: boolean;
	suggestedMitigations: string[];
}

interface RiskAuditData {
	newRisks: RiskItem[];
	riskSummary: {
		totalRiskScore: number;
		criticalCount: number;
		highCount: number;
		topRiskArea: string;
	};
}

// -- Helpers --

function formatDuration(startedAt: Date | null, endedAt: Date | null): string {
	if (!startedAt || !endedAt) return "--";
	const ms = endedAt.getTime() - startedAt.getTime();
	const mins = Math.round(ms / 60_000);
	if (mins < 60) return `${mins} min`;
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	return `${h}h ${m}m`;
}

function formatDate(date: Date | null): string {
	if (!date) return "--";
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function severityLabel(severity: number): {
	text: string;
	color: string;
	bg: string;
} {
	if (severity >= 4)
		return { text: "Critical", color: "text-red-700", bg: "bg-red-50" };
	if (severity >= 3)
		return { text: "High", color: "text-amber-700", bg: "bg-amber-50" };
	if (severity >= 2)
		return { text: "Medium", color: "text-yellow-700", bg: "bg-yellow-50" };
	return { text: "Low", color: "text-green-700", bg: "bg-green-50" };
}

function priorityBadge(priority: number): string {
	if (priority >= 4) return "bg-red-100 text-red-700";
	if (priority >= 3) return "bg-amber-100 text-amber-700";
	return "bg-slate-100 text-slate-600";
}

// -- Status Badge Component --

function DeliverableStatus({
	status,
}: {
	status: string;
}) {
	const styles: Record<string, { dot: string; text: string; label: string }> =
		{
			completed: {
				dot: "bg-green-500",
				text: "text-green-700",
				label: "Completed",
			},
			running: {
				dot: "bg-amber-500 animate-pulse",
				text: "text-amber-700",
				label: "Generating...",
			},
			pending: {
				dot: "bg-slate-300",
				text: "text-slate-500",
				label: "Pending",
			},
			failed: { dot: "bg-red-500", text: "text-red-700", label: "Failed" },
			skipped: {
				dot: "bg-slate-300",
				text: "text-slate-400",
				label: "Skipped",
			},
		};

	const s = styles[status] ?? styles.pending;

	return (
		<span className={`inline-flex items-center gap-1.5 text-xs ${s.text}`}>
			<span className={`h-2 w-2 rounded-full ${s.dot}`} />
			{s.label}
		</span>
	);
}

// -- Section Wrapper --

function Section({
	title,
	status,
	children,
}: {
	title: string;
	status: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-md border border-slate-200 bg-white">
			<div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
				<h2 className="text-lg font-semibold text-slate-900">{title}</h2>
				<DeliverableStatus status={status} />
			</div>
			<div className="px-6 py-5">{children}</div>
		</section>
	);
}

// -- Deliverable Renderers --

function SummarySection({
	status,
	data,
	error,
	sessionId,
}: {
	status: string;
	data: SummaryData | null;
	error: string | null;
	sessionId: string;
}) {
	return (
		<Section title="Executive Summary" status={status}>
			{status === "pending" || status === "running" ? (
				<div className="space-y-3">
					<div className="h-4 w-full animate-pulse rounded bg-slate-100" />
					<div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
					<div className="h-4 w-4/6 animate-pulse rounded bg-slate-100" />
				</div>
			) : status === "failed" ? (
				<div className="flex items-center justify-between">
					<p className="text-sm text-red-600">
						Failed to generate summary.{error ? ` ${error}` : ""}
					</p>
					<RetryButton sessionId={sessionId} type="summary" />
				</div>
			) : status === "skipped" ? (
				<p className="text-sm text-slate-400">
					Summary generation was skipped for this session.
				</p>
			) : data ? (
				<div className="space-y-5">
					<p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
						{data.summary}
					</p>
					{data.actionItems.length > 0 && (
						<div>
							<h3 className="mb-2 text-sm font-medium text-slate-900">
								Action Items
							</h3>
							<ul className="space-y-1.5">
								{data.actionItems.map((item, i) => (
									<li
										key={i}
										className="flex items-start gap-2 text-sm text-slate-700"
									>
										<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-200 text-xs text-slate-400">
											{i + 1}
										</span>
										{item}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			) : (
				<p className="text-sm text-slate-400">No summary data available.</p>
			)}
		</Section>
	);
}

function ProcessAuditSection({
	status,
	data,
	error,
	sessionId,
}: {
	status: string;
	data: ProcessAuditData | null;
	error: string | null;
	sessionId: string;
}) {
	return (
		<Section title="Process Audit" status={status}>
			{status === "pending" || status === "running" ? (
				<div className="space-y-3">
					<div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
					<div className="h-4 w-full animate-pulse rounded bg-slate-100" />
					<div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
				</div>
			) : status === "failed" ? (
				<div className="flex items-center justify-between">
					<p className="text-sm text-red-600">
						Failed to generate process audit.{error ? ` ${error}` : ""}
					</p>
					<RetryButton sessionId={sessionId} type="process_audit" />
				</div>
			) : status === "skipped" ? (
				<p className="text-sm text-slate-400">
					Process audit was skipped for this session.
				</p>
			) : data ? (
				<div className="space-y-6">
					{/* Completeness Score */}
					<div>
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm font-medium text-slate-700">
								Completeness Score
							</span>
							<span className="text-sm font-semibold text-slate-900">
								{data.completenessScore}%
							</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
							<div
								className={`h-full rounded-full transition-all ${
									data.completenessScore >= 80
										? "bg-green-500"
										: data.completenessScore >= 50
											? "bg-amber-500"
											: "bg-red-500"
								}`}
								style={{ width: `${data.completenessScore}%` }}
							/>
						</div>
					</div>

					{/* Knowledge Gaps */}
					{data.newGaps.length > 0 && (
						<div>
							<h3 className="mb-3 text-sm font-medium text-slate-900">
								Knowledge Gaps ({data.newGaps.length})
							</h3>
							<div className="space-y-2">
								{data.newGaps.map((gap, i) => (
									<div
										key={i}
										className="rounded border border-slate-100 bg-slate-50 px-4 py-3"
									>
										<div className="mb-1 flex items-center gap-2">
											<span
												className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge(gap.priority)}`}
											>
												P{gap.priority}
											</span>
											<span className="text-xs text-slate-500">
												{gap.category}
											</span>
										</div>
										<p className="text-sm text-slate-700">{gap.question}</p>
										{gap.context && (
											<p className="mt-1 text-xs text-slate-500">
												{gap.context}
											</p>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Contradictions */}
					{data.contradictions && data.contradictions.length > 0 && (
						<div>
							<h3 className="mb-3 text-sm font-medium text-slate-900">
								Contradictions ({data.contradictions.length})
							</h3>
							<div className="space-y-2">
								{data.contradictions.map((c, i) => (
									<div
										key={i}
										className="rounded border border-amber-100 bg-amber-50 px-4 py-3"
									>
										<p className="mb-1 text-sm font-medium text-amber-800">
											{c.topic}
										</p>
										<div className="space-y-1 text-xs text-amber-700">
											<p>
												<span className="font-medium">Claim 1:</span>{" "}
												{c.claim1}
											</p>
											<p>
												<span className="font-medium">Claim 2:</span>{" "}
												{c.claim2}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			) : (
				<p className="text-sm text-slate-400">No audit data available.</p>
			)}
		</Section>
	);
}

function RaciSection({
	status,
	data,
	error,
	sessionId,
}: {
	status: string;
	data: RaciData | null;
	error: string | null;
	sessionId: string;
}) {
	// Build matrix: rows = activities, columns = roles
	const activities: string[] = [];
	const roles: string[] = [];
	const matrix: Record<string, Record<string, string>> = {};

	if (data?.assignments) {
		for (const a of data.assignments) {
			if (!activities.includes(a.activityName)) activities.push(a.activityName);
			if (!roles.includes(a.role)) roles.push(a.role);
			if (!matrix[a.activityName]) matrix[a.activityName] = {};
			matrix[a.activityName][a.role] = a.assignment;
		}
	}

	const cellColor: Record<string, string> = {
		R: "bg-blue-100 text-blue-800 font-semibold",
		A: "bg-purple-100 text-purple-800 font-semibold",
		C: "bg-slate-100 text-slate-600",
		I: "bg-slate-50 text-slate-400",
	};

	return (
		<Section title="RACI Matrix" status={status}>
			{status === "pending" || status === "running" ? (
				<div className="space-y-3">
					<div className="h-4 w-full animate-pulse rounded bg-slate-100" />
					<div className="h-4 w-full animate-pulse rounded bg-slate-100" />
					<div className="h-4 w-full animate-pulse rounded bg-slate-100" />
				</div>
			) : status === "failed" ? (
				<div className="flex items-center justify-between">
					<p className="text-sm text-red-600">
						Failed to generate RACI matrix.{error ? ` ${error}` : ""}
					</p>
					<RetryButton sessionId={sessionId} type="raci" />
				</div>
			) : status === "skipped" ? (
				<p className="text-sm text-slate-400">
					RACI generation was skipped for this session.
				</p>
			) : data && activities.length > 0 ? (
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200">
								<th className="py-2 pr-4 text-left font-medium text-slate-600">
									Activity
								</th>
								{roles.map((role) => (
									<th
										key={role}
										className="px-3 py-2 text-center font-medium text-slate-600"
										style={{ fontVariantNumeric: "tabular-nums" }}
									>
										{role}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{activities.map((activity) => (
								<tr
									key={activity}
									className="border-b border-slate-50 last:border-0"
								>
									<td className="py-2.5 pr-4 text-slate-700">{activity}</td>
									{roles.map((role) => {
										const val = matrix[activity]?.[role];
										return (
											<td key={role} className="px-3 py-2.5 text-center">
												{val ? (
													<span
														className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs ${cellColor[val] ?? ""}`}
													>
														{val}
													</span>
												) : (
													<span className="text-slate-200">-</span>
												)}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
					<div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
						<span>
							<span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs font-semibold text-blue-800">
								R
							</span>{" "}
							Responsible
						</span>
						<span>
							<span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-xs font-semibold text-purple-800">
								A
							</span>{" "}
							Accountable
						</span>
						<span>
							<span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs text-slate-600">
								C
							</span>{" "}
							Consulted
						</span>
						<span>
							<span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-50 text-xs text-slate-400">
								I
							</span>{" "}
							Informed
						</span>
					</div>
				</div>
			) : (
				<p className="text-sm text-slate-400">
					No RACI data available. This may require swimlanes in the BPMN
					diagram.
				</p>
			)}
		</Section>
	);
}

function RiskAuditSection({
	status,
	data,
	error,
	sessionId,
}: {
	status: string;
	data: RiskAuditData | null;
	error: string | null;
	sessionId: string;
}) {
	return (
		<Section title="Risk Audit" status={status}>
			{status === "pending" || status === "running" ? (
				<div className="space-y-3">
					<div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
					<div className="h-4 w-full animate-pulse rounded bg-slate-100" />
					<div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
				</div>
			) : status === "failed" ? (
				<div className="flex items-center justify-between">
					<p className="text-sm text-red-600">
						Failed to generate risk audit.{error ? ` ${error}` : ""}
					</p>
					<RetryButton sessionId={sessionId} type="risk_audit" />
				</div>
			) : status === "skipped" ? (
				<p className="text-sm text-slate-400">
					Risk audit was skipped for this session.
				</p>
			) : data ? (
				<div className="space-y-6">
					{/* Risk Summary */}
					<div className="grid grid-cols-4 gap-4">
						<div className="rounded border border-slate-100 bg-slate-50 p-3 text-center">
							<p className="text-2xl font-semibold text-slate-900">
								{data.riskSummary.totalRiskScore}
							</p>
							<p className="text-xs text-slate-500">Risk Score</p>
						</div>
						<div className="rounded border border-red-100 bg-red-50 p-3 text-center">
							<p className="text-2xl font-semibold text-red-700">
								{data.riskSummary.criticalCount}
							</p>
							<p className="text-xs text-red-600">Critical</p>
						</div>
						<div className="rounded border border-amber-100 bg-amber-50 p-3 text-center">
							<p className="text-2xl font-semibold text-amber-700">
								{data.riskSummary.highCount}
							</p>
							<p className="text-xs text-amber-600">High</p>
						</div>
						<div className="rounded border border-slate-100 bg-slate-50 p-3 text-center">
							<p className="text-sm font-medium text-slate-700">
								{data.riskSummary.topRiskArea.replace(/_/g, " ")}
							</p>
							<p className="text-xs text-slate-500">Top Risk Area</p>
						</div>
					</div>

					{/* Risk List */}
					{data.newRisks.length > 0 && (
						<div>
							<h3 className="mb-3 text-sm font-medium text-slate-900">
								Identified Risks ({data.newRisks.length})
							</h3>
							<div className="space-y-2">
								{data.newRisks.map((risk, i) => {
									const sev = severityLabel(risk.severity);
									return (
										<div
											key={i}
											className="rounded border border-slate-100 bg-slate-50 px-4 py-3"
										>
											<div className="mb-1.5 flex items-center gap-2">
												<span
													className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sev.bg} ${sev.color}`}
												>
													{sev.text}
												</span>
												<span className="text-xs text-slate-500">
													{risk.riskType.replace(/_/g, " ")}
												</span>
												{risk.isOpportunity && (
													<span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
														Opportunity
													</span>
												)}
											</div>
											<p className="text-sm font-medium text-slate-800">
												{risk.title}
											</p>
											<p className="mt-0.5 text-sm text-slate-600">
												{risk.description}
											</p>
											{risk.affectedStep && (
												<p className="mt-1 text-xs text-slate-500">
													Affected step: {risk.affectedStep}
												</p>
											)}
											{risk.suggestedMitigations.length > 0 && (
												<div className="mt-2">
													<p className="text-xs font-medium text-slate-600">
														Mitigations:
													</p>
													<ul className="mt-1 list-inside list-disc text-xs text-slate-500">
														{risk.suggestedMitigations.map((m, j) => (
															<li key={j}>{m}</li>
														))}
													</ul>
												</div>
											)}
											<div className="mt-2 flex gap-3 text-xs text-slate-400">
												<span>Severity: {risk.severity}/5</span>
												<span>Probability: {risk.probability}/5</span>
												<span>
													RPN: {risk.severity * risk.probability}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			) : (
				<p className="text-sm text-slate-400">
					No risk audit data available.
				</p>
			)}
		</Section>
	);
}

// -- Main Page Component --

export default async function SessionReviewPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; sessionId: string }>;
}) {
	const { organizationSlug, sessionId } = await params;

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			processDefinition: true,
			organization: { select: { name: true, slug: true } },
			sessionDeliverables: true,
			_count: { select: { transcriptEntries: true } },
		},
	});

	if (!session) {
		redirect(`/${organizationSlug}/sessions`);
	}

	// Verify org membership by slug match
	if (session.organization.slug !== organizationSlug) {
		redirect(`/${organizationSlug}/sessions`);
	}

	// Build deliverable map
	const deliverableMap = new Map(
		session.sessionDeliverables.map((d) => [d.type, d]),
	);

	const summaryDel = deliverableMap.get("summary");
	const auditDel = deliverableMap.get("process_audit");
	const raciDel = deliverableMap.get("raci");
	const riskDel = deliverableMap.get("risk_audit");

	const processName =
		session.processDefinition?.name ?? "Untitled Process";
	const hasBpmnXml = !!(
		session.bpmnXml || session.processDefinition?.bpmnXml
	);

	const terminalStatuses = new Set(["completed", "failed", "skipped"]);
	const allStatuses = [summaryDel?.status, auditDel?.status, raciDel?.status, riskDel?.status];
	const hasInProgress = allStatuses.some((s) => !s || !terminalStatuses.has(s));

	return (
		<div className="min-h-screen bg-slate-50">
			<ReviewPoller hasInProgress={hasInProgress} />
			{/* Header */}
			<header className="border-b border-slate-200 bg-white">
				<div className="mx-auto max-w-5xl px-6 py-6">
					<div className="flex items-start justify-between">
						<div>
							<p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
								Session Review
							</p>
							<h1
								className="text-2xl font-semibold text-slate-900"
								style={{ fontFamily: "var(--font-instrument-serif, serif)" }}
							>
								{processName}
							</h1>
							<div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
								<span>{formatDate(session.startedAt)}</span>
								<span className="text-slate-300">|</span>
								<span>
									Duration: {formatDuration(session.startedAt, session.endedAt)}
								</span>
								<span className="text-slate-300">|</span>
								<span>
									{session._count.transcriptEntries} transcript entries
								</span>
								<span className="text-slate-300">|</span>
								<span>{session.organization.name}</span>
							</div>
						</div>

						{/* Export Buttons */}
						<div className="flex items-center gap-2">
							{hasBpmnXml && (
								<a
									href={`/api/sessions/${session.id}/export/bpmn`}
									className="inline-flex h-9 items-center gap-1.5 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
								>
									<svg
										className="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
										/>
									</svg>
									BPMN XML
								</a>
							)}
							<ExportPdfButton sessionId={sessionId} />
						</div>
					</div>
				</div>
			</header>

			{/* Deliverables */}
			<main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
				<SummarySection
					status={summaryDel?.status ?? "pending"}
					data={(summaryDel?.data as SummaryData | undefined) ?? null}
					error={summaryDel?.error ?? null}
					sessionId={sessionId}
				/>

				<ProcessAuditSection
					status={auditDel?.status ?? "pending"}
					data={(auditDel?.data as ProcessAuditData | undefined) ?? null}
					error={auditDel?.error ?? null}
					sessionId={sessionId}
				/>

				<RaciSection
					status={raciDel?.status ?? "pending"}
					data={(raciDel?.data as RaciData | undefined) ?? null}
					error={raciDel?.error ?? null}
					sessionId={sessionId}
				/>

				<RiskAuditSection
					status={riskDel?.status ?? "pending"}
					data={(riskDel?.data as RiskAuditData | undefined) ?? null}
					error={riskDel?.error ?? null}
					sessionId={sessionId}
				/>
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-200 bg-white">
				<div className="mx-auto max-w-5xl px-6 py-4">
					<div className="flex items-center justify-between text-xs text-slate-400">
						<span>
							Generated by aiprocess.me
						</span>
						<a
							href={`/${organizationSlug}/session/${sessionId}/live`}
							className="text-blue-600 hover:text-blue-700"
						>
							Back to session
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
