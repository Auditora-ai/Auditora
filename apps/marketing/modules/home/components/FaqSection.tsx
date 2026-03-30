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

			tl.from(".faq-word-inner", {
				y: "100%",
				stagger: 0.05,
				duration: 0.8,
				ease: "power4.out",
			});

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
			className={cn("scroll-mt-20 py-12 sm:py-16 lg:py-24 bg-white", className)}
			id="faq"
		>
			<div className="container">
				<div className="grid grid-cols-1 gap-6 md:gap-8 lg:gap-12 max-w-2xl mx-auto">
					<div className="text-center">
						<h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight text-[#0A1428]" style={{ perspective: "600px" }}>
							<SplitWords innerClassName="faq-word-inner">
								{t("faq.title")}
							</SplitWords>
						</h2>
						<p className="faq-description text-[#64748B] text-sm sm:text-lg mt-2">
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
								className="faq-item rounded-xl bg-[#F8FAFC] shadow-none border border-[#E2E8F0] px-3 sm:px-4 lg:px-6"
							>
								<AccordionTrigger className="text-left font-medium text-sm sm:text-base hover:no-underline text-[#0A1428]">
									{item.question}
								</AccordionTrigger>
								<AccordionContent className="text-[#64748B]">
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
