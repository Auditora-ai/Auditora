import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProcessLibrary } from "@process-library/components/ProcessLibrary";
import type { ProcessCardData } from "@process-library/components/ProcessCard";

export async function generateMetadata() {
	return { title: "Procesos" };
}

export default async function ProcessHubPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("processLibrary");

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const orgId = activeOrganization.id;

	const processDefinitions = await db.processDefinition.findMany({
		where: {
			architecture: { organizationId: orgId },
		},
		include: {
			_count: {
				select: { sessions: true, versions: true, risks: true },
			},
			risks: {
				where: { severity: { gte: 4 }, probability: { gte: 4 }, status: { notIn: ["CLOSED", "ACCEPTED"] } },
				select: { id: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	const processes: ProcessCardData[] = processDefinitions.map((pd) => ({
		id: pd.id,
		name: pd.name,
		description: pd.description,
		level: pd.level,
		processStatus: pd.processStatus,
		category: pd.category,
		nodesCount: 0,
		versionsCount: pd._count.versions,
		sessionsCount: pd._count.sessions,
		hasBpmn: !!pd.bpmnXml,
		riskCount: pd._count.risks,
		criticalRiskCount: pd.risks.length,
	}));

	return (
		<div>
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
			/>
			<div className="mt-6">
				<ProcessLibrary
					processes={processes}
					basePath={`/${organizationSlug}`}
					organizationId={orgId}
				/>
			</div>
		</div>
	);
}
