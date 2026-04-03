"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

interface RiskRadarChartProps {
	/** Custom class name */
	className?: string;
}

const AXES = [
	{ label: "Cumplimiento", angle: -90 },
	{ label: "Operacional", angle: -18 },
	{ label: "Financiero", angle: 54 },
	{ label: "Tecnológico", angle: 126 },
	{ label: "Reputacional", angle: 198 },
] as const;

// Two datasets: before (red-ish) and after (teal)
const DATASET_BEFORE = [0.82, 0.75, 0.90, 0.65, 0.70]; // normalized 0-1
const DATASET_AFTER = [0.35, 0.28, 0.42, 0.30, 0.25];

const CENTER_X = 130;
const CENTER_Y = 130;
const MAX_RADIUS = 95;

function toCartesian(angle: number, radius: number) {
	const rad = (angle * Math.PI) / 180;
	return {
		x: CENTER_X + radius * Math.cos(rad),
		y: CENTER_Y + radius * Math.sin(rad),
	};
}

function buildPolygonPath(values: readonly number[], scale = 1): string {
	const pts = AXES.map(({ angle }, i) => {
		const r = values[i] * MAX_RADIUS * scale;
		return toCartesian(angle, r);
	});
	return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
}

// Rings at 25%, 50%, 75%, 100%
const RINGS = [0.25, 0.5, 0.75, 1.0];

/**
 * RiskRadarChart — animated pentagon radar chart showing risk levels before/after Auditora.
 * Axes extend outward, rings draw, then two datasets fill in with spring animation.
 * Supports prefers-reduced-motion.
 */
export function RiskRadarChart({ className }: RiskRadarChartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(containerRef, { once: true, margin: "-60px" });
	const controls = useAnimation();

	const prefersReduced =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	useEffect(() => {
		if (!isInView) return;
		if (prefersReduced) {
			controls.set("visible");
			return;
		}
		controls.start("visible");
	}, [isInView, controls, prefersReduced]);

	const ringVariants = {
		hidden: { pathLength: 0, opacity: 0 },
		visible: (i: number) => ({
			pathLength: 1,
			opacity: 1,
			transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
		}),
	};

	const axisVariants = {
		hidden: { pathLength: 0, opacity: 0 },
		visible: (i: number) => ({
			pathLength: 1,
			opacity: 1,
			transition: { duration: 0.5, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
		}),
	};

	const dataVariants = {
		hidden: { pathLength: 0, opacity: 0 },
		visible: (delay: number) => ({
			pathLength: 1,
			opacity: 1,
			transition: { duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
		}),
	};

	const fillVariants = {
		hidden: { opacity: 0, scale: 0.1 },
		visible: (delay: number) => ({
			opacity: 1,
			scale: 1,
			transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
		}),
	};

	return (
		<div
			ref={containerRef}
			className={`relative w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm ${className ?? ""}`}
			aria-hidden="true"
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="size-2 rounded-full bg-[#3B8FE8] shadow-[0_0_6px_rgba(59,143,232,0.8)]" />
					<span className="text-xs font-medium text-white/60">Mapa de Riesgo — Pentagonal</span>
				</div>
				<div className="flex items-center gap-3 text-[10px]">
					<div className="flex items-center gap-1.5">
						<div className="size-2 rounded-full bg-red-400/70" />
						<span className="text-white/40">Antes</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="size-2 rounded-full bg-[#3B8FE8]" />
						<span className="text-white/40">Con Auditora</span>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-center px-4 py-4">
				<svg viewBox="0 0 260 260" className="w-full max-w-[260px] h-auto" fill="none">
					{/* Rings */}
					{RINGS.map((scale, i) => {
						const ringPts = AXES.map(({ angle }) => {
							const pt = toCartesian(angle, scale * MAX_RADIUS);
							return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
						}).join(" ");

						return (
							<motion.polygon
								key={`ring-${i}`}
								points={ringPts}
								stroke="rgba(255,255,255,0.06)"
								strokeWidth={1}
								fill="none"
								custom={i}
								variants={ringVariants}
								initial="hidden"
								animate={controls}
							/>
						);
					})}

					{/* Axis lines */}
					{AXES.map(({ angle }, i) => {
						const end = toCartesian(angle, MAX_RADIUS);
						return (
							<motion.line
								key={`axis-${i}`}
								x1={CENTER_X}
								y1={CENTER_Y}
								x2={end.x}
								y2={end.y}
								stroke="rgba(255,255,255,0.08)"
								strokeWidth={1}
								custom={i}
								variants={axisVariants}
								initial="hidden"
								animate={controls}
							/>
						);
					})}

					{/* Data fill — BEFORE (red) */}
					<motion.path
						d={buildPolygonPath(DATASET_BEFORE)}
						fill="rgba(239,68,68,0.15)"
						stroke="none"
						custom={1.0}
						variants={fillVariants}
						initial="hidden"
						animate={controls}
						style={{ transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
					/>
					<motion.path
						d={buildPolygonPath(DATASET_BEFORE)}
						stroke="#EF4444"
						strokeWidth={1.5}
						fill="none"
						strokeOpacity={0.6}
						custom={1.0}
						variants={dataVariants}
						initial="hidden"
						animate={controls}
					/>

					{/* Data fill — AFTER (teal) */}
					<motion.path
						d={buildPolygonPath(DATASET_AFTER)}
						fill="rgba(59,143,232,0.12)"
						stroke="none"
						custom={1.8}
						variants={fillVariants}
						initial="hidden"
						animate={controls}
						style={{ transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
					/>
					<motion.path
						d={buildPolygonPath(DATASET_AFTER)}
						stroke="#3B8FE8"
						strokeWidth={2}
						fill="none"
						custom={1.8}
						variants={dataVariants}
						initial="hidden"
						animate={controls}
					/>

					{/* Data points (teal) */}
					{AXES.map(({ angle }, i) => {
						const r = DATASET_AFTER[i] * MAX_RADIUS;
						const pt = toCartesian(angle, r);
						return (
							<motion.circle
								key={`dot-${i}`}
								cx={pt.x}
								cy={pt.y}
								r={3.5}
								fill="#3B8FE8"
								stroke="#0A1428"
								strokeWidth={1.5}
								initial={{ scale: 0, opacity: 0 }}
								animate={isInView ? { scale: 1, opacity: 1 } : {}}
								style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
								transition={{
									type: "spring",
									stiffness: 300,
									damping: 20,
									delay: 2.2 + i * 0.1,
								}}
							/>
						);
					})}

					{/* Axis labels */}
					{AXES.map(({ label, angle }, i) => {
						const labelRadius = MAX_RADIUS + 16;
						const pt = toCartesian(angle, labelRadius);
						return (
							<motion.text
								key={`label-${i}`}
								x={pt.x}
								y={pt.y + 3}
								textAnchor="middle"
								fill="rgba(255,255,255,0.45)"
								fontSize="8"
								fontFamily="system-ui, sans-serif"
								fontWeight="500"
								initial={{ opacity: 0 }}
								animate={isInView ? { opacity: 1 } : {}}
								transition={{ delay: 0.8 + i * 0.1 }}
							>
								{label}
							</motion.text>
						);
					})}

					{/* Center dot */}
					<circle cx={CENTER_X} cy={CENTER_Y} r={2} fill="rgba(255,255,255,0.2)" />
				</svg>
			</div>

			{/* Risk reduction callout */}
			<motion.div
				initial={{ opacity: 0, y: 6 }}
				animate={isInView ? { opacity: 1, y: 0 } : {}}
				transition={{ delay: 2.5, duration: 0.5 }}
				className="mx-4 mb-4 flex items-center justify-center gap-3 rounded-xl border border-[#3B8FE8]/15 bg-[#3B8FE8]/[0.05] px-4 py-2.5"
			>
				<span className="text-[11px] font-semibold text-[#3B8FE8]">↓ 65%</span>
				<span className="text-[10px] text-white/40">reducción promedio de riesgo operacional</span>
			</motion.div>

			{/* Ambient glow */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl"
				style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(59,143,232,0.03) 0%, transparent 70%)" }}
			/>
		</div>
	);
}
