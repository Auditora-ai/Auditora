import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProcedureList } from "@process-library/components/procedures/ProcedureList";

export async function generateMetadata() {
	return { title: "Procedimientos" };
}

export default async function ProceduresPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const [procedures, processDefinitions] = await Promise.all([
		db.procedure.findMany({
			where: { organizationId: activeOrganization.id },
			include: {
				processDefinition: { select: { name: true, level: true } },
			},
			orderBy: { updatedAt: "desc" },
		}),
		db.processDefinition.findMany({
			where: {
				architecture: { organizationId: activeOrganization.id },
			},
			select: { id: true, name: true },
			orderBy: { name: "asc" },
		}),
	]);

	const processes = processDefinitions.map((p) => ({ id: p.id, name: p.name }));

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					{t("app.menu.procedures")}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Procedimientos operativos vinculados a tus procesos y riesgos.
				</p>
			</div>
			<ProcedureList
				procedures={procedures}
				processes={processes}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
