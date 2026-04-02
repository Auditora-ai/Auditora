"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

interface SopGenerationProps {
	/** Custom class name */
	className?: string;
	/** Loop interval ms — default 5000 */
	loopMs?: number;
}

const SOP_LINES = [
	{ text: "# SOP-2024-047: Proceso de Aprobación de Pagos", type: "h1" as const },
	{ text: "**Versión:** 2.1  ·  **Vigencia:** Enero 2025", type: "meta" as const },
	{ text: "", type: "spacer" as const },
	{ text: "## 1. Objetivo", type: "h2" as const },
	{ text: "Estandarizar el flujo de aprobación para pagos ≥ $5,000 USD garantizando...", type: "body" as const },
	{ text: "", type: "spacer" as const },
	{ text: "## 2. Alcance", type: "h2" as const },
	{ text: "• Dirección de Finanzas · Tesorería · Contraloría", type: "body" as const },
	{ text: "", type: "spacer" as const },
	{ text: "## 3. Procedimiento", type: "h2" as const },
	{ text: "**Paso 1:** Solicitante completa formulario F-047 en sistema ERP", type: "step" as const },
	{ text: "**Paso 2:** Jefe inmediato valida en ≤ 24h con firma digital", type: "step" as const },
	{ text: "**Paso 3:** CFO aprueba montos > $50,000 USD automáticamente", type: "step" as const },
	{ text: "", type: "spacer" as const },
	{ text: "## 4. Controles de Riesgo", type: "h2" as const },
	{ text: "⚠ Límite por usuario: $25,000 USD · Segregación de funciones activa", type: "warning" as const },
] as const;

const LINE_DELAY_MS = 180;

/**
 * SopGeneration — AI typewriter SOP generation animation.
 * Document icon fades in, then text lines appear with typewriter stagger.
 * 5-second loop. Supports prefers-reduced-motion.
 */
export function SopGeneration({ className, loopMs = 6000 }: SopGenerationProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(containerRef, { once: false, margin: "-80px" });
	const [visibleLines, setVisibleLines] = useState(0);
	const [showHeader, setShowHeader] = useState(false);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const prefersReduced =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	function clearTimers() {
		for (const t of timersRef.current) clearTimeout(t);
		timersRef.current = [];
	}

	function runSequence() {
		clearTimers();
		setVisibleLines(0);
		setShowHeader(false);

		if (prefersReduced) {
			setShowHeader(true);
			setVisibleLines(SOP_LINES.length);
			return;
		}

		timersRef.current.push(setTimeout(() => setShowHeader(true), 300));

		for (let i = 0; i < SOP_LINES.length; i++) {
			const delay = 700 + i * LINE_DELAY_MS;
			timersRef.current.push(
				setTimeout(() => setVisibleLines((c) => Math.max(c, i + 1)), delay)
			);
		}

		timersRef.current.push(setTimeout(runSequence, loopMs));
	}

	useEffect(() => {
		if (isInView) {
			runSequence();
		} else {
			clearTimers();
			setVisibleLines(0);
			setShowHeader(false);
		}
		return () => clearTimers();
	}, [isInView]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div
			ref={containerRef}
			className={`relative w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm ${className ?? ""}`}
			aria-hidden="true"
		>
			{/* Header bar */}
			<div className="flex items-center gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
				<div className="flex items-center gap-1.5">
					<div className="size-2.5 rounded-full bg-white/20" />
					<div className="size-2.5 rounded-full bg-white/20" />
					<div className="size-2.5 rounded-full bg-white/20" />
				</div>
				<div className="flex flex-1 items-center gap-2">
					{/* Document icon */}
					<AnimatePresence>
						{showHeader && (
							<motion.div
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ type: "spring", stiffness: 350, damping: 22 }}
								className="flex size-6 items-center justify-center rounded-md bg-[#00E5C0]/15 border border-[#00E5C0]/25"
							>
								<svg width="12" height="14" viewBox="0 0 12 14" fill="none">
									<rect x="1" y="1" width="10" height="12" rx="1.5" stroke="#00E5C0" strokeWidth="1.2" />
									<line x1="3" y1="4.5" x2="9" y2="4.5" stroke="#00E5C0" strokeWidth="1" strokeOpacity="0.6" />
									<line x1="3" y1="7" x2="9" y2="7" stroke="#00E5C0" strokeWidth="1" strokeOpacity="0.6" />
									<line x1="3" y1="9.5" x2="6.5" y2="9.5" stroke="#00E5C0" strokeWidth="1" strokeOpacity="0.6" />
								</svg>
							</motion.div>
						)}
					</AnimatePresence>
					<span className="text-[11px] font-medium text-white/50">
						{showHeader ? "SOP-2024-047.md" : "Generando documento…"}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					{showHeader && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex items-center gap-1 rounded-full bg-[#00E5C0]/10 px-2 py-0.5"
						>
							<div className="size-1 rounded-full bg-[#00E5C0]" />
							<span className="text-[9px] font-medium text-[#00E5C0]">IA</span>
						</motion.div>
					)}
				</div>
			</div>

			{/* Document content */}
			<div className="px-5 py-4 font-mono text-[11px] leading-relaxed space-y-0.5 min-h-[200px]">
				{SOP_LINES.slice(0, visibleLines).map((line, i) => {
					if (line.type === "spacer") return <div key={i} className="h-2" />;

					const colorMap = {
						h1: "text-white font-bold text-[13px]",
						h2: "text-[#00E5C0] font-semibold text-[11px] mt-2",
						meta: "text-white/30 text-[10px]",
						body: "text-white/55",
						step: "text-white/65 pl-2",
						warning: "text-amber-400/80 pl-1",
					} as const;

					return (
						<motion.div
							key={i}
							initial={{ opacity: 0, x: -6 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								duration: 0.3,
								ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
							}}
							className={colorMap[line.type]}
						>
							{line.text}
							{/* Cursor on last line while typing */}
							{i === visibleLines - 1 && visibleLines < SOP_LINES.length && (
								<motion.span
									animate={{ opacity: [1, 0, 1] }}
									transition={{ duration: 0.7, repeat: Infinity }}
									className="inline-block w-[6px] h-[11px] bg-[#00E5C0]/70 ml-0.5 align-middle"
								/>
							)}
						</motion.div>
					);
				})}

				{/* Cursor when idle before start */}
				{visibleLines === 0 && showHeader && (
					<motion.div
						animate={{ opacity: [1, 0, 1] }}
						transition={{ duration: 0.7, repeat: Infinity }}
						className="inline-block w-[6px] h-[13px] bg-[#00E5C0]/70 align-middle"
					/>
				)}
			</div>

			{/* Footer status */}
			<div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-4 py-2.5">
				<span className="text-[10px] text-white/25">
					{visibleLines} / {SOP_LINES.length} secciones generadas
				</span>
				{visibleLines >= SOP_LINES.length && (
					<motion.span
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-[10px] font-medium text-[#00E5C0]"
					>
						✓ Listo para revisión
					</motion.span>
				)}
			</div>

			{/* Ambient glow */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl"
				style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(0,229,192,0.04) 0%, transparent 60%)" }}
			/>
		</div>
	);
}
