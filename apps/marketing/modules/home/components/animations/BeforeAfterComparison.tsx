"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

interface BeforeAfterComparisonProps {
	className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Before: chaotic state — scattered, manual, broken
const BEFORE_ITEMS = [
	{ id: "b1", label: "Word doc v3_FINAL_2.docx", icon: "📄", x: 18, y: 14, w: 42, color: "#EF4444", delay: 0.1 },
	{ id: "b2", label: "Proceso_antiguo.xlsx", icon: "📊", x: 62, y: 8, w: 36, color: "#F59E0B", delay: 0.2 },
	{ id: "b3", label: "Sin dueño asignado", icon: "⚠️", x: 8, y: 44, w: 38, color: "#EF4444", delay: 0.3 },
	{ id: "b4", label: "Proceso sin mapear", icon: "❌", x: 54, y: 38, w: 40, color: "#EF4444", delay: 0.15 },
	{ id: "b5", label: "Email: 'Reunión urgente'", icon: "📧", x: 22, y: 68, w: 44, color: "#F59E0B", delay: 0.25 },
	{ id: "b6", label: "Riesgo desconocido", icon: "🔴", x: 62, y: 62, w: 36, color: "#EF4444", delay: 0.35 },
] as const;

// After: structured, clean, automated
const AFTER_ITEMS = [
	{ id: "a1", label: "SIPOC Generado", icon: "✅", x: 8, y: 10, w: 38, color: "#3B8FE8", delay: 0.1 },
	{ id: "a2", label: "BPMN 2.0 Validado", icon: "🗺️", x: 54, y: 6, w: 40, color: "#38BDF8", delay: 0.2 },
	{ id: "a3", label: "Dueño: Ana García", icon: "👤", x: 10, y: 42, w: 36, color: "#3B8FE8", delay: 0.3 },
	{ id: "a4", label: "FMEA: RPN 24", icon: "📋", x: 52, y: 38, w: 40, color: "#A78BFA", delay: 0.15 },
	{ id: "a5", label: "SOP Documentado", icon: "📝", x: 14, y: 68, w: 38, color: "#3B8FE8", delay: 0.25 },
	{ id: "a6", label: "Riesgo: Controlado", icon: "🟢", x: 56, y: 64, w: 40, color: "#3B8FE8", delay: 0.35 },
] as const;

function PanelCard({
	label,
	icon,
	x,
	y,
	w,
	color,
	delay,
	visible,
}: {
	label: string;
	icon: string;
	x: number;
	y: number;
	w: number;
	color: string;
	delay: number;
	visible: boolean;
}) {
	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0, scale: 0.85, y: 6 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.85, y: -4 }}
					transition={{ duration: 0.4, delay, ease: EASE }}
					className="absolute flex items-center gap-1.5 rounded-lg border px-2 py-1.5 backdrop-blur-sm"
					style={{
						left: `${x}%`,
						top: `${y}%`,
						width: `${w}%`,
						borderColor: `${color}30`,
						backgroundColor: `${color}10`,
					}}
				>
					<span className="text-[10px] shrink-0">{icon}</span>
					<span className="text-[9px] font-medium leading-tight truncate" style={{ color }}>
						{label}
					</span>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export function BeforeAfterComparison({ className }: BeforeAfterComparisonProps) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-80px" });
	const [phase, setPhase] = useState<"before" | "transitioning" | "after">("before");
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
	}, []);

	useEffect(() => {
		if (!isInView) return;

		// Cycle: show before → transition → show after → loop
		const cycle = () => {
			setPhase("before");
			const t1 = setTimeout(() => setPhase("transitioning"), 2800);
			const t2 = setTimeout(() => setPhase("after"), 3400);
			const t3 = setTimeout(() => cycle(), 8000);
			return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
		};

		const cleanup = cycle();
		return cleanup;
	}, [isInView]);

	const showBefore = phase === "before" || phase === "transitioning";
	const showAfter = phase === "after";

	// Reduced motion: always show after state
	if (reducedMotion) {
		return (
			<div ref={ref} className={`relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden ${className ?? ""}`}>
				<div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
					<div className="relative h-44 rounded-xl bg-red-500/5 border border-red-500/20 p-2">
						<p className="text-xs text-red-400 font-semibold mb-1 text-center">Sin Auditora</p>
						{BEFORE_ITEMS.map(item => (
							<div key={item.id} className="absolute flex items-center gap-1 rounded px-1.5 py-1" style={{ left: `${item.x}%`, top: `${item.y + 12}%`, borderColor: `${item.color}30`, backgroundColor: `${item.color}10`, border: "1px solid" }}>
								<span className="text-[8px]">{item.icon}</span>
								<span className="text-[7px] truncate" style={{ color: item.color }}>{item.label}</span>
							</div>
						))}
					</div>
					<div className="relative h-44 rounded-xl bg-[#3B8FE8]/5 border border-[#3B8FE8]/20 p-2">
						<p className="text-xs text-[#3B8FE8] font-semibold mb-1 text-center">Con Auditora</p>
						{AFTER_ITEMS.map(item => (
							<div key={item.id} className="absolute flex items-center gap-1 rounded px-1.5 py-1" style={{ left: `${item.x}%`, top: `${item.y + 12}%`, borderColor: `${item.color}30`, backgroundColor: `${item.color}10`, border: "1px solid" }}>
								<span className="text-[8px]">{item.icon}</span>
								<span className="text-[7px] truncate" style={{ color: item.color }}>{item.label}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div ref={ref} className={`relative w-full max-w-2xl mx-auto ${className ?? ""}`}>
			{/* Panel container */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4">
				{/* BEFORE panel */}
				<motion.div
					className="relative overflow-hidden rounded-xl border bg-white/[0.03] backdrop-blur-sm"
					animate={{
						borderColor: showBefore ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.08)",
						boxShadow: showBefore ? "0 0 20px rgba(239,68,68,0.08)" : "none",
					}}
					transition={{ duration: 0.6, ease: EASE }}
					style={{ minHeight: "200px" }}
				>
					{/* Header */}
					<div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
						<motion.div
							className="size-2 rounded-full"
							animate={{ backgroundColor: showBefore ? "#EF4444" : "rgba(239,68,68,0.3)" }}
							transition={{ duration: 0.4 }}
						/>
						<span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
							Sin Auditora
						</span>
					</div>

					{/* Content area */}
					<div className="relative h-44 p-2">
						{BEFORE_ITEMS.map(item => (
							<PanelCard
								key={item.id}
								{...item}
								visible={showBefore}
							/>
						))}

						{/* Chaos overlay */}
						<AnimatePresence>
							{showBefore && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.5 }}
									className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(239,68,68,0.04),transparent)]"
								/>
							)}
						</AnimatePresence>
					</div>

					{/* Bottom metric */}
					<div className="px-3 pb-3">
						<div className="rounded-lg bg-red-500/10 px-3 py-2 border border-red-500/20">
							<span className="text-[10px] text-red-400 font-medium">73% procesos sin seguimiento</span>
						</div>
					</div>
				</motion.div>

				{/* AFTER panel */}
				<motion.div
					className="relative overflow-hidden rounded-xl border bg-white/[0.03] backdrop-blur-sm"
					animate={{
						borderColor: showAfter ? "rgba(59,143,232,0.35)" : "rgba(59,143,232,0.08)",
						boxShadow: showAfter ? "0 0 24px rgba(59,143,232,0.1)" : "none",
					}}
					transition={{ duration: 0.6, ease: EASE }}
					style={{ minHeight: "200px" }}
				>
					{/* Header */}
					<div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
						<motion.div
							className="size-2 rounded-full"
							animate={{ backgroundColor: showAfter ? "#3B8FE8" : "rgba(59,143,232,0.3)" }}
							transition={{ duration: 0.4 }}
						/>
						<span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
							Con Auditora
						</span>
					</div>

					{/* Content area */}
					<div className="relative h-44 p-2">
						{AFTER_ITEMS.map(item => (
							<PanelCard
								key={item.id}
								{...item}
								visible={showAfter}
							/>
						))}

						{/* Glow overlay */}
						<AnimatePresence>
							{showAfter && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.5 }}
									className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(59,143,232,0.05),transparent)]"
								/>
							)}
						</AnimatePresence>
					</div>

					{/* Bottom metric */}
					<div className="px-3 pb-3">
						<div className="rounded-lg bg-[#3B8FE8]/10 px-3 py-2 border border-[#3B8FE8]/20">
							<span className="text-[10px] text-[#3B8FE8] font-medium">100% trazabilidad en tiempo real</span>
						</div>
					</div>
				</motion.div>
			</div>

			{/* Center transition arrow */}
			<AnimatePresence>
				{phase === "transitioning" && (
					<motion.div
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.5 }}
						transition={{ duration: 0.3, ease: EASE }}
						className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
					>
						<div className="flex items-center justify-center size-10 rounded-full bg-[#3B8FE8] shadow-lg shadow-[#3B8FE8]/30">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M3 8h10M9 4l4 4-4 4" stroke="#0A1428" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Phase indicator dots */}
			<div className="flex items-center justify-center gap-2 mt-4">
				{(["before", "after"] as const).map(p => (
					<motion.div
						key={p}
						className="rounded-full"
						animate={{
							width: (phase === p || (phase === "transitioning" && p === "before")) ? 20 : 6,
							height: 6,
							backgroundColor:
								p === "before"
									? (showBefore ? "#EF4444" : "rgba(255,255,255,0.15)")
									: (showAfter ? "#3B8FE8" : "rgba(255,255,255,0.15)"),
						}}
						transition={{ duration: 0.35, ease: EASE }}
					/>
				))}
			</div>
		</div>
	);
}
