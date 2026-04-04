"use client";

import { config } from "@config";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { AnimatePresence, motion } from "framer-motion";
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

gsap.registerPlugin(ScrollTrigger);

const CORRECT_ANSWER = 0;

/* ─── Typewriter: each word fades in on scroll ─── */
function TypewriterText({
	text,
	highlights,
	className,
}: {
	text: string;
	highlights?: Record<string, "danger" | "role">;
	className?: string;
}) {
	const ref = useRef<HTMLParagraphElement>(null);

	useEffect(() => {
		if (!ref.current) return;
		const words = ref.current.querySelectorAll(".tw-word");
		gsap.fromTo(
			words,
			{ opacity: 0, y: 8, filter: "blur(4px)" },
			{
				opacity: 1,
				y: 0,
				filter: "blur(0px)",
				stagger: 0.04,
				duration: 0.3,
				ease: "power2.out",
				scrollTrigger: {
					trigger: ref.current,
					start: "top 80%",
					toggleActions: "play none none reverse",
				},
			},
		);
	}, []);

	// Split text into words, apply highlight classes
	const words = text.split(" ");

	return (
		<p ref={ref} className={className}>
			{words.map((word, i) => {
				const clean = word.replace(/[.,!?;:]/g, "");
				const punct = word.slice(clean.length);
				let colorClass = "";
				if (highlights) {
					for (const [key, type] of Object.entries(highlights)) {
						if (clean.toLowerCase().includes(key.toLowerCase())) {
							colorClass =
								type === "danger"
									? "text-red-400 font-semibold"
									: "text-[#3B8FE8] font-semibold";
						}
					}
				}
				return (
					<span key={i} className={cn("tw-word inline-block mr-[0.3em] opacity-0", colorClass)}>
						{word}
					</span>
				);
			})}
		</p>
	);
}

/* ─── Pulsing alert ring ─── */
function AlertPulse() {
	return (
		<div className="absolute top-6 right-6 sm:top-8 sm:right-8">
			<div className="relative">
				<motion.div
					className="absolute inset-0 rounded-full bg-red-500/20"
					animate={{ scale: [1, 2, 2.5], opacity: [0.4, 0.1, 0] }}
					transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
				/>
				<motion.div
					className="absolute inset-0 rounded-full bg-red-500/30"
					animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
					transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut", delay: 0.3 }}
				/>
				<div className="relative w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
					<AlertTriangleIcon className="size-4 text-red-400" />
				</div>
			</div>
		</div>
	);
}

/* ─── Fake pressure timer ─── */
function PressureTimer({ active }: { active: boolean }) {
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		if (!active) return;
		const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
		return () => clearInterval(iv);
	}, [active]);

	if (!active) return null;

	const display = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

	return (
		<motion.div
			className="flex items-center gap-2 text-muted-foreground/50"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: 0.5 }}
		>
			<ClockIcon className="size-3.5" />
			<span className="text-xs font-mono tabular-nums">{display}</span>
		</motion.div>
	);
}

/* ─── Main Component ─── */
export function LiveDemo() {
	const t = useTranslations("home.liveDemo");
	const [selected, setSelected] = useState<number | null>(null);
	const [phase, setPhase] = useState<"intro" | "decide" | "result">("intro");
	const sectionRef = useRef<HTMLElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const optionsRef = useRef<HTMLDivElement>(null);

	const isAnswered = selected !== null;
	const isCorrect = selected === CORRECT_ANSWER;

	// Scroll-triggered phase transitions
	useEffect(() => {
		if (!sectionRef.current || !cardRef.current || !optionsRef.current) return;

		// Pin the section while user scrolls through phases
		const pin = ScrollTrigger.create({
			trigger: sectionRef.current,
			start: "top top",
			end: "+=150%",
			pin: true,
			pinSpacing: true,
			onUpdate: (self) => {
				if (isAnswered) return; // Don't change phase after answering
				if (self.progress < 0.4) {
					setPhase("intro");
				} else {
					setPhase("decide");
				}
			},
		});

		return () => pin.kill();
	}, [isAnswered]);

	// Animate options entrance when phase changes to "decide"
	useEffect(() => {
		if (phase !== "decide" || !optionsRef.current) return;
		const options = optionsRef.current.querySelectorAll(".option-card");
		gsap.fromTo(
			options,
			{ opacity: 0, y: 40, scale: 0.95 },
			{
				opacity: 1,
				y: 0,
				scale: 1,
				stagger: 0.15,
				duration: 0.6,
				ease: "power3.out",
			},
		);
	}, [phase]);

	const handleSelect = useCallback(
		(index: number) => {
			if (isAnswered) return;
			setSelected(index);
			setPhase("result");
			// Release the pin after answering
			setTimeout(() => {
				ScrollTrigger.getAll().forEach((st) => {
					if (st.vars.trigger === sectionRef.current) {
						st.kill();
					}
				});
			}, 2000);
		},
		[isAnswered],
	);

	function handleReset() {
		setSelected(null);
		setPhase("intro");
	}

	const OPTION_LETTERS = ["A", "B", "C"];
	const OPTION_COLORS = [
		{ border: "border-l-emerald-500/60", bg: "bg-emerald-500/10", ring: "ring-emerald-400/50" },
		{ border: "border-l-amber-500/60", bg: "bg-amber-500/10", ring: "ring-amber-400/50" },
		{ border: "border-l-sky-500/60", bg: "bg-sky-500/10", ring: "ring-sky-400/50" },
	];

	const scenarioText =
		"A supplier delivers contaminated raw material that passed incoming inspection. As COO, you need to make a decision immediately. What do you do?";
	const scenarioHighlights: Record<string, "danger" | "role"> = {
		contaminated: "danger",
		COO: "role",
		immediately: "danger",
	};

	return (
		<section
			ref={sectionRef}
			id="live-demo"
			className="relative min-h-screen flex items-center bg-muted dark:bg-[#060B18] overflow-hidden"
		>
			{/* Vignette edges */}
			<div className="absolute inset-0 pointer-events-none" style={{
				background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, var(--background) 100%)",
			}} />

			{/* Ambient alert glow — pulses red subtly */}
			<motion.div
				className="absolute inset-0 pointer-events-none"
				animate={{
					background: [
						"radial-gradient(ellipse 60% 50% at 50% 50%, rgba(220,38,38,0.03) 0%, transparent 70%)",
						"radial-gradient(ellipse 60% 50% at 50% 50%, rgba(220,38,38,0.06) 0%, transparent 70%)",
						"radial-gradient(ellipse 60% 50% at 50% 50%, rgba(220,38,38,0.03) 0%, transparent 70%)",
					],
				}}
				transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
			/>

			<div className="container max-w-3xl relative z-10 px-4 py-16 sm:py-20">
				{/* ─── PHASE: INTRO — Scenario builds with scroll ─── */}
				<AnimatePresence mode="wait">
					{phase === "intro" && (
						<motion.div
							key="intro"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.5 }}
							className="text-center space-y-8"
						>
							{/* Badge */}
							<motion.div
								className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.08] px-4 py-1.5"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.2 }}
							>
								<AlertTriangleIcon className="size-3.5 text-red-400" />
								<span className="text-xs font-semibold text-red-400 uppercase tracking-widest">
									Incoming alert
								</span>
							</motion.div>

							{/* Title */}
							<h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
								{t("title")}
							</h2>

							{/* Subtitle */}
							<p className="text-muted-foreground text-lg sm:text-xl max-w-xl mx-auto">
								{t("subtitle")}
							</p>

							{/* Scroll cue */}
							<motion.div
								className="flex flex-col items-center gap-2 pt-8"
								animate={{ y: [0, 8, 0] }}
								transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
							>
								<span className="text-xs text-muted-foreground/50 uppercase tracking-widest">Scroll to begin</span>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/30">
									<path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</motion.div>
						</motion.div>
					)}

					{/* ─── PHASE: DECIDE — Scenario + options ─── */}
					{phase === "decide" && !isAnswered && (
						<motion.div
							key="decide"
							ref={cardRef}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5 }}
						>
							{/* Scenario card */}
							<div className="relative bg-card dark:bg-white/[0.03] backdrop-blur border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/40">
								<AlertPulse />

								{/* Header */}
								<div className="border-b border-white/[0.06] px-6 sm:px-8 py-4 flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
										<span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
											{t("cardBadge")}
										</span>
									</div>
									<PressureTimer active={phase === "decide"} />
								</div>

								{/* Scenario text — typewriter */}
								<div className="px-6 sm:px-8 py-6 sm:py-8">
									<TypewriterText
										text={scenarioText}
										highlights={scenarioHighlights}
										className="text-base sm:text-lg leading-relaxed text-foreground/90"
									/>
								</div>
							</div>

							{/* YOUR CALL label */}
							<motion.div
								className="flex items-center justify-center gap-3 my-8"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.8 }}
							>
								<div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
								<span className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">
									Your call
								</span>
								<div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
							</motion.div>

							{/* Options */}
							<div ref={optionsRef} className="space-y-3">
								{[0, 1, 2].map((i) => {
									const color = OPTION_COLORS[i];
									return (
										<button
											key={i}
											type="button"
											onClick={() => handleSelect(i)}
											className={cn(
"option-card opacity-0",
"group w-full text-left rounded-xl border border-border border-l-[3px] bg-card dark:bg-white/[0.02]",
										"transition-all duration-300 cursor-pointer",
												"hover:bg-muted dark:hover:bg-white/[0.07] hover:border-border hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/[0.03]",
												"hover:scale-[1.015] active:scale-[0.99]",
												color.border,
											)}
										>
											<div className="flex items-start gap-4 p-5 sm:p-6">
												<span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-muted dark:bg-white/[0.06] text-sm font-bold text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80 dark:group-hover:bg-white/[0.12] transition-all duration-300">
													{OPTION_LETTERS[i]}
												</span>
												<span className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300 pt-1.5">
													{t(`option${OPTION_LETTERS[i]}`)}
												</span>
											</div>
										</button>
									);
								})}
							</div>
						</motion.div>
					)}

					{/* ─── PHASE: RESULT ─── */}
					{phase === "result" && isAnswered && (
						<motion.div
							key="result"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
							className="space-y-6"
						>
							{/* Selected answer */}
							<div
								className={cn(
									"rounded-xl border border-l-[3px] p-5 sm:p-6",
									isCorrect
										? "border-emerald-400/40 bg-emerald-500/[0.08]"
										: "border-red-400/40 bg-red-500/[0.06]",
								)}
							>
								<div className="flex items-start gap-4">
									{isCorrect ? (
										<motion.div
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
										>
											<CheckCircle2Icon className="size-6 text-emerald-400 flex-shrink-0" />
										</motion.div>
									) : (
										<motion.div
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
										>
											<XCircleIcon className="size-6 text-red-400 flex-shrink-0" />
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
								className="relative rounded-xl border border-[#3B8FE8]/20 bg-[#3B8FE8]/[0.06] p-6 sm:p-7"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
							>
								<p className="text-sm sm:text-base leading-relaxed text-foreground/85 mb-4">
									{t("resultExplanation")}
								</p>
								<p className="text-sm text-[#3B8FE8]/80 font-medium italic">
									{t("resultStat")}
								</p>
							</motion.div>

							{/* CTA */}
							<motion.div
								className="flex flex-col sm:flex-row items-center gap-4 pt-4"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.7 }}
							>
								<Button
									size="lg"
									asChild
									className="bg-[#3B8FE8] hover:bg-[#2E7FD6] text-[#0A1428] font-bold w-full sm:w-auto text-base px-8 h-14"
								>
									<a href={`${config.saasUrl}/scan`}>
										{t("cta")}
										<ArrowRightIcon className="ml-2 size-5" />
									</a>
								</Button>
								<button
									type="button"
									onClick={handleReset}
									className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
								>
									{t("tryAgain")}
								</button>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
}
