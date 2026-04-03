"use client";

import { config } from "@config";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { motion, AnimatePresence } from "framer-motion";
import {
	ArrowRightIcon,
	BrainIcon,
	TargetIcon,
	ShieldAlertIcon,
	ZapIcon,
	CheckCircle2Icon,
	XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/* ─── Answer index constants ─── */
const CORRECT_ANSWER = 0; // Option A is the correct answer

/* ─── Animation variants ─── */
const sectionVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.15, delayChildren: 0.1 },
	},
};

const headerVariants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
	},
};

const cardVariants = {
	hidden: { opacity: 0, y: 40, scale: 0.97 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
	},
};

const optionVariants = {
	hidden: { opacity: 0, x: -20 },
	visible: (i: number) => ({
		opacity: 1,
		x: 0,
		transition: {
			duration: 0.45,
			delay: 0.5 + i * 0.12,
			ease: [0.22, 1, 0.36, 1] as const,
		},
	}),
	exit: {
		opacity: 0,
		x: -10,
		transition: { duration: 0.2 },
	},
};

const resultVariants = {
	hidden: { opacity: 0, y: 20, scale: 0.95 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
	},
	exit: {
		opacity: 0,
		y: -10,
		transition: { duration: 0.2 },
	},
};

/* ─── Option styling per letter ─── */
const OPTION_STYLES = [
	{
		letter: "A",
		idle: "border-l-emerald-500/60",
		hover: "hover:border-emerald-400/80 hover:shadow-emerald-500/10",
		selected: "border-emerald-400 bg-emerald-500/10 shadow-emerald-500/15",
		wrong: "border-red-400/60 bg-red-500/5",
	},
	{
		letter: "B",
		idle: "border-l-amber-500/60",
		hover: "hover:border-amber-400/80 hover:shadow-amber-500/10",
		selected: "border-amber-400 bg-amber-500/10 shadow-amber-500/15",
		wrong: "border-red-400/60 bg-red-500/5",
	},
	{
		letter: "C",
		idle: "border-l-sky-500/60",
		hover: "hover:border-sky-400/80 hover:shadow-sky-500/10",
		selected: "border-sky-400 bg-sky-500/10 shadow-sky-500/15",
		wrong: "border-red-400/60 bg-red-500/5",
	},
];

export function LiveDemo() {
	const t = useTranslations("home.liveDemo");
	const [selected, setSelected] = useState<number | null>(null);
	const isAnswered = selected !== null;
	const isCorrect = selected === CORRECT_ANSWER;

	function handleSelect(index: number) {
		if (isAnswered) return;
		setSelected(index);
	}

	function handleReset() {
		setSelected(null);
	}

	return (
		<section
			id="live-demo"
			className="relative py-20 sm:py-28 lg:py-36 bg-[#0A1428] overflow-hidden"
		>
			{/* Background ambient glows */}
			<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#3B8FE8]/[0.04] rounded-full blur-[140px] pointer-events-none" />
			<div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-blue-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

			<motion.div
				className="container max-w-4xl relative z-10"
				variants={sectionVariants}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: "-80px" }}
			>
				{/* ─── Header ─── */}
				<motion.div variants={headerVariants} className="text-center mb-14 sm:mb-18">
					<div className="inline-flex items-center gap-2 rounded-full border border-[#3B8FE8]/20 bg-[#3B8FE8]/[0.08] px-4 py-1.5 mb-6">
						<BrainIcon className="size-3.5 text-[#3B8FE8]" />
						<span className="text-xs font-semibold text-[#3B8FE8] uppercase tracking-widest">
							{t("badge")}
						</span>
					</div>
					<h2 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] text-white leading-[1.1] tracking-tight">
						{t("title")}
					</h2>
					<p className="mt-5 text-[#94A3B8] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed text-balance">
						{t("subtitle")}
					</p>
				</motion.div>

				{/* ─── Scenario Card ─── */}
				<motion.div variants={cardVariants} className="relative">
					{/* Glow behind card */}
					<div className="absolute -inset-3 bg-gradient-to-br from-[#3B8FE8]/[0.08] via-blue-500/[0.04] to-transparent rounded-3xl blur-2xl pointer-events-none" />

					<div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
						{/* Card header bar */}
						<div className="flex items-center justify-between border-b border-white/[0.06] px-6 sm:px-8 py-4">
							<div className="flex items-center gap-2.5">
								<div className="flex items-center gap-2 bg-[#3B8FE8]/[0.12] border border-[#3B8FE8]/20 rounded-full px-3.5 py-1">
									<ShieldAlertIcon className="size-3.5 text-[#3B8FE8]" />
									<span className="text-[11px] font-semibold text-[#3B8FE8] uppercase tracking-wide">
										{t("cardBadge")}
									</span>
								</div>
							</div>
							<div className="hidden sm:flex items-center gap-2 text-white/30">
								<TargetIcon className="size-3.5" />
								<span className="text-xs font-medium">
									{t("processLabel")}
								</span>
							</div>
						</div>

						<div className="px-6 sm:px-8 py-6 sm:py-8">
							{/* Scenario question */}
							<div className="relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 sm:p-6 mb-7">
								<div className="absolute top-0 left-6 w-px h-3 bg-[#3B8FE8]/50" />
								<p className="text-sm sm:text-[15px] leading-relaxed text-white/85">
									{t.rich("scenario", {
										danger: (chunks) => (
											<span className="text-red-400/90 font-semibold">{chunks}</span>
										),
										role: (chunks) => (
											<span className="text-[#3B8FE8] font-semibold">{chunks}</span>
										),
									})}
								</p>
							</div>

							{/* Options OR Result */}
							<AnimatePresence mode="wait">
								{!isAnswered ? (
									/* ─── Options ─── */
									<motion.div
										key="options"
										className="space-y-3"
										initial="hidden"
										animate="visible"
										exit="exit"
									>
										{[0, 1, 2].map((i) => {
											const style = OPTION_STYLES[i];
											return (
												<motion.button
													key={style.letter}
													custom={i}
													variants={optionVariants}
													whileHover={{ scale: 1.012, y: -1 }}
													whileTap={{ scale: 0.995 }}
													onClick={() => handleSelect(i)}
													className={cn(
														"group w-full text-left rounded-xl border border-white/[0.08] border-l-[3px] bg-white/[0.02] transition-all duration-200 cursor-pointer hover:bg-white/[0.06] hover:shadow-lg",
														style.idle,
														style.hover,
													)}
												>
													<div className="flex items-start gap-3.5 p-4 sm:p-5">
														<span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] text-xs font-bold text-white/50 group-hover:text-white/90 group-hover:bg-white/[0.12] transition-colors">
															{style.letter}
														</span>
														<span className="text-[13px] sm:text-sm leading-relaxed text-white/60 group-hover:text-white/90 transition-colors pt-1">
															{t(`option${style.letter}`)}
														</span>
													</div>
												</motion.button>
											);
										})}

										{/* Hint footer */}
										<div className="flex items-center gap-2 text-white/25 pt-2">
											<ZapIcon className="size-3.5" />
											<span className="text-xs">{t("hint")}</span>
										</div>
									</motion.div>
								) : (
									/* ─── Result ─── */
									<motion.div
										key="result"
										variants={resultVariants}
										initial="hidden"
										animate="visible"
										exit="exit"
										className="space-y-6"
									>
										{/* Selected answer recap */}
										<div
											className={cn(
												"rounded-xl border border-l-[3px] p-4 sm:p-5",
												isCorrect
													? "border-emerald-400/40 bg-emerald-500/[0.08]"
													: "border-red-400/40 bg-red-500/[0.06]",
											)}
										>
											<div className="flex items-start gap-3.5">
												{isCorrect ? (
													<CheckCircle2Icon className="size-5 text-emerald-400 flex-shrink-0 mt-0.5" />
												) : (
													<XCircleIcon className="size-5 text-red-400 flex-shrink-0 mt-0.5" />
												)}
												<div className="flex-1">
													<p className="text-sm font-semibold text-white/90 mb-1">
														{t("yourAnswer", { letter: OPTION_STYLES[selected].letter })}
													</p>
													<p className="text-[13px] text-white/60 leading-relaxed">
														{t(`option${OPTION_STYLES[selected].letter}`)}
													</p>
												</div>
											</div>
										</div>

										{/* Correct answer reveal + insight */}
										<div className="relative rounded-xl border border-[#3B8FE8]/20 bg-[#3B8FE8]/[0.06] p-5 sm:p-6">
											<div className="absolute top-0 left-6 w-8 h-[2px] bg-[#3B8FE8]/50" />
											<p className="text-sm sm:text-[15px] leading-relaxed text-white/85 mb-3">
												{t("resultExplanation")}
											</p>
											<p className="text-xs sm:text-sm text-[#3B8FE8]/80 font-medium">
												{t("resultStat")}
											</p>
										</div>

										{/* CTA Row */}
										<div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
											<Button
												size="lg"
												variant="primary"
												asChild
												className="bg-[#3B8FE8] hover:bg-[#2E7FD6] text-[#0A1428] font-semibold w-full sm:w-auto"
											>
												<a href={`${config.saasUrl}/scan`}>
													{t("cta")}
													<ArrowRightIcon className="ml-2 size-4" />
												</a>
											</Button>
											<button
												onClick={handleReset}
												className="text-sm text-white/40 hover:text-white/70 transition-colors cursor-pointer"
											>
												{t("tryAgain")}
											</button>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</section>
	);
}
