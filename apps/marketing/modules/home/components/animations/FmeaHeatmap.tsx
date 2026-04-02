"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

const GRID_SIZE = 5;
const CELL_SIZE = 52;
const GAP = 4;
const PADDING = 30;
const LABEL_WIDTH = 60;

const SEVERITY_LABELS = ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"];
const OCCURRENCE_LABELS = ["Rare", "Unlikely", "Possible", "Likely", "Almost\nCertain"];

/** Risk level color based on severity x occurrence */
function getRiskColor(s: number, o: number): string {
	const score = s + o;
	if (score <= 3) return "#22C55E"; // green
	if (score <= 5) return "#84CC16"; // lime
	if (score <= 7) return "#EAB308"; // yellow
	if (score <= 9) return "#F97316"; // orange
	return "#EF4444"; // red
}

function getRiskBg(s: number, o: number): string {
	const score = s + o;
	if (score <= 3) return "rgba(34,197,94,0.15)";
	if (score <= 5) return "rgba(132,204,22,0.12)";
	if (score <= 7) return "rgba(234,179,8,0.12)";
	if (score <= 9) return "rgba(249,115,22,0.12)";
	return "rgba(239,68,68,0.15)";
}

/** Sample RPN numbers that animate counting up */
const RPN_DATA: number[][] = [
	[2, 4, 8, 12, 18],
	[3, 6, 12, 18, 24],
	[5, 10, 15, 24, 32],
	[8, 15, 24, 32, 40],
	[12, 20, 32, 45, 60],
];

interface FmeaHeatmapProps {
	/** Custom class name */
	className?: string;
}

/**
 * Animated FMEA 5x5 risk matrix heatmap.
 * Cells light up with color-coded risk levels.
 * A scanning cursor moves through cells sequentially.
 * Numbers count up as each cell activates.
 */
export function FmeaHeatmap({ className }: FmeaHeatmapProps) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-60px" });
	const controls = useAnimation();
	const countersRef = useRef<Map<number, SVGTextElement>>(new Map());

	useEffect(() => {
		if (!isInView) return;

		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (prefersReduced) {
			controls.set("allVisible");
			return;
		}

		controls.start("sequence");
	}, [isInView, controls]);

	const totalWidth = LABEL_WIDTH + GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * GAP + PADDING * 2;
	const totalHeight = PADDING + GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * GAP + LABEL_WIDTH + PADDING;

	const cells: { s: number; o: number; x: number; y: number; delay: number }[] = [];
	for (let s = 0; s < GRID_SIZE; s++) {
		for (let o = 0; o < GRID_SIZE; o++) {
			const x = LABEL_WIDTH + PADDING + o * (CELL_SIZE + GAP);
			const y = PADDING + s * (CELL_SIZE + GAP);
			// Diagonal scanning pattern
			const delay = (s + o) * 0.12 + 0.3;
			cells.push({ s, o, x, y, delay });
		}
	}

	return (
		<div ref={ref} className={className}>
			<motion.svg
				viewBox={`0 0 ${totalWidth} ${totalHeight}`}
				fill="none"
				className="w-full h-auto"
				xmlns="http://www.w3.org/2000/svg"
				initial="hidden"
				animate={controls}
			>
				{/* Axis labels */}
				<motion.text
					x={totalWidth / 2}
					y={totalHeight - 4}
					textAnchor="middle"
					fill="#94A3B8"
					fontSize="7"
					fontFamily="system-ui"
					variants={{
						hidden: { opacity: 0 },
						sequence: { opacity: 0.5, transition: { delay: 0.1, duration: 0.5 } },
						allVisible: { opacity: 0.5 },
					}}
				>
					OCCURRENCE →
				</motion.text>

				<motion.text
					x="8"
					y={totalHeight / 2}
					textAnchor="middle"
					fill="#94A3B8"
					fontSize="7"
					fontFamily="system-ui"
					transform={`rotate(-90, 8, ${totalHeight / 2})`}
					variants={{
						hidden: { opacity: 0 },
						sequence: { opacity: 0.5, transition: { delay: 0.15, duration: 0.5 } },
						allVisible: { opacity: 0.5 },
					}}
				>
					SEVERITY →
				</motion.text>

				{/* Grid cells */}
				{cells.map(({ s, o, x, y, delay }) => {
					const rpn = RPN_DATA[s][o];
					const key = s * GRID_SIZE + o;
					return (
						<g key={`${s}-${o}`}>
							<motion.rect
								x={x}
								y={y}
								width={CELL_SIZE}
								height={CELL_SIZE}
								rx="6"
								fill={getRiskBg(s, o)}
								stroke={getRiskColor(s, o)}
								strokeWidth="1"
								opacity="0"
								variants={{
									hidden: { opacity: 0, scale: 0.8 },
									sequence: {
										opacity: 1,
										scale: 1,
										transition: {
											type: "spring",
											stiffness: 300,
											damping: 25,
											delay,
										},
									},
									allVisible: { opacity: 1, scale: 1 },
								}}
							/>
							{/* RPN Number */}
							<motion.text
								x={x + CELL_SIZE / 2}
								y={y + CELL_SIZE / 2 + 3}
								textAnchor="middle"
								fill={getRiskColor(s, o)}
								fontSize="10"
								fontFamily="system-ui"
								fontWeight="600"
								opacity="0"
								variants={{
									hidden: { opacity: 0 },
									sequence: {
										opacity: 0.9,
										transition: { delay: delay + 0.1, duration: 0.3 },
									},
									allVisible: { opacity: 0.9 },
								}}
								ref={(el) => {
									if (el) countersRef.current.set(key, el);
								}}
							>
								{rpn}
							</motion.text>

							{/* Pulse effect on high-risk cells */}
							{(s + o) >= 8 && (
								<motion.rect
									x={x}
									y={y}
									width={CELL_SIZE}
									height={CELL_SIZE}
									rx="6"
									fill={getRiskColor(s, o)}
									opacity="0"
									variants={{
										hidden: { opacity: 0 },
										sequence: {
											opacity: [0, 0.15, 0],
											transition: {
												duration: 1.5,
												repeat: 2,
												repeatDelay: 1,
												delay: delay + 0.3,
											},
										},
										allVisible: { opacity: 0 },
									}}
								/>
							)}
						</g>
					);
				})}
			</motion.svg>
		</div>
	);
}
