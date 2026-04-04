import { EvaluateLauncher } from "@evaluate/components/EvaluateLauncher";
import { mockEvaluationProcess } from "@evaluate/data/mock-evaluation";

export async function generateMetadata() {
	return { title: "Evaluar — " + mockEvaluationProcess.processName };
}

export default async function EvaluateProcessPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { organizationSlug, processId } = await params;

	// TODO: Replace mock with real DB query using processId + organizationSlug
	const process = {
		...mockEvaluationProcess,
		id: processId,
	};

	return <EvaluateLauncher process={process} />;
}
