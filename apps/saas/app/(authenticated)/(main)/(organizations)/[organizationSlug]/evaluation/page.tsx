import { getActiveOrganization } from "@auth/lib/server";
import { notFound } from "next/navigation";
import { fetchHumanRiskDashboardData } from "@evaluaciones/lib/dashboard-queries";
import { HumanRiskDashboard } from "@evaluaciones/components/HumanRiskDashboard";

export async function generateMetadata() {
	return { title: "Evaluación — Dashboard de Riesgo Humano" };
}

export default async function EvaluationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const data = await fetchHumanRiskDashboardData(activeOrganization.id);

	return (
		<div className="p-6">
			<HumanRiskDashboard
				data={data}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
