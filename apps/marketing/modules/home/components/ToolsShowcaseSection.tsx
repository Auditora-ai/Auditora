"use client";

import { LocaleLink } from "@i18n/routing";
import { Button } from "@repo/ui/components/button";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	ArrowRightIcon,
	BookOpenIcon,
	CalculatorIcon,
	FileTextIcon,
	GaugeIcon,
	GitBranchIcon,
	Grid3X3Icon,
	ShieldCheckIcon,
	SparklesIcon,
	TableIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const TOOLS_PREVIEW: {
	slug: string;
	icon: LucideIcon;
	nameKey: string;
	nameKeyEs: string;
	color: string;
	hoverColor: string;
	iconColor: string;
}[] = [
	{
		slug: "bpmn-generator",
		icon: GitBranchIcon,
		nameKey: "BPMN Generator",
		nameKeyEs: "Generador BPMN",
		color: "bg-blue-50 dark:bg-blue-950/40",
		hoverColor: "group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50",
		iconColor: "text-blue-600 dark:text-blue-400",
	},
	{
		slug: "sipoc-generator",
		icon: TableIcon,
		nameKey: "SIPOC Generator",
		nameKeyEs: "Generador SIPOC",
		color: "bg-purple-50 dark:bg-purple-950/40",
		hoverColor: "group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50",
		iconColor: "text-purple-600 dark:text-purple-400",
	},
	{
		slug: "raci-generator",
		icon: Grid3X3Icon,
		nameKey: "RACI Generator",
		nameKeyEs: "Generador RACI",
		color: "bg-teal-50 dark:bg-teal-950/40",
		hoverColor: "group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50",
		iconColor: "text-teal-600 dark:text-teal-400",
	},
	{
		slug: "process-audit",
		icon: ShieldCheckIcon,
		nameKey: "Process Health Check",
		nameKeyEs: "Auditoria de Procesos",
		color: "bg-green-50 dark:bg-green-950/40",
		hoverColor: "group-hover:bg-green-100 dark:group-hover:bg-green-900/50",
		iconColor: "text-green-600 dark:text-green-400",
	},
	{
		slug: "meeting-to-process",
		icon: FileTextIcon,
		nameKey: "Meeting to Process",
		nameKeyEs: "Minutas a Proceso",
		color: "bg-amber-50 dark:bg-amber-950/40",
		hoverColor: "group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50",
		iconColor: "text-amber-600 dark:text-amber-400",
	},
	{
		slug: "process-complexity",
		icon: GaugeIcon,
		nameKey: "Complexity Score",
		nameKeyEs: "Score de Complejidad",
		color: "bg-rose-50 dark:bg-rose-950/40",
		hoverColor: "group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50",
		iconColor: "text-rose-600 dark:text-rose-400",
	},
	{
		slug: "bpmn-to-text",
		icon: BookOpenIcon,
		nameKey: "BPMN to Text",
		nameKeyEs: "BPMN a Texto",
		color: "bg-indigo-50 dark:bg-indigo-950/40",
		hoverColor: "group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50",
		iconColor: "text-indigo-600 dark:text-indigo-400",
	},
	{
		slug: "roi-calculator",
		icon: CalculatorIcon,
		nameKey: "ROI Calculator",
		nameKeyEs: "Calculadora ROI",
		color: "bg-emerald-50 dark:bg-emerald-950/40",
		hoverColor:
			"group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50",
		iconColor: "text-emerald-600 dark:text-emerald-400",
	},
];

export function ToolsShowcaseSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});

			// Header animation
			if (headerRef.current) {
				tl.fromTo(
					headerRef.current.children,
					{ opacity: 0, y: 20 },
					{
						opacity: 1,
						y: 0,
						stagger: 0.1,
						duration: 0.6,
						ease: "power3.out",
					},
				);
			}

			// Tool cards — stagger from center with scale
			const cards =
				sectionRef.current.querySelectorAll(".tool-card");
			if (cards.length) {
				tl.fromTo(
					cards,
					{ opacity: 0, y: 30, scale: 0.9 },
					{
						opacity: 1,
						y: 0,
						scale: 1,
						stagger: { from: "center", each: 0.06 },
						duration: 0.5,
						ease: "back.out(1.4)",
					},
					"-=0.3",
				);
			}

			// CTA button
			const cta = sectionRef.current.querySelector(".tools-cta");
			if (cta) {
				tl.fromTo(
					cta,
					{ opacity: 0, y: 15 },
					{ opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
					"-=0.2",
				);
			}
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="border-y border-border bg-muted py-16 lg:py-20">
			<div className="container">
				<div ref={headerRef} className="mb-10 text-center">
					<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
						<SparklesIcon className="h-4 w-4" />
						{t("common.footer.tools") || "Free Tools"}
					</div>
					<h2 className="font-display text-3xl font-bold text-foreground lg:text-4xl">
						{t("home.tools.title") || "Free AI Tools for BPM Professionals"}
					</h2>
					<p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
						{t("home.tools.subtitle") || "Professional-grade tools powered by AI. No signup required."}
					</p>
				</div>

				<div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
					{TOOLS_PREVIEW.map((tool) => {
						const Icon = tool.icon;
						return (
							<LocaleLink
								key={tool.slug}
								href={`/tools/${tool.slug}`}
								className="tool-card group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
							>
								<div
									className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${tool.color} ${tool.hoverColor}`}
								>
									<Icon className={`h-6 w-6 ${tool.iconColor}`} />
								</div>
								<span className="text-sm font-medium text-foreground">
									{tool.nameKey}
								</span>
							</LocaleLink>
						);
					})}
				</div>

				<div className="tools-cta mt-8 text-center">
					<Button asChild size="lg">
						<LocaleLink href="/tools" className="gap-2">
							{t("home.tools.viewAll") || "View all tools"}
							<ArrowRightIcon className="h-4 w-4" />
						</LocaleLink>
					</Button>
				</div>
			</div>
		</section>
	);
}
