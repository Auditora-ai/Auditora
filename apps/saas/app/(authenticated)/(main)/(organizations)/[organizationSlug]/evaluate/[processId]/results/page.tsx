import { EvaluationResults } from "@evaluate/components/EvaluationResults";
import { mockScenarios, mockResultsSummary } from "@evaluate/data/mock-evaluation";

export default async function EvaluateResultsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { organizationSlug, processId } = await params;

	return (
		<EvaluationResults
			summary={mockResultsSummary}
			scenarios={mockScenarios}
		/>
	);
}
