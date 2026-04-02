"use client";

import { cn } from "@repo/ui";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@repo/ui/components/accordion";
import { SplitWords } from "@shared/components/SplitWords";
import { useScrollReveal } from "@shared/hooks/use-scroll-reveal";
import { useTranslations } from "next-intl";

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
	const { ref, inView } = useScrollReveal();

	const items = FAQ_ITEM_KEYS.map((key) => ({
		question: t(`faq.items.${key}.question`),
		answer: t(`faq.items.${key}.answer`),
	}));

	return (
		<section
			ref={ref}
			className={cn("scroll-mt-20 py-12 sm:py-16 lg:py-24 bg-white", className)}
			id="faq"
		>
			<div className="container">
				<div className="grid grid-cols-1 gap-6 md:gap-8 lg:gap-12 max-w-2xl mx-auto">
					<div className="text-center">
						<h2 className={cn("reveal-fade-up font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight text-[#0A1428]", inView && "is-visible")} style={{ perspective: "600px" }}>
							<SplitWords innerClassName="faq-word-inner">
								{t("faq.title")}
							</SplitWords>
						</h2>
						<p className={cn("reveal-fade-up delay-100 text-[#64748B] text-sm sm:text-lg mt-2", inView && "is-visible")}>
							{t("faq.description")}
						</p>
					</div>
					<Accordion
						type="single"
						collapsible
						className="stagger w-full space-y-2 text-left"
					>
						{items.map((item, i) => (
							<AccordionItem
								key={`faq-item-${i}`}
								value={`item-${i}`}
								className={cn("reveal-fade-up faq-item rounded-xl bg-[#F8FAFC] shadow-none border border-[#E2E8F0] px-3 sm:px-4 lg:px-6", inView && "is-visible")}
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
