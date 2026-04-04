"use client";

import { config } from "@config";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { motion } from "framer-motion";
import {
	ArrowRightIcon,
	CheckCircle2Icon,
	XCircleIcon,
	AlertTriangleIcon,
	ClockIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger);
}

const CORRECT_ANSWER = 0;
const OPTION_LETTERS = ["A", "B", "C"];

/**
 * LiveDemo — scroll-triggered reveal, then interactive.
 *
 * NO pin. Just staggered reveals as user scrolls through a tall section.
 * Once options are visible, user clicks to interact.
 * Simple, reliable, works perfectly with Lenis.
 */
export function LiveDemo() {
	const t = useTranslations("home.liveDemo");
	const [selected, setSelected] = useState<number | null>(null);
	const [showResult, setShowResult] = useState(false);

	const sectionRef = useRef<HTMLElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const scenarioRef = useRef<HTMLDivElement>(null);
	const yourCallRef = useRef<HTMLDivElement>(null);
	const optionsRef = useRef<HTMLDivElement>(null);

	const isCorrect = selected === CORRECT_ANSWER;

	// ─── GSAP scroll-triggered reveals (no pin, just natural scroll) ───
	useEffect(() => {
		if (!sectionRef.current) return;

		const ctx = gsap.context(() => {
			// Header: fade up
			if (headerRef.current) {
				gsap.from(headerRef.current.children, {
					y: 40,
					opacity: 0,
					stagger: 0.12,
					duration: 0.8,
					ease: "power3.out",
					scrollTrigger: {
						trigger: headerRef.current,
						start: "top 85%",
						toggleActions: "play none none reverse",
					},
				});
			}

			// Scenario card: slide up with slight scale
			if (scenarioRef.current) {
				gsap.from(scenarioRef.current, {
					y: 60,
					opacity: 0,
					scale: 0.97,
					duration: 0.9,
					ease: "power3.out",
					scrollTrigger: {
						trigger: scenarioRef.current,
						start: "top 85%",
						toggleActions: "play none none reverse",
					},
				});
			}

			// "Your call" divider
			if (yourCallRef.current) {
				gsap.from(yourCallRef.current, {
					opacity: 0,
					scaleX: 0.5,
					duration: 0.6,
					ease: "power2.out",
					scrollTrigger: {
						trigger: yourCallRef.current,
						start: "top 88%",
						toggleActions: "play none none reverse",
					},
				});
			}

			// Options: stagger from bottom
			const optionCards = document.querySelectorAll(".ld-option");
			if (optionCards.length) {
				gsap.from(optionCards, {
					y: 50,
					opacity: 0,
					stagger: 0.12,
					duration: 0.7,
					ease: "power3.out",
					scrollTrigger: {
						trigger: optionCards[0],
						start: "top 90%",
						toggleActions: "play none none reverse",
					},
				});
			}
		}, sectionRef);

		return () => ctx.revert();
	}, []);

	// ─── Handle selection ───
	const handleSelect = useCallback(
		(index: number) => {
			if (selected !== null) return;
			setSelected(index);

			// Animate options out
			const cards = document.querySelectorAll(".ld-option");
			gsap.to(cards, {
				opacity: 0.3,
				scale: 0.98,
				duration: 0.3,
				ease: "power2.in",
			});
			// Highlight selected
			if (cards[index]) {
				gsap.to(cards[index], {
					opacity: 1,
					scale: 1.02,
					duration: 0.3,
					ease: "power2.out",
				});
			}

			// Show result after brief delay
			setTimeout(() => setShowResult(true), 400);
		},
		[selected],
	);

	const handleReset = useCallback(() => {
		setSelected(null);
		setShowResult(false);
		const cards = document.querySelectorAll(".ld-option");
		gsap.to(cards, {
			opacity: 1,
			scale: 1,
			duration: 0.3,
			ease: "power2.out",
		});
	}, []);

	return (
		<section
			ref={sectionRef}
			id="live-demo"
			className="relative py-24 sm:py-32 lg:py-40 bg-muted dark:bg-[#060B18] overflow-hidden"
		>
			{/* Ambient glow */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse 60% 50% at 50% 40%, rgba(59,143,232,0.05) 0%, transparent 70%)",
				}}
			/>

			<div className="container max-w-3xl relative z-10 px-4">
				{/* ─── HEADER ─── */}
				<div ref={headerRef} className="text-center mb-14 sm:mb-20">
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-1.5 mb-6">
						<AlertTriangleIcon className="size-3.5 text-primary" />
						<span className="text-xs font-semibold text-primary uppercase tracking-widest">
							{t("badge")}
						</span>
					</div>

					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
						{t("title")}
					</h2>

					<p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* ─── SCENARIO CARD ─── */}
				<div ref={scenarioRef}>
					<div className="relative bg-card dark:bg-white/[0.03] backdrop-blur border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/30">
						{/* Alert pulse top-right */}
						<div className="absolute top-4 right-4 sm:top-5 sm:right-5">
							<div className="relative w-8 h-8 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
								<div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
								<AlertTriangleIcon className="size-3.5 text-destructive relative z-10" />
							</div>
						</div>

						{/* Header bar */}
						<div className="flex items-center gap-3 border-b border-border px-5 sm:px-7 py-3.5">
							<div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
								{t("cardBadge")}
							</span>
							<div className="hidden sm:flex items-center gap-2 text-muted-foreground/50 ml-auto">
								<ClockIcon className="size-3.5" />
								<span className="text-xs">{t("processLabel")}</span>
							</div>
						</div>

						{/* Scenario text */}
						<div className="px-5 sm:px-7 py-6 sm:py-8">
							<p className="text-base sm:text-lg leading-relaxed text-foreground/90 pr-10">
								{t.rich("scenario", {
									danger: (chunks) => (
										<span className="text-destructive font-semibold">{chunks}</span>
									),
									role: (chunks) => (
										<span className="text-primary font-semibold">{chunks}</span>
									),
								})}
							</p>
						</div>
					</div>
				</div>

				{/* ─── YOUR CALL ─── */}
				<div ref={yourCallRef} className="my-8 sm:my-10">
					<div className="flex items-center gap-3">
						<div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
						<span className="text-sm font-bold text-muted-foreground uppercase tracking-[0.25em]">
							Your call
						</span>
						<div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
					</div>
				</div>

				{/* ─── OPTIONS ─── */}
				<div ref={optionsRef} className="space-y-3">
					{[0, 1, 2].map((i) => {
						const borderColors = [
							"border-l-emerald-500/60",
							"border-l-amber-500/60",
							"border-l-sky-500/60",
						];
						const isSelected = selected === i;
						const isWrong = selected !== null && selected !== CORRECT_ANSWER && isSelected;
						const isRight = selected !== null && i === CORRECT_ANSWER;

						return (
							<button
								key={i}
								type="button"
								onClick={() => handleSelect(i)}
								disabled={selected !== null}
								className={cn(
									"ld-option",
									"group w-full text-left rounded-xl border border-border border-l-[3px]",
									"transition-all duration-300",
									selected === null
										? "bg-card dark:bg-white/[0.02] cursor-pointer hover:bg-accent dark:hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/5 hover:scale-[1.01] active:scale-[0.995]"
										: "cursor-default",
									selected === null && borderColors[i],
									isRight && "border-l-emerald-500 bg-emerald-500/[0.08] border-emerald-500/30",
									isWrong && "border-l-red-500 bg-red-500/[0.06] border-red-500/30",
								)}
							>
								<div className="flex items-start gap-4 p-4 sm:p-5">
									<span
										className={cn(
											"flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200",
											selected === null
												? "bg-muted dark:bg-white/[0.06] text-muted-foreground group-hover:text-foreground group-hover:bg-accent"
												: isRight
													? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
													: isWrong
														? "bg-red-500/20 text-red-600 dark:text-red-400"
														: "bg-muted dark:bg-white/[0.06] text-muted-foreground",
										)}
									>
										{selected !== null && isRight ? (
											<CheckCircle2Icon className="size-4" />
										) : selected !== null && isWrong ? (
											<XCircleIcon className="size-4" />
										) : (
											OPTION_LETTERS[i]
										)}
									</span>
									<span
										className={cn(
											"text-sm sm:text-[15px] leading-relaxed transition-colors duration-200 pt-1",
											selected === null
												? "text-muted-foreground group-hover:text-foreground"
												: isRight
													? "text-emerald-700 dark:text-emerald-300 font-medium"
													: isWrong
														? "text-red-700 dark:text-red-300"
														: "text-muted-foreground/60",
										)}
									>
										{t(`option${OPTION_LETTERS[i]}`)}
									</span>
								</div>
							</button>
						);
					})}
				</div>

				{/* ─── RESULT (after selection) ─── */}
				{showResult && selected !== null && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className="mt-8 space-y-5"
					>
						{/* Explanation */}
						<div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-5 sm:p-6">
							<p className="text-sm sm:text-base leading-relaxed text-foreground/85 mb-3">
								{t("resultExplanation")}
							</p>
							<p className="text-sm text-primary/70 font-medium italic">
								{t("resultStat")}
							</p>
						</div>

						{/* CTA */}
						<div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
							<Button
								size="lg"
								asChild
								className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold w-full sm:w-auto text-base px-8 h-13"
							>
								<a href={`${config.saasUrl}/scan`}>
									{t("cta")}
									<ArrowRightIcon className="ml-2 size-4" />
								</a>
							</Button>
							<button
								type="button"
								onClick={handleReset}
								className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer"
							>
								{t("tryAgain")}
							</button>
						</div>
					</motion.div>
				)}
			</div>
		</section>
	);
}
