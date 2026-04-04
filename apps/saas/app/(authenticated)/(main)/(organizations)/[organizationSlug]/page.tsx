import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { ProcessMap } from "@home/components/ProcessMap";
import { MOCK_PROCESSES } from "@home/data/mock-processes";
import type { ProcessMapItem, ProcessCategory, ProcessStatus } from "@home/hooks/use-process-map";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	return { title: activeOrganization?.name };
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

	const architecture = await db.processArchitecture.findUnique({
		where: { organizationId: orgId },
		select: { id: true },
	});

	// Fetch all processes with their evaluation & risk data
	const rawProcesses = architecture
		? await db.processDefinition.findMany({
				where: {
					architectureId: architecture.id,
					level: "PROCESS",
				},
				select: {
					id: true,
					name: true,
					description: true,
					category: true,
					processStatus: true,
					priority: true,
					versions: { select: { id: true }, take: 1 },
					risks: {
						where: { status: { notIn: ["CLOSED", "ACCEPTED"] } },
						select: { id: true },
					},
				},
				orderBy: { priority: "asc" },
			})
		: [];

	// Map to ProcessMapItem — derive display status from actual data
	const processes: ProcessMapItem[] = rawProcesses.map((p) => {
		const hasVersions = p.versions.length > 0;
		const riskCount = p.risks.length;
		const hasRisks = riskCount > 0;

		// Determine display status based on actual process state
		let displayStatus: ProcessStatus = "DRAFT";
		const rawStatus = p.processStatus?.toUpperCase() ?? "DRAFT";

		if (
			rawStatus === "EVALUATED" ||
			(rawStatus === "VALIDATED" && hasRisks) ||
			(rawStatus === "APPROVED" && hasRisks)
		) {
			displayStatus = "EVALUATED";
		} else if (
			rawStatus === "DOCUMENTED" ||
			rawStatus === "VALIDATED" ||
			rawStatus === "APPROVED" ||
			(hasVersions && rawStatus !== "DRAFT")
		) {
			displayStatus = "DOCUMENTED";
		} else if (rawStatus === "CAPTURED" || rawStatus === "MAPPED") {
			displayStatus = "CAPTURED";
		}

		const item: ProcessMapItem = {
			id: p.id,
			name: p.name,
			description: p.description,
			category: (p.category as ProcessCategory) ?? "core",
			processStatus: displayStatus,
			priority: p.priority,
		};

		if (displayStatus === "EVALUATED") {
			item.riskCount = riskCount;
			// Placeholder alignment — in production, fetch from simulation/eval results
			item.alignmentPct = Math.max(0, Math.min(100, 100 - riskCount * 8));
		}

		return item;
	});

	const totalCount = processes.length;
	const documentedCount = processes.filter(
		(p) => p.processStatus === "DOCUMENTED" || p.processStatus === "EVALUATED",
	).length;
	const evaluatedCount = processes.filter(
		(p) => p.processStatus === "EVALUATED",
	).length;

	// If no real processes yet, use mock data for demonstration
	const useMock = totalCount === 0;
	const displayProcesses = useMock ? MOCK_PROCESSES : processes;

	const finalTotalCount = useMock ? MOCK_PROCESSES.length : totalCount;
	const finalDocumentedCount = useMock
		? MOCK_PROCESSES.filter(
				(p) => p.processStatus === "DOCUMENTED" || p.processStatus === "EVALUATED",
			).length
		: documentedCount;
	const finalEvaluatedCount = useMock
		? MOCK_PROCESSES.filter((p) => p.processStatus === "EVALUATED").length
		: evaluatedCount;

	return (
		<div className="h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] overflow-y-auto">
			<ProcessMap
				processes={displayProcesses}
				orgName={activeOrganization.name}
				industry={useMock ? "Manufactura" : "Sin clasificar"}
				totalCount={finalTotalCount}
				documentedCount={finalDocumentedCount}
				evaluatedCount={finalEvaluatedCount}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
