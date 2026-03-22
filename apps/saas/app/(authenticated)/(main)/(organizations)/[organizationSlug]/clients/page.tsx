import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { db } from "@repo/database";
import {
	Building2Icon,
	PlusIcon,
	ClockIcon,
	FolderIcon,
	FileTextIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	return { title: "Clients" };
}

export default async function ClientsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("clients");

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const clients = await db.client.findMany({
		where: { organizationId: activeOrganization.id },
		include: {
			_count: {
				select: { projects: true, documents: true },
			},
		},
		orderBy: { createdAt: "desc" },
		take: 50,
	});

	return (
		<div>
			<div className="flex items-center justify-between">
				<PageHeader title={t("title")} />
				<Button asChild>
					<Link href={`/${organizationSlug}/clients/new`}>
						<PlusIcon className="mr-2 h-4 w-4" />
						{t("newClient")}
					</Link>
				</Button>
			</div>

			<div className="mt-6">
				{clients.length === 0 ? (
					<Card>
						<div className="flex flex-col items-center justify-center p-12 text-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<Building2Icon className="h-6 w-6 text-primary" />
							</div>
							<h3 className="text-lg font-semibold text-foreground">
								{t("title")}
							</h3>
							<p className="mt-2 max-w-sm text-sm text-muted-foreground">
								{t("emptyState")}
							</p>
							<Button asChild className="mt-6">
								<Link href={`/${organizationSlug}/clients/new`}>
									<PlusIcon className="mr-2 h-4 w-4" />
									{t("newClient")}
								</Link>
							</Button>
						</div>
					</Card>
				) : (
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>{t("industry")}</TableHead>
									<TableHead>{t("projects")}</TableHead>
									<TableHead>{t("documents")}</TableHead>
									<TableHead>Created</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{clients.map((client) => (
									<TableRow key={client.id}>
										<TableCell>
											<Link
												href={`/${organizationSlug}/clients/${client.id}`}
												className="font-medium text-foreground hover:underline"
											>
												{client.name}
											</Link>
										</TableCell>
										<TableCell>
											{client.industry ? (
												<Badge status="info">
													{client.industry}
												</Badge>
											) : (
												<span className="text-muted-foreground">
													--
												</span>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1 text-muted-foreground">
												<FolderIcon className="h-3 w-3" />
												<span className="tabular-nums">
													{client._count.projects}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1 text-muted-foreground">
												<FileTextIcon className="h-3 w-3" />
												<span className="tabular-nums">
													{client._count.documents}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground">
											<div className="flex items-center gap-1">
												<ClockIcon className="h-3 w-3" />
												{new Date(
													client.createdAt,
												).toLocaleDateString()}
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>
				)}
			</div>
		</div>
	);
}
