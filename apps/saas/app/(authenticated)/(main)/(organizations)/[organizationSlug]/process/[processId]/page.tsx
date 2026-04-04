import { ProcessDetail } from "@process/components/ProcessDetail";
import { mockProcess } from "@process/data/mock-process";

export default async function ProcessDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { organizationSlug, processId } = await params;

	// TODO: Replace mock data with actual data fetching from Prisma
	// const process = await getProcessById(processId);
	const process = mockProcess;

	return (
		<ProcessDetail
			process={process}
			organizationSlug={organizationSlug}
		/>
	);
}
