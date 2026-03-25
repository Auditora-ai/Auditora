import { OrgAiConfig } from "@admin/component/OrgAiConfig";

export default async function OrgAiConfigPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <OrgAiConfig organizationId={id} />;
}
