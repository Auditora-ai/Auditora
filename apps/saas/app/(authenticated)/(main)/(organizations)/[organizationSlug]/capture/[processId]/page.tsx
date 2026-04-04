import { CaptureChat } from "@capture/components/CaptureChat";

export async function generateMetadata() {
	return { title: "Captura SIPOC" };
}

export default async function CaptureProcessPage({
	params,
	searchParams,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
	searchParams: Promise<{ name?: string; area?: string }>;
}) {
	const { organizationSlug, processId } = await params;
	const { name } = await searchParams;

	const processName = name || "Proceso sin nombre";

	return (
		<CaptureChat
			processId={processId}
			processName={processName}
			organizationSlug={organizationSlug}
		/>
	);
}
