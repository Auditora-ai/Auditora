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
 * LiveDemo — scroll-driven reveal + interactive decision.
 *
 * Architecture:
 * - ALL content is always in the DOM (no AnimatePresence, no conditional rendering for scroll phases)
 * - GSAP ScrollTrigger timeline controls opacity/y/scale of each layer
 * - Phase 1 (0%-30%): title + subtitle visible, scenario hidden
 * - Phase 2 (30%-70%): title fades, scenario + options scroll in
 * - After user clicks: React state takes over for result (no more scroll dependency)
 */
export function LiveDemo() {
	const t = useTranslations("home.liveDemo");
	const [selected, setSelected] = useState<number | null>(null);
	const [showResult, setShowResult] = useState(false);

	const sectionRef = useRef<HTMLElement>(null);
	const introRef = useRef<HTMLDivElement>(null);
	const scenarioRef = useRef<HTMLDivElement>(null);
	const optionsRef = useRef<HTMLDivElement>(null);
	const yourCallRef = useRef<HTMLDivElement>(null);

	const isCorrect = selected === CORRECT_ANSWER;

	// ─── GSAP scroll timeline ───
	useEffect(() => {
		if (!sectionRef.current || !introRef.current || !scenarioRef.current || !optionsRef.current || !yourCallRef.current) return;

		// Sync Lenis with ScrollTrigger
		ScrollTrigger.defaults({ scroller: undefined });

		const ctx = gsap.context(() => {
			// Set initial states
			gsap.set(scenarioRef.current, { opacity: 0, y: 60 });
			gsap.set(yourCallRef.current, { opacity: 0 });
			gsap.set(".option-card", { opacity: 0, y: 40 });

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top top",
					end: "+=200%",
					pin: true,
					scrub: 0.8,
					pinSpacing: true,
					anticipatePin: 1,
					invalidateOnRefresh: true,
				},
			});

			// Phase 1 (0% → 30%): Intro visible, nothing else
			tl.to({}, { duration: 0.3 }); // Hold intro

			// Phase 2 (30% → 50%): Intro fades up, scenario appears
			tl.to(introRef.current, {
				opacity: 0,
				y: -40,
				duration: 0.15,
				ease: "power2.in",
			});
			tl.to(scenarioRef.current, {
				opacity: 1,
				y: 0,
				duration: 0.2,
				ease: "power2.out",
			}, "-=0.05");

			// Phase 3 (50% → 70%): "Your call" label + options stagger in
			tl.to(yourCallRef.current, {
				opacity: 1,
				duration: 0.1,
			});
			tl.to(".option-card", {
				opacity: 1,
				y: 0,
				stagger: 0.08,
				duration: 0.15,
				ease: "power2.out",
			}, "-=0.05");

			// Phase 4 (70% → 100%): Hold — user interacts
			tl.to({}, { duration: 0.3 });

		}, sectionRef);

		return () => ctx.revert();
	}, []);

	// ─── Handle selection ───
	const handleSelect = useCallback((index: number) => {
		if (selected !== null) return;
		setSelected(index);
		setShowResult(true);

		// Animate the options out and result in
		if (optionsRef.current && yourCallRef.current) {
			gsap.to(".option-card", {
				opacity: 0,
				y: -20,
				stagger: 0.05,
				duration: 0.3,
				ease: "power2.in",
			});
			gsap.to(yourCallRef.current, { opacity: 0, duration: 0.2 });
		}

		// Kill the pin so user can scroll away
		setTimeout(() => {
			ScrollTrigger.getAll().forEach((st) => {
				if (st.trigger === sectionRef.current) {
					st.disable();
				}
			});
		}, 1500);
	}, [selected]);

	const handleReset = useCallback(() => {
		setSelected(null);
		setShowResult(false);

		// Reset option cards
		gsap.to(".option-card", { opacity: 1, y: 0, stagger: 0.05, duration: 0.3 });
		gsap.to(yourCallRef.current, { opacity: 1, duration: 0.3 });
	}, []);

	return (
		<section
			ref={sectionRef}
			id="live-demo"
			className="relative min-h-screen flex items-center bg-muted dark:bg-[#060B18] overflow-hidden"
		>
			{/* Ambient glow */}
			<div className="absolute inset-0 pointer-events-none" style={{
				background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(59,143,232,0.04) 0%, transparent 70%)",
			}} />

			<div className="container max-w-3xl relative z-10 px-4 py-16 sm:py-20">

				{/* ═══ LAYER 1: INTRO (fades out on scroll) ═══ */}
				<div ref={introRef} className="text-center space-y-6 mb-12">
					{/* Badge */}
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-1.5">
						<AlertTriangleIcon className="size-3.5 text-primary" />
						<span className="text-xs font-semibold text-primary uppercase tracking-widest">
							{t("badge")}
						</span>
					</div>

					{/* Title */}
					<h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
						{t("title")}
					</h2>

					{/* Subtitle */}
					<p className="text-muted-foreground text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>

					{/* Scroll cue */}
					<div className="flex flex-col items-center gap-2 pt-6 animate-bounce">
						<span className="text-xs text-muted-foreground/60 uppercase tracking-widest">Scroll</span>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/40">
							<path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</div>
				</div>

				{/* ═══ LAYER 2: SCENARIO CARD (scrolls in) ═══ */}
				<div ref={scenarioRef}>
					<div className="relative bg-card dark:bg-white/[0.03] backdrop-blur border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/30">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-border px-5 sm:px-7 py-3.5">
							<div className="flex items-center gap-3">
								<div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
								<span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
									{t("cardBadge")}
								</span>
							</div>
							<div className="hidden sm:flex items-center gap-2 text-muted-foreground/60">
								<ClockIcon className="size-3.5" />
								<span className="text-xs">{t("processLabel")}</span>
							</div>
						</div>

						{/* Scenario text */}
						<div className="px-5 sm:px-7 py-5 sm:py-7">
							<p className="text-base sm:text-lg leading-relaxed text-foreground/90">
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

					{/* ═══ LAYER 3: YOUR CALL + OPTIONS (stagger in) ═══ */}
					<div ref={yourCallRef} className="my-7">
						<div className="flex items-center gap-3">
							<div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
							<span className="text-sm font-bold text-muted-foreground uppercase tracking-[0.25em]">
								Your call
							</span>
							<div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
						</div>
					</div>

					<div ref={optionsRef} className="space-y-3">
						{[0, 1, 2].map((i) => {
							const colors = [
								"border-l-emerald-500/60",
								"border-l-amber-500/60",
								"border-l-sky-500/60",
							];
							return (
								<button
									key={i}
									type="button"
									onClick={() => handleSelect(i)}
									className={cn(
										"option-card",
										"group w-full text-left rounded-xl border border-border border-l-[3px] bg-card dark:bg-white/[0.02]",
										"transition-all duration-300 cursor-pointer",
										"hover:bg-accent dark:hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
										"hover:scale-[1.01] active:scale-[0.995]",
										colors[i],
									)}
								>
									<div className="flex items-start gap-4 p-4 sm:p-5">
										<span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-muted dark:bg-white/[0.06] text-sm font-bold text-muted-foreground group-hover:text-foreground group-hover:bg-accent transition-all duration-200">
											{OPTION_LETTERS[i]}
										</span>
										<span className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-200 pt-1">
											{t(`option${OPTION_LETTERS[i]}`)}
										</span>
									</div>
								</button>
							);
						})}
					</div>

					{/* ═══ RESULT (appears after selection, React-controlled) ═══ */}
					{showResult && selected !== null && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
							className="mt-6 space-y-5"
						>
							{/* Selected answer */}
							<div className={cn(
								"rounded-xl border border-l-[3px] p-5",
								isCorrect
									? "border-emerald-400/40 bg-emerald-500/[0.08]"
									: "border-red-400/40 bg-red-500/[0.06]",
							)}>
								<div className="flex items-start gap-3.5">
									{isCorrect ? (
										<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.5 }}>
											<CheckCircle2Icon className="size-5 text-emerald-400 flex-shrink-0 mt-0.5" />
										</motion.div>
									) : (
										<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.5 }}>
											<XCircleIcon className="size-5 text-red-400 flex-shrink-0 mt-0.5" />
										</motion.div>
									)}
									<div>
										<p className="text-sm font-semibold text-foreground mb-1">
											{t("yourAnswer", { letter: OPTION_LETTERS[selected] })}
										</p>
										<p className="text-sm text-muted-foreground leading-relaxed">
											{t(`option${OPTION_LETTERS[selected]}`)}
										</p>
									</div>
								</div>
							</div>

							{/* Explanation */}
							<motion.div
								className="rounded-xl border border-primary/20 bg-primary/[0.05] p-5 sm:p-6"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.6 }}
							>
								<p className="text-sm sm:text-base leading-relaxed text-foreground/85 mb-3">
									{t("resultExplanation")}
								</p>
								<p className="text-sm text-primary/70 font-medium italic">
									{t("resultStat")}
								</p>
							</motion.div>

							{/* CTA */}
							<motion.div
								className="flex flex-col sm:flex-row items-center gap-4 pt-2"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.8 }}
							>
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
							</motion.div>
						</motion.div>
					)}
				</div>
			</div>
		</section>
	);
}
