"use client";

import { cn } from "@repo/ui";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@repo/ui/components/accordion";
import { SplitWords } from "@shared/components/SplitWords";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

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

const itemVariants = {
	hidden: { opacity: 0, y: 16 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function FaqSection({ className }: { className?: string }) {
	const t = useTranslations();

	const items = FAQ_ITEM_KEYS.map((key) => ({
		question: t(`faq.items.${key}.question`),
		answer: t(`faq.items.${key}.answer`),
	}));

	return (
		<section
			className={cn("scroll-mt-20 py-12 sm:py-16 lg:py-24 bg-[#111827]", className)}
			id="faq"
		>
			<div className="container">
				<div className="grid grid-cols-1 gap-6 md:gap-8 lg:gap-12 max-w-2xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="text-center"
					>
						<h2
							className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight text-white"
							style={{ perspective: "600px" }}
						>
							<SplitWords innerClassName="faq-word-inner">
								{t("faq.title")}
							</SplitWords>
						</h2>
						<p className="text-[#64748B] text-sm sm:text-lg mt-2">
							{t("faq.description")}
						</p>
					</motion.div>

					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-40px" }}
					>
						<Accordion type="single" collapsible className="w-full space-y-2 text-left">
							{items.map((item, i) => (
								<motion.div key={`faq-item-${i}`} custom={i} variants={itemVariants}>
									<AccordionItem
										value={`item-${i}`}
										className={cn(
											"rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 sm:px-4 lg:px-6",
										)}
									>
										<AccordionTrigger className="text-left font-medium text-sm sm:text-base hover:no-underline text-white/90 hover:text-white transition-colors">
											{item.question}
										</AccordionTrigger>
										<AccordionContent className="text-[#94A3B8]">
											{item.answer}
										</AccordionContent>
									</AccordionItem>
								</motion.div>
							))}
						</Accordion>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
