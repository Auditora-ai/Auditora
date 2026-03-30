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
	tagline: string;
	taglineEs: string;
}[] = [
	{
		slug: "bpmn-generator",
		icon: GitBranchIcon,
		nameKey: "BPMN Generator",
		nameKeyEs: "Generador BPMN",
		tagline: "Text to BPMN diagram in seconds",
		taglineEs: "Texto a diagrama BPMN en segundos",
	},
	{
		slug: "sipoc-generator",
		icon: TableIcon,
		nameKey: "SIPOC Generator",
		nameKeyEs: "Generador SIPOC",
		tagline: "Automatic SIPOC analysis with AI",
		taglineEs: "Análisis SIPOC automático con IA",
	},
	{
		slug: "raci-generator",
		icon: Grid3X3Icon,
		nameKey: "RACI Generator",
		nameKeyEs: "Generador RACI",
		tagline: "Responsibility matrix instantly",
		taglineEs: "Matriz de responsabilidades al instante",
	},
	{
		slug: "process-audit",
		icon: ShieldCheckIcon,
		nameKey: "Process Health Check",
		nameKeyEs: "Auditoría de Procesos",
		tagline: "Automated process audit",
		taglineEs: "Auditoría de procesos automatizada",
	},
	{
		slug: "meeting-to-process",
		icon: FileTextIcon,
		nameKey: "Meeting to Process",
		nameKeyEs: "Minutas a Proceso",
		tagline: "Meeting notes to documented process",
		taglineEs: "De minutas a proceso documentado",
	},
	{
		slug: "process-complexity",
		icon: GaugeIcon,
		nameKey: "Complexity Score",
		nameKeyEs: "Score de Complejidad",
		tagline: "Measure your process complexity",
		taglineEs: "Mide la complejidad de tu proceso",
	},
	{
		slug: "bpmn-to-text",
		icon: BookOpenIcon,
		nameKey: "BPMN to Text",
		nameKeyEs: "BPMN a Texto",
		tagline: "Convert diagrams to narrative",
		taglineEs: "Convierte diagramas a narrativa",
	},
	{
		slug: "roi-calculator",
		icon: CalculatorIcon,
		nameKey: "ROI Calculator",
		nameKeyEs: "Calculadora ROI",
		tagline: "Calculate automation ROI",
		taglineEs: "Calcula el retorno de automatizar",
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
			const cards = sectionRef.current.querySelectorAll(".tool-card");
			if (cards.length) {
				tl.fromTo(
					cards,
					{ opacity: 0, y: 20, scale: 0.95 },
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
		<section ref={sectionRef} className="bg-[#0A1428] py-12 sm:py-16 lg:py-20">
			<div className="container">
				<div ref={headerRef} className="mb-10 text-center">
					<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
						<SparklesIcon className="h-4 w-4" />
						{t("common.footer.tools") || "Free Tools"}
					</div>
					<h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F1F5F9] lg:text-4xl">
						{t("home.tools.title") || "Free AI Tools for BPM Professionals"}
					</h2>
					<p className="mx-auto mt-3 max-w-xl text-sm text-[#94A3B8]">
						{t("home.tools.subtitle") ||
							"The same AI that diagrams in meetings, now in your hands. No signup required."}
					</p>
				</div>

				<div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{TOOLS_PREVIEW.map((tool) => {
						const Icon = tool.icon;
						return (
							<LocaleLink
								key={tool.slug}
								href={`/tools/${tool.slug}`}
								className="tool-card group flex items-start gap-3 rounded-xl border border-[#1E293B] bg-[#111827] p-4 transition-all duration-200 hover:border-primary/50 hover:bg-[#111827]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1428]"
							>
								<Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<div className="min-w-0">
									<span className="block text-sm font-medium text-[#F1F5F9]">
										{tool.nameKey}
									</span>
									<span className="block text-xs text-[#78716C]">
										{tool.tagline}
									</span>
								</div>
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
