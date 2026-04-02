"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

const STEPS = [
	{ label: "Discover", color: "#00E5C0" },
	{ label: "Map", color: "#38BDF8" },
	{ label: "Assess", color: "#A78BFA" },
	{ label: "Document", color: "#FB923C" },
	{ label: "Simulate", color: "#F472B6" },
	{ label: "Evaluate", color: "#EAB308" },
] as const;

const PARTICLES_PER_SEGMENT = 4;

interface WorkflowEndToEndProps {
	/** Custom class name */
	className?: string;
}

/**
 * Animated horizontal workflow showing all 6 Auditora steps.
 * Steps light up sequentially with particle trails between them.
 * Loops once after scrolling into view.
 */
export function WorkflowEndToEnd({ className }: WorkflowEndToEndProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(containerRef, { once: true, margin: "-60px" });
	const controls = useAnimation();

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

	return (
		<div
			ref={containerRef}
			className={`relative w-full ${className ?? ""}`}
			aria-hidden="true"
		>
			<svg
				viewBox="0 0 600 80"
				fill="none"
				className="w-full h-auto"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Background connecting line */}
				<line
					x1="50"
					y1="40"
					x2="550"
					y2="40"
					stroke="white"
					strokeWidth="1"
					opacity="0.06"
				/>

				{/* Active connecting line that draws */}
				<motion.line
					x1="50"
					y1="40"
					x2="550"
					y2="40"
					stroke="url(#workflowGrad)"
					strokeWidth="2"
					strokeLinecap="round"
					variants={{
						hidden: { pathLength: 0, opacity: 0 },
						sequence: {
							pathLength: 1,
							opacity: 1,
							transition: {
								pathLength: { duration: 2.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
								opacity: { duration: 0.3 },
							},
						},
						allVisible: { pathLength: 1, opacity: 1 },
					}}
					initial="hidden"
					animate={controls}
				/>

				{/* Gradient definition */}
				<defs>
					<linearGradient id="workflowGrad" x1="0" y1="0" x2="1" y2="0">
						{STEPS.map((step, i) => (
							<stop
								key={step.label}
								offset={`${(i / (STEPS.length - 1)) * 100}%`}
								stopColor={step.color}
							/>
						))}
					</linearGradient>
				</defs>

				{/* Nodes and labels */}
				{STEPS.map((step, i) => {
					const x = 50 + (i / (STEPS.length - 1)) * 500;
					return (
						<g key={step.label}>
							{/* Glow ring */}
							<motion.circle
								cx={x}
								cy={40}
								r="16"
								fill="none"
								stroke={step.color}
								strokeWidth="1"
								opacity="0"
								variants={{
									hidden: { opacity: 0, scale: 0.8 },
									sequence: {
										opacity: [0, 0.3, 0],
										scale: [0.8, 1.3, 1.5],
										transition: {
											duration: 0.8,
											delay: 0.4 + i * 0.35,
											ease: "easeOut",
										},
									},
									allVisible: { opacity: 0.2, scale: 1 },
								}}
								initial="hidden"
								animate={controls}
							/>
							{/* Node circle */}
							<motion.circle
								cx={x}
								cy={40}
								r="8"
								fill={step.color}
								opacity="0"
								variants={{
									hidden: { opacity: 0, scale: 0 },
									sequence: {
										opacity: 1,
										scale: 1,
										transition: {
											type: "spring",
											stiffness: 400,
											damping: 20,
											delay: 0.5 + i * 0.35,
										},
									},
									allVisible: { opacity: 1, scale: 1 },
								}}
								initial="hidden"
								animate={controls}
							/>
							{/* Inner dot */}
							<motion.circle
								cx={x}
								cy={40}
								r="3"
								fill="#0A1428"
								opacity="0"
								variants={{
									hidden: { opacity: 0 },
									sequence: {
										opacity: 1,
										transition: { delay: 0.6 + i * 0.35, duration: 0.3 },
									},
									allVisible: { opacity: 1 },
								}}
								initial="hidden"
								animate={controls}
							/>
							{/* Label */}
							<motion.text
								x={x}
								y={68}
								textAnchor="middle"
								fill="white"
								fontSize="9"
								fontFamily="system-ui, sans-serif"
								opacity="0"
								variants={{
									hidden: { opacity: 0, y: 4 },
									sequence: {
										opacity: 0.6,
										y: 0,
										transition: { delay: 0.65 + i * 0.35, duration: 0.4 },
									},
									allVisible: { opacity: 0.6, y: 0 },
								}}
								initial="hidden"
								animate={controls}
							>
								{step.label}
							</motion.text>

							{/* Particle trail between nodes */}
							{i < STEPS.length - 1 &&
								Array.from({ length: PARTICLES_PER_SEGMENT }).map((_, p) => {
									const x1 = 50 + (i / (STEPS.length - 1)) * 500;
									const x2 = 50 + ((i + 1) / (STEPS.length - 1)) * 500;
									return (
										<motion.circle
											key={`p-${i}-${p}`}
											r="1.5"
											fill={step.color}
											opacity="0"
											variants={{
												hidden: { opacity: 0 },
												sequence: {
													opacity: [0, 0.8, 0],
													cx: [x1, x2],
													cy: [40, 40],
													transition: {
														duration: 0.6,
														delay: 0.8 + i * 0.35 + p * 0.08,
														ease: "easeInOut",
													},
												},
												allVisible: { opacity: 0 },
											}}
											initial="hidden"
											animate={controls}
										/>
									);
								})}
						</g>
					);
				})}
			</svg>
		</div>
	);
}
