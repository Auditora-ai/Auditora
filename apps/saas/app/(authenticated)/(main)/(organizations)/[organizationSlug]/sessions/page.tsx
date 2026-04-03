import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui";
import { Globe, MessageSquare, Sparkles, Video, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SessionList } from "@meeting/components/SessionList";

export async function generateMetadata() {
	return { title: "Descubrir" };
}

export default async function SessionsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("discover");

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const channels = [
		{
			key: "scan" as const,
			icon: Globe,
			href: `/${organizationSlug}/descubrir/scan`,
			badgeText: t("scan.badge"),
			badgeClass: "bg-emerald-500/10 text-emerald-400",
			iconBg: "bg-emerald-500/10",
			iconColor: "text-emerald-400",
			borderHover: "hover:border-emerald-500/30",
			glowColor: "hover:shadow-emerald-500/5",
		},
		{
			key: "interview" as const,
			icon: MessageSquare,
			secondaryIcon: Sparkles,
			href: `/${organizationSlug}/descubrir/interview`,
			badgeText: t("interview.badge"),
			badgeClass: "bg-blue-500/10 text-blue-400",
			iconBg: "bg-blue-500/10",
			iconColor: "text-blue-400",
			borderHover: "hover:border-blue-500/30",
			glowColor: "hover:shadow-blue-500/5",
		},
		{
			key: "live" as const,
			icon: Video,
			href: `/${organizationSlug}/descubrir/new`,
			badgeText: t("live.badge"),
			badgeClass: "bg-amber-500/10 text-amber-400",
			iconBg: "bg-amber-500/10",
			iconColor: "text-amber-400",
			borderHover: "hover:border-amber-500/30",
			glowColor: "hover:shadow-amber-500/5",
		},
	];

	return (
		<div>
			{/* Hero section */}
			<div className="mb-6 md:mb-10">
				<PageHeader
					title={t("title")}
					subtitle={t("subtitle")}
				/>
			</div>

			{/* Channel cards — stacked on mobile, grid on larger */}
			<div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
				{channels.map((channel) => {
					const Icon = channel.icon;
					const SecondaryIcon = "secondaryIcon" in channel ? channel.secondaryIcon : null;

					return (
						<Card
							key={channel.key}
							className={`group relative overflow-hidden border-slate-800 bg-slate-900/80 transition-all duration-300 ${channel.borderHover} hover:shadow-lg active:shadow-md ${channel.glowColor}`}
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
									<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${channel.badgeClass}`}>
										{channel.badgeText}
									</span>
								</div>
								<CardTitle className="mt-3 md:mt-4 text-base font-semibold text-slate-50">
									{t(`${channel.key}.title`)}
								</CardTitle>
							</CardHeader>

							<CardContent className="pb-3 md:pb-4 px-4 md:px-6">
								<p className="text-sm leading-relaxed text-slate-400">
									{t(`${channel.key}.description`)}
								</p>
							</CardContent>

							<CardFooter className="px-4 pb-4 md:px-6 md:pb-6">
								<Button
									asChild
									variant="outline"
									className="w-full border-slate-700 text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white min-h-[44px] active:bg-slate-700"
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
				<h2 className="mb-4 md:mb-6 text-base md:text-lg font-semibold text-slate-200">
					{t("pastSessions")}
				</h2>
				<SessionList organizationSlug={organizationSlug} />
			</div>
		</div>
	);
}
