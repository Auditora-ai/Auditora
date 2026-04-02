import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { ProcedureWorkspace } from "@process-library/components/procedures/ProcedureWorkspace";
import type { ProcedureData } from "@process-library/components/procedures/ProcedureWorkspace";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ procedureId: string }>;
}) {
	const { procedureId } = await params;
	const procedure = await db.procedure.findUnique({
		where: { id: procedureId },
		select: { title: true },
	});
	return { title: procedure?.title ?? "Procedimiento" };
}

export default async function ProcedureDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; procedureId: string }>;
}) {
	const { organizationSlug, procedureId } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const [procedure, versions] = await Promise.all([
		db.procedure.findUnique({
			where: { id: procedureId },
			include: {
				processDefinition: { select: { name: true, level: true } },
				linkedRisks: {
					select: {
						id: true,
						title: true,
						riskType: true,
						severity: true,
						probability: true,
						riskScore: true,
					},
				},
			},
		}),
		db.procedureVersion.findMany({
			where: { procedureId },
			orderBy: { version: "desc" },
			select: {
				id: true,
				version: true,
				status: true,
				changeNote: true,
				changedBy: true,
				changedAt: true,
			},
		}),
	]);

	if (!procedure) return notFound();
	if (procedure.organizationId !== activeOrganization.id) return notFound();

	return (
		<div className="h-[calc(100vh-64px)]">
			<ProcedureWorkspace
				procedure={procedure as unknown as ProcedureData}
				versions={versions.map((v) => ({
					...v,
					changedAt: v.changedAt.toISOString(),
				}))}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
