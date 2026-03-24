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
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const TOOLS_PREVIEW = [
	{
		slug: "bpmn-generator",
		icon: GitBranchIcon,
		nameKey: "BPMN Generator",
		nameKeyEs: "Generador BPMN",
	},
	{
		slug: "sipoc-generator",
		icon: TableIcon,
		nameKey: "SIPOC Generator",
		nameKeyEs: "Generador SIPOC",
	},
	{
		slug: "raci-generator",
		icon: Grid3X3Icon,
		nameKey: "RACI Generator",
		nameKeyEs: "Generador RACI",
	},
	{
		slug: "process-audit",
		icon: ShieldCheckIcon,
		nameKey: "Process Health Check",
		nameKeyEs: "Auditoria de Procesos",
	},
	{
		slug: "meeting-to-process",
		icon: FileTextIcon,
		nameKey: "Meeting to Process",
		nameKeyEs: "Minutas a Proceso",
	},
	{
		slug: "process-complexity",
		icon: GaugeIcon,
		nameKey: "Complexity Score",
		nameKeyEs: "Score de Complejidad",
	},
	{
		slug: "bpmn-to-text",
		icon: BookOpenIcon,
		nameKey: "BPMN to Text",
		nameKeyEs: "BPMN a Texto",
	},
	{
		slug: "roi-calculator",
		icon: CalculatorIcon,
		nameKey: "ROI Calculator",
		nameKeyEs: "Calculadora ROI",
	},
];

export function ToolsShowcaseSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;
			gsap.from(sectionRef.current.querySelectorAll(".tool-card"), {
				opacity: 0,
				y: 20,
				stagger: 0.08,
				duration: 0.5,
				ease: "power3.out",
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="border-y border-border bg-surface py-16">
			<div className="container">
				<div className="mb-8 text-center">
					<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
						<SparklesIcon className="h-4 w-4" />
						{t("common.footer.tools") || "Free Tools"}
					</div>
					<h2 className="font-display text-3xl font-bold text-foreground">
						{t("home.tools.title") || "Free AI Tools for BPM Professionals"}
					</h2>
				</div>

				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
					{TOOLS_PREVIEW.map((tool) => {
						const Icon = tool.icon;
						return (
							<LocaleLink
								key={tool.slug}
								href={`/tools/${tool.slug}`}
								className="tool-card group flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-all hover:border-primary/50 hover:shadow-md"
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
									<Icon className="h-5 w-5" />
								</div>
								<span className="text-xs font-medium text-foreground">
									{tool.nameKey}
								</span>
							</LocaleLink>
						);
					})}
				</div>

				<div className="mt-6 text-center">
					<Button variant="outline" asChild>
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
