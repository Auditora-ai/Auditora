"use client";

import { useGSAP } from "@gsap/react";
import { SplitWords } from "@shared/components/SplitWords";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

function AnimatedStat({
	number,
	unit,
	label,
}: { number: string; unit: string; label: string }) {
	const numRef = useRef<HTMLSpanElement>(null);

	useGSAP(() => {
		if (!numRef.current) return;

		gsap.from(numRef.current, {
			textContent: 0,
			duration: 2,
			ease: "power2.out",
			snap: { textContent: 1 },
			scrollTrigger: {
				trigger: numRef.current,
				start: "top 85%",
				once: true,
			},
			onComplete: () => {
				// Scale pulse on counter completion
				if (numRef.current) {
					gsap.fromTo(
						numRef.current,
						{ scale: 1.08 },
						{ scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" },
					);
				}
			},
		});
	});

	return (
		<div className="stat-item flex flex-col items-center text-center">
			<div className="flex items-baseline gap-1">
				<span
					ref={numRef}
					className="font-display text-6xl md:text-7xl lg:text-8xl text-foreground tabular-nums"
				>
					{number}
				</span>
				<span className="font-display text-3xl md:text-4xl text-primary">
					{unit}
				</span>
			</div>
			<p className="mt-3 text-sm md:text-base text-muted-foreground max-w-[240px]">
				{label}
			</p>
		</div>
	);
}

export function ProblemSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			// Title word-reveal
			gsap.from(sectionRef.current.querySelectorAll(".problem-word-inner"), {
				y: "100%",
				stagger: 0.05,
				duration: 0.8,
				ease: "power4.out",
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});

			// Stats stagger from center
			gsap.from(sectionRef.current.querySelectorAll(".stat-item"), {
				opacity: 0,
				y: 40,
				stagger: { from: "center", each: 0.15 },
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: {
					trigger: sectionRef.current.querySelector(".stats-grid"),
					start: "top 85%",
					once: true,
				},
			});

			// Description fade
			gsap.from(sectionRef.current.querySelector(".problem-description"), {
				opacity: 0,
				y: 20,
				filter: "blur(4px)",
				duration: 0.6,
				ease: "power2.out",
				scrollTrigger: {
					trigger: sectionRef.current.querySelector(".problem-description"),
					start: "top 90%",
					once: true,
				},
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="py-20 lg:py-28">
			<div className="container">
				<h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground text-center max-w-3xl mx-auto text-balance" style={{ perspective: "600px" }}>
					<SplitWords innerClassName="problem-word-inner">
						{t("home.problem.title")}
					</SplitWords>
				</h2>

				<div className="stats-grid mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
					<AnimatedStat
						number={t("home.problem.stat1.number")}
						unit={t("home.problem.stat1.unit")}
						label={t("home.problem.stat1.label")}
					/>
					<AnimatedStat
						number={t("home.problem.stat2.number")}
						unit={t("home.problem.stat2.unit")}
						label={t("home.problem.stat2.label")}
					/>
					<AnimatedStat
						number={t("home.problem.stat3.number")}
						unit={t("home.problem.stat3.unit")}
						label={t("home.problem.stat3.label")}
					/>
				</div>

				<p className="problem-description mt-16 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto text-center text-balance leading-relaxed">
					{t("home.problem.description")}
				</p>
			</div>
		</section>
	);
}
