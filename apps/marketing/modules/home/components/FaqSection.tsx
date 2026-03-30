"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "@repo/ui";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@repo/ui/components/accordion";
import { SplitWords } from "@shared/components/SplitWords";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const FAQ_ITEM_KEYS = [
	"urlLimitations",
	"vsChatgpt",
	"dataAccess",
	"bpmKnowledge",
	"deepening",
	"dataSecurity",
	"accountMigration",
	"vsProcessMining",
] as const;

export function FaqSection({ className }: { className?: string }) {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	const items = FAQ_ITEM_KEYS.map((key) => ({
		question: t(`faq.items.${key}.question`),
		answer: t(`faq.items.${key}.answer`),
	}));

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

			// Title word-reveal
			tl.from(".faq-word-inner", {
				y: "100%",
				stagger: 0.05,
				duration: 0.8,
				ease: "power4.out",
			});

			// Description fade
			tl.from(
				".faq-description",
				{
					opacity: 0,
					y: 15,
					duration: 0.5,
					ease: "power2.out",
				},
				"-=0.4",
			);

			// Accordion items stagger cascade
			tl.from(
				".faq-item",
				{
					y: 20,
					opacity: 0,
					stagger: 0.08,
					duration: 0.5,
					ease: "power2.out",
				},
				"-=0.3",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className={cn("scroll-mt-20 py-12 lg:py-16", className)}
			id="faq"
		>
			<div className="container">
				<div className="grid grid-cols-1 gap-6 md:gap-8 lg:gap-12 max-w-2xl mx-auto">
					<div className="text-center">
						<h2 className="font-display text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight text-foreground" style={{ perspective: "600px" }}>
							<SplitWords innerClassName="faq-word-inner">
								{t("faq.title")}
							</SplitWords>
						</h2>
						<p className="faq-description text-foreground/60 text-sm sm:text-lg mt-2">
							{t("faq.description")}
						</p>
					</div>
					<Accordion
						type="single"
						collapsible
						className="w-full space-y-2 text-left"
					>
						{items.map((item, i) => (
							<AccordionItem
								key={`faq-item-${i}`}
								value={`item-${i}`}
								className="faq-item rounded-lg bg-card shadow-none border px-4 lg:px-6"
							>
								<AccordionTrigger className="text-left font-medium text-base hover:no-underline">
									{item.question}
								</AccordionTrigger>
								<AccordionContent className="text-foreground/60">
									{item.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</section>
	);
}
