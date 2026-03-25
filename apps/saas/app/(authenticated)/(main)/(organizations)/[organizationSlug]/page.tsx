import { getActiveOrganization } from "@auth/lib/server";
import { CommandCenter, type SessionData, type ProcessData } from "@command-center/components/CommandCenter";
import type { SessionSuggestion } from "@command-center/components/SessionSuggestions";
import { db } from "@repo/database";
import { notFound } from "next/navigation";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	return { title: activeOrganization?.name };
}

/**
 * Compute session suggestions from existing process data (zero extra queries).
 * Rules:
 * - Process with bpmnXml but 0 RACI entries → suggest DEEP_DIVE for RACI
 * - Process with RACI but 0 risks → suggest risk session
 * - Process with completeness < 50% → suggest CONTINUATION
 */
function computeSuggestions(
	processes: ProcessData[],
	sessions: SessionData[],
): SessionSuggestion[] {
	const suggestions: SessionSuggestion[] = [];
	const now = new Date();

	for (const proc of processes) {
		// Skip processes that already have a scheduled session
		const hasScheduled = sessions.some(
			(s) => s.processDefinition?.id === proc.id && s.status === "SCHEDULED",
		);
		if (hasScheduled) continue;

		if (proc.bpmnXml && proc._count.raciEntries === 0) {
			suggestions.push({
				type: "raci_gap",
				processId: proc.id,
				processName: proc.name,
				message: "RACI pendiente — agenda un Deep Dive para asignar responsables",
				suggestedType: "DEEP_DIVE",
			});
		} else if (proc._count.raciEntries > 0 && proc._count.risks === 0) {
			suggestions.push({
				type: "no_risks",
				processId: proc.id,
				processName: proc.name,
				message: "Sin riesgos documentados — agenda una sesión de análisis de riesgos",
				suggestedType: "DEEP_DIVE",
			});
		}
	}

	return suggestions.slice(0, 6);
}

export default async function OrganizationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const orgId = activeOrganization.id;

	// Fetch sessions + architecture with processes in parallel
	const [sessions, architecture] = await Promise.all([
		db.meetingSession.findMany({
			where: { organizationId: orgId },
			include: {
				processDefinition: { select: { id: true, name: true } },
				participants: {
					select: { name: true, email: true, role: true, participantType: true },
				},
				_count: {
					select: { diagramNodes: true, transcriptEntries: true, intakeResponses: true },
				},
			},
			orderBy: { createdAt: "desc" },
			take: 50,
		}),
		db.processArchitecture.findUnique({
			where: { organizationId: orgId },
			select: {
				id: true,
				definitions: {
					where: { level: "PROCESS" },
					orderBy: { priority: "asc" },
					select: {
						id: true,
						name: true,
						bpmnXml: true,
						intelligence: { select: { id: true } },
						_count: {
							select: {
								sessions: true,
								children: true,
								raciEntries: true,
								risks: true,
							},
						},
					},
				},
			},
		}),
	]);

	const processes: ProcessData[] = (architecture?.definitions ?? []).map((d) => ({
		id: d.id,
		name: d.name,
		bpmnXml: d.bpmnXml,
		intelligence: d.intelligence,
		_count: d._count,
	}));

	const processCount = processes.length;
	const documentedCount = processes.filter((p) => p.bpmnXml).length;
	const coveragePercent = processCount > 0 ? Math.round((documentedCount / processCount) * 100) : 0;

	const typedSessions = sessions as unknown as SessionData[];
	const suggestions = computeSuggestions(processes, typedSessions);

	return (
		<div className="h-[calc(100vh-64px)]">
			<CommandCenter
				sessions={typedSessions}
				organizationId={orgId}
				organizationName={activeOrganization.name}
				organizationSlug={organizationSlug}
				processCount={processCount}
				coveragePercent={coveragePercent}
				processes={processes}
				suggestions={suggestions}
			/>
		</div>
	);
}
