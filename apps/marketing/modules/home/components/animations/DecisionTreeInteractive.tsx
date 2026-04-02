"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

interface DecisionTreeInteractiveProps {
	/** Custom class name */
	className?: string;
	/** Loop interval ms — default 6000 */
	loopMs?: number;
}

const QUESTION = "El proceso de aprobación de pagos supera las 48h en un 60% de los casos. ¿Cuál es la causa raíz?";

const OPTIONS = [
	{
		id: "A",
		label: "Falta de automatización en validaciones",
		color: "#00E5C0",
		outcome: "Implementar workflow automatizado",
		outcomeSeverity: "low",
		score: 87,
	},
	{
		id: "B",
		label: "Aprobadores no disponibles en tiempo real",
		color: "#38BDF8",
		outcome: "Redefinir matriz de autorización",
		outcomeSeverity: "medium",
		score: 73,
	},
	{
		id: "C",
		label: "Documentación incompleta en solicitudes",
		color: "#A78BFA",
		outcome: "Validar checklist en punto de origen",
		outcomeSeverity: "high",
		score: 91,
	},
] as const;

type OptionId = "A" | "B" | "C";

// Phases
const PHASE_QUESTION = 0;
const PHASE_OPTIONS = 1;
const PHASE_SELECTED = 2;
const PHASE_OUTCOME = 3;

/**
 * DecisionTreeInteractive — Harvard-style case simulation UI.
 * Question appears → 3 option branches grow out → one is "selected" → feedback shown.
 * 6-second looping. Supports prefers-reduced-motion.
 */
export function DecisionTreeInteractive({ className, loopMs = 7500 }: DecisionTreeInteractiveProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(containerRef, { once: false, margin: "-80px" });
	const [phase, setPhase] = useState(-1);
	const [selectedOption, setSelectedOption] = useState<OptionId | null>(null);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const prefersReduced =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	function clearTimers() {
		for (const t of timersRef.current) clearTimeout(t);
		timersRef.current = [];
	}

	function push(fn: () => void, delay: number) {
		timersRef.current.push(setTimeout(fn, delay));
	}

	function runSequence() {
		clearTimers();
		setPhase(-1);
		setSelectedOption(null);

		if (prefersReduced) {
			setPhase(PHASE_OUTCOME);
			setSelectedOption("C");
			return;
		}

		push(() => setPhase(PHASE_QUESTION), 200);
		push(() => setPhase(PHASE_OPTIONS), 1400);
		push(() => {
			setPhase(PHASE_SELECTED);
			setSelectedOption("C");
		}, 3200);
		push(() => setPhase(PHASE_OUTCOME), 4000);
		push(() => runSequence(), loopMs);
	}

	useEffect(() => {
		if (isInView) {
			runSequence();
		} else {
			clearTimers();
			setPhase(-1);
			setSelectedOption(null);
		}
		return () => clearTimers();
	}, [isInView]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div
			ref={containerRef}
			className={`relative w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm ${className ?? ""}`}
			aria-hidden="true"
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="size-2 rounded-full bg-[#A78BFA] shadow-[0_0_6px_rgba(167,139,250,0.8)]" />
					<span className="text-xs font-medium text-white/60">Simulación Harvard · Caso #3 de 8</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-[10px] text-white/30">ROL:</span>
					<span className="text-[10px] font-medium text-[#A78BFA]/80">COO</span>
				</div>
			</div>

			<div className="p-4 sm:p-5">
				{/* Progress steps */}
				<div className="mb-4 flex items-center gap-1">
					{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
						<div
							key={n}
							className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
								n <= 3 ? "bg-[#A78BFA]" : n === 4 ? "bg-white/20" : "bg-white/[0.06]"
							}`}
						/>
					))}
				</div>

				{/* Scenario label */}
				<AnimatePresence>
					{phase >= PHASE_QUESTION && (
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4 }}
							className="mb-3"
						>
							<span className="text-[10px] font-semibold uppercase tracking-widest text-[#A78BFA]/70">
								Escenario
							</span>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Question */}
				<AnimatePresence>
					{phase >= PHASE_QUESTION && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
							className="mb-5 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4"
						>
							<p className="text-sm leading-relaxed text-white/85 font-medium">
								{QUESTION}
							</p>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Decision branches — SVG tree + option cards */}
				<AnimatePresence>
					{phase >= PHASE_OPTIONS && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3 }}
							className="space-y-2.5"
						>
							{OPTIONS.map((opt, i) => {
								const isSelected = selectedOption === opt.id;
								const isOther = selectedOption !== null && !isSelected;

								return (
									<motion.div
										key={opt.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{
											opacity: isOther ? 0.4 : 1,
											x: 0,
											scale: isSelected ? 1.01 : 1,
										}}
										transition={{
											duration: 0.45,
											delay: i * 0.1,
											ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
										}}
										className={`relative flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors duration-300 ${
											isSelected
												? `border-[${opt.color}]/50 bg-[${opt.color}]/10`
												: "border-white/[0.06] bg-white/[0.02]"
										}`}
										style={{
											borderColor: isSelected ? `${opt.color}50` : undefined,
											backgroundColor: isSelected ? `${opt.color}12` : undefined,
										}}
									>
										{/* Option letter badge */}
										<div
											className="flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-300"
											style={{
												borderColor: isSelected ? opt.color : "rgba(255,255,255,0.1)",
												backgroundColor: isSelected ? opt.color : "rgba(255,255,255,0.04)",
												color: isSelected ? "#0A1428" : "rgba(255,255,255,0.4)",
											}}
										>
											{opt.id}
										</div>

										<div className="flex-1 min-w-0">
											<p className="text-sm leading-relaxed text-white/75">
												{opt.label}
											</p>

											{/* Outcome reveal */}
											<AnimatePresence>
												{isSelected && phase >= PHASE_OUTCOME && (
													<motion.div
														initial={{ opacity: 0, height: 0 }}
														animate={{ opacity: 1, height: "auto" }}
														exit={{ opacity: 0, height: 0 }}
														transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
														className="overflow-hidden"
													>
														<div className="mt-2.5 flex items-center gap-2">
															<div
																className="size-1.5 rounded-full"
																style={{ backgroundColor: opt.color, boxShadow: `0 0 6px ${opt.color}` }}
															/>
															<p
																className="text-xs font-medium"
																style={{ color: opt.color }}
															>
																→ {opt.outcome}
															</p>
														</div>
														<div className="mt-2 flex items-center gap-2">
															<div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
																<motion.div
																	initial={{ width: "0%" }}
																	animate={{ width: `${opt.score}%` }}
																	transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
																	className="h-full rounded-full"
																	style={{ backgroundColor: opt.color }}
																/>
															</div>
															<span className="text-[10px] font-semibold" style={{ color: opt.color }}>
																{opt.score}%
															</span>
															<span className="text-[10px] text-white/30">confianza</span>
														</div>
													</motion.div>
												)}
											</AnimatePresence>
										</div>

										{/* Selection check */}
										{isSelected && (
											<motion.div
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												transition={{ type: "spring", stiffness: 400, damping: 20 }}
												className="ml-auto shrink-0"
											>
												<div
													className="flex size-5 items-center justify-center rounded-full"
													style={{ backgroundColor: opt.color }}
												>
													<svg width="10" height="8" viewBox="0 0 10 8" fill="none">
														<path d="M1 4L3.5 6.5L9 1" stroke="#0A1428" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
													</svg>
												</div>
											</motion.div>
										)}
									</motion.div>
								);
							})}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Final feedback bar */}
				<AnimatePresence>
					{phase >= PHASE_OUTCOME && (
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.4, delay: 0.3 }}
							className="mt-4 flex items-center justify-between rounded-lg border border-[#A78BFA]/20 bg-[#A78BFA]/8 px-3 py-2.5"
							style={{ backgroundColor: "rgba(167,139,250,0.06)" }}
						>
							<div className="flex items-center gap-2">
								<span className="text-xs font-medium text-[#A78BFA]">Respuesta registrada</span>
								<span className="text-[10px] text-white/30">· Caso 3 de 8</span>
							</div>
							<motion.button
								type="button"
								whileHover={{ scale: 1.04 }}
								whileTap={{ scale: 0.97 }}
								className="rounded-md bg-[#A78BFA]/20 px-3 py-1 text-[10px] font-semibold text-[#A78BFA] hover:bg-[#A78BFA]/30 transition-colors"
							>
								Siguiente →
							</motion.button>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Ambient glow */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl"
				style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(167,139,250,0.06) 0%, transparent 60%)" }}
			/>
		</div>
	);
}
