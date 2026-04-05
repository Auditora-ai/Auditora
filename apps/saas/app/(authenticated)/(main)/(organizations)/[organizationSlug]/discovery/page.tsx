import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { DiscoveryPage } from "./discovery-page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
	return { title: "Discovery" };
}

export default async function Page({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const orgId = activeOrganization.id;
	const basePath = `/${organizationSlug}`;

	// Check if discovery has been done (company brain exists)
	const [companyBrain, architecture] = await Promise.all([
		db.companyBrain.findUnique({
			where: { organizationId: orgId },
			select: {
				id: true,
				orgContext: {
					select: {
						industrySector: true,
						companySize: true,
						mission: true,
					},
				},
				valueChainActivities: {
					select: {
						id: true,
						name: true,
						type: true,
						description: true,
					},
					orderBy: { orderIndex: "asc" },
				},
			},
		}),
		db.processArchitecture.findUnique({
			where: { organizationId: orgId },
			select: {
				id: true,
				processes: {
					where: { level: "PROCESS" },
					select: {
						id: true,
						name: true,
						category: true,
						processStatus: true,
					},
					orderBy: [{ priority: "desc" }, { name: "asc" }],
				},
			},
		}),
	]);

	const hasDiscovery = !!companyBrain;
	const processCount = architecture?.processes?.length ?? 0;

	return (
		<DiscoveryPage
			basePath={basePath}
			organizationSlug={organizationSlug}
			organizationName={activeOrganization.name}
			hasDiscovery={hasDiscovery}
			industry={companyBrain?.orgContext?.industrySector ?? null}
			companySize={companyBrain?.orgContext?.companySize ?? null}
			mission={companyBrain?.orgContext?.mission ?? null}
			valueChain={companyBrain?.valueChainActivities ?? []}
			processes={
				architecture?.processes?.map((p) => ({
					id: p.id,
					name: p.name,
					category: p.category ?? "operative",
					status: p.processStatus,
				})) ?? []
			}
			processCount={processCount}
		/>
	);
}
