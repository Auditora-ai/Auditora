import { getOrganizationList, getSession } from "@auth/lib/server";
import { Button } from "@repo/ui";
import { Card, CardContent } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { Building2Icon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function AppStartPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const organizations = await getOrganizationList();
	const t = await getTranslations("clientSelector");

	if (organizations.length === 0) {
		// Empty state — no clients yet
		return (
			<div className="">
				<PageHeader title={t("title")} subtitle={t("subtitle")} />
				<div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
					<Building2Icon className="mb-4 size-12 text-muted-foreground/50" />
					<h3 className="text-lg font-semibold">
						{t("empty.title")}
					</h3>
					<p className="mt-2 max-w-sm text-sm text-muted-foreground">
						{t("empty.description")}
					</p>
					<Button asChild className="mt-6">
						<Link href="/new-organization">
							<PlusIcon className="mr-2 size-4" />
							{t("empty.cta")}
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	// If only one org, redirect directly
	if (organizations.length === 1) {
		redirect(`/${organizations[0].slug}`);
	}

	return (
		<div className="">
			<div className="flex items-center justify-between">
				<PageHeader title={t("title")} subtitle={t("subtitle")} />
				<Button asChild>
					<Link href="/new-organization">
						<PlusIcon className="mr-2 size-4" />
						{t("newClient")}
					</Link>
				</Button>
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{organizations.map((org) => (
					<Link key={org.id} href={`/${org.slug}`}>
						<Card className="transition-colors hover:bg-accent/50">
							<CardContent className="p-6">
								<div className="flex items-start gap-4">
									{org.logo ? (
										<img
											src={org.logo}
											alt={org.name}
											className="size-10 shrink-0 rounded-lg object-cover"
										/>
									) : (
										<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
											<Building2Icon className="size-5 text-primary" />
										</div>
									)}
									<div className="min-w-0 flex-1">
										<h3 className="truncate font-semibold">
											{org.name}
										</h3>
										<p className="mt-1 text-xs text-muted-foreground">
											{org.slug}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
