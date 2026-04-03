import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { ProcessWorkspace } from "@process-library/components/ProcessWorkspace";
import { fetchProcessEvalFeedback } from "@evaluaciones/lib/process-eval-feedback";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { processId } = await params;
	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		select: { name: true },
	});
	return { title: process?.name ?? "Process" };
}

export default async function ProcessDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { organizationSlug, processId } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		include: {
			architecture: { select: { organizationId: true } },
			parent: { select: { id: true, name: true, level: true } },
			children: {
				select: { id: true, name: true, level: true, processStatus: true, description: true },
				orderBy: { priority: "asc" },
			},
			sessions: {
				select: {
					id: true,
					type: true,
					status: true,
					createdAt: true,
					endedAt: true,
					_count: { select: { diagramNodes: true } },
					sessionDeliverables: {
						select: { type: true, status: true, data: true },
						where: { status: "completed" },
					},
				},
				orderBy: { createdAt: "desc" },
				take: 10,
			},
			versions: {
				select: { id: true, version: true, changeNote: true, createdBy: true, createdAt: true, bpmnXml: true },
				orderBy: { version: "desc" },
				take: 20,
			},
			// Full RACI entries for per-node health badges
			raciEntries: {
				select: { activityName: true, role: true, assignment: true },
			},
			intelligence: {
				select: { id: true },
			},
			_count: {
				select: { sessions: true, versions: true, raciEntries: true, conflicts: true, risks: true },
			},
		},
	});

	if (!process) return notFound();
	if (process.architecture.organizationId !== activeOrganization.id) return notFound();

	// Fetch evaluation feedback for this process (shows failure rates on BPMN nodes)
	const evalFeedbackRaw = await fetchProcessEvalFeedback(process.id);

	return (
		<ProcessWorkspace
			process={{
				id: process.id,
				name: process.name,
				description: process.description,
				level: process.level,
				processStatus: process.processStatus,
				category: process.category,
				owner: process.owner,
				goals: process.goals,
				triggers: process.triggers,
				outputs: process.outputs,
				bpmnXml: process.bpmnXml,
				parent: process.parent,
				children: process.children.map((c) => ({
					...c,
					description: c.description ?? null,
				})),
				sessions: process.sessions.map((s) => ({
					id: s.id,
					type: s.type,
					status: s.status,
					createdAt: s.createdAt.toISOString(),
					endedAt: s.endedAt?.toISOString() ?? null,
					_count: s._count,
					deliverables: s.sessionDeliverables.map((d: any) => ({
						type: d.type,
						status: d.status,
						data: d.data,
					})),
				})),
				versions: process.versions.map((v) => ({
					...v,
					createdAt: v.createdAt.toISOString(),
				})),
			raciEntries: process.raciEntries.map((r) => ({
				activityName: r.activityName,
				role: r.role,
				assignment: r.assignment,
			})),
			evalFeedback: evalFeedbackRaw.hasData
				? {
						hasData: true,
						totalRuns: evalFeedbackRaw.totalRuns,
						avgOverallScore: evalFeedbackRaw.avgOverallScore,
						steps: evalFeedbackRaw.steps,
						stepFailureMap: evalFeedbackRaw.stepFailureMap,
				  }
				: undefined,
			sessionsCount: process._count.sessions,
				versionsCount: process._count.versions,
				raciCount: process._count.raciEntries,
				risksCount: process._count.risks,
				hasIntelligence: !!process.intelligence,
				conflictsCount: process._count.conflicts,
			}}
			organizationSlug={organizationSlug}
			basePath={`/${organizationSlug}`}
		/>
	);
}
