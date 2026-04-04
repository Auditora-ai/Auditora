import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui";
import { Globe, MessageSquare, Sparkles, Video, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SessionList } from "@meeting/components/SessionList";

export async function generateMetadata() {
	const t = await getTranslations("discover");
	return { title: t("title") };
}

export default async function DiscoveryPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("discover");

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const basePath = `/${organizationSlug}`;

	const channels = [
		{
			key: "scan" as const,
			icon: Globe,
			href: `${basePath}/descubrir/scan`,
			badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400",
			iconBg: "bg-green-500/10",
			iconColor: "text-green-600 dark:text-green-400",
			methodologyColor: "text-green-600 dark:text-green-400 bg-green-500/5 border-green-500/15",
		},
		{
			key: "interview" as const,
			icon: MessageSquare,
			secondaryIcon: Sparkles,
			href: `${basePath}/descubrir/interview`,
			badgeClass: "bg-primary/10 text-primary",
			iconBg: "bg-primary/10",
			iconColor: "text-primary",
			methodologyColor: "text-primary bg-primary/5 border-primary/15",
		},
		{
			key: "live" as const,
			icon: Video,
			href: `${basePath}/descubrir/new`,
			badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
			iconBg: "bg-amber-500/10",
			iconColor: "text-amber-600 dark:text-amber-400",
			methodologyColor: "text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/15",
		},
	];

	return (
		<div className="pb-24 md:pb-0">
			{/* Hero section */}
			<div className="mb-6 md:mb-10">
				<PageHeader
					title={t("title")}
					subtitle={t("subtitle")}
				/>
			</div>

			{/* Channel cards */}
			<div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
				{channels.map((channel) => {
					const Icon = channel.icon;
					const SecondaryIcon = "secondaryIcon" in channel ? channel.secondaryIcon : null;

					return (
						<Card
							key={channel.key}
							className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
						>
							<CardHeader className="pb-3 p-4 md:p-6 md:pb-3">
								<div className="flex items-start justify-between">
									<div className={`flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-2xl ${channel.iconBg}`}>
										{SecondaryIcon ? (
											<div className="relative">
												<Icon className={`h-5 w-5 ${channel.iconColor}`} />
												<SecondaryIcon className={`absolute -right-1.5 -top-1.5 h-3 w-3 ${channel.iconColor}`} />
											</div>
										) : (
											<Icon className={`h-5 w-5 ${channel.iconColor}`} />
										)}
									</div>
									<div className="flex items-center gap-1.5">
										<span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${channel.methodologyColor}`}>
											<Zap className="mr-0.5 h-2.5 w-2.5" />
											{t(`${channel.key}.methodology`)}
										</span>
										<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${channel.badgeClass}`}>
											{t(`${channel.key}.badge`)}
										</span>
									</div>
								</div>
								<CardTitle className="mt-3 md:mt-4 text-base font-semibold text-foreground">
									{t(`${channel.key}.title`)}
								</CardTitle>
							</CardHeader>

							<CardContent className="pb-3 md:pb-4 px-4 md:px-6 space-y-3">
								<p className="text-sm leading-relaxed text-muted-foreground">
									{t(`${channel.key}.description`)}
								</p>
								<p className="text-[11px] font-medium tracking-wide text-muted-foreground/60 uppercase">
									{t(`${channel.key}.output`)}
								</p>
							</CardContent>

							<CardFooter className="px-4 pb-4 md:px-6 md:pb-6">
								<Button
									asChild
									variant="outline"
									className="w-full min-h-[44px]"
								>
									<Link href={channel.href}>
										{t(`${channel.key}.cta`)}
										<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
									</Link>
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>

			{/* Past sessions */}
			<div className="mt-8 md:mt-14">
				<h2 className="mb-4 md:mb-6 text-base md:text-lg font-semibold text-foreground">
					{t("pastSessions")}
				</h2>
				<SessionList organizationSlug={organizationSlug} />
			</div>
		</div>
	);
}
