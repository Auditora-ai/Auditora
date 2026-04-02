"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

interface BpmnRealTimeBuilderProps {
	/** Custom class name */
	className?: string;
	/** Loop interval ms — default 7000 */
	loopMs?: number;
}

// BPMN elements in build order
const BPMN_ELEMENTS = [
	// Swim lane header
	{ type: "lane", id: "lane1", x: 20, y: 20, w: 560, h: 40, label: "Dirección General" },
	{ type: "lane", id: "lane2", x: 20, y: 70, w: 560, h: 80, label: "Operaciones" },
	{ type: "lane", id: "lane3", x: 20, y: 158, w: 560, h: 80, label: "Control de Calidad" },

	// Events and tasks
	{ type: "event-start", id: "start", x: 70, y: 110, r: 14 },
	{ type: "task", id: "t1", x: 150, y: 92, w: 80, h: 36, label: "Capturar\nProceso" },
	{ type: "gateway", id: "gw1", x: 270, y: 98, size: 24, label: "¿Completo?" },
	{ type: "task", id: "t2", x: 340, y: 92, w: 80, h: 36, label: "Generar\nBPMN" },
	{ type: "task", id: "t3", x: 270, y: 178, w: 80, h: 36, label: "Completar\nInfo" },
	{ type: "task", id: "t4", x: 440, y: 92, w: 80, h: 36, label: "Validar\nRiesgos" },
	{ type: "event-end", id: "end", x: 550, y: 110, r: 14 },

	// Connections (drawn after nodes)
	{ type: "conn", id: "c1", x1: 84, y1: 110, x2: 150, y2: 110 },
	{ type: "conn", id: "c2", x1: 230, y1: 110, x2: 270, y2: 110 },
	{ type: "conn-branch-yes", id: "c3", x1: 294, y1: 110, x2: 340, y2: 110, label: "Sí" },
	{ type: "conn-branch-no", id: "c4", x1: 270, y1: 122, x2: 270, y2: 178, label: "No" },
	{ type: "conn", id: "c5", x1: 420, y1: 110, x2: 440, y2: 110 },
	{ type: "conn", id: "c6", x1: 350, y1: 178, x2: 420, y2: 178, label: "" },
	{ type: "conn-return", id: "c7", x1: 420, y1: 178, x2: 475, y2: 178 },
	{ type: "conn", id: "c8", x1: 520, y1: 110, x2: 536, y2: 110 },
] as const;

// Build order: phases of what appears when
const BUILD_PHASES = [
	[0, 1, 2],         // Phase 0: lanes
	[3],               // Phase 1: start event
	[4],               // Phase 2: task 1
	[5],               // Phase 3: gateway
	[9, 10],           // Phase 4: connections 1-2
	[6],               // Phase 5: task 2
	[11, 12],          // Phase 6: connections gateway
	[7],               // Phase 7: task 3 (no branch)
	[13],              // Phase 8: connection no-branch
	[8],               // Phase 9: task 4
	[14],              // Phase 10: connection task2→task4
	[9],               // skip — reuse index for conn5
	[16],              // Phase 11: connection to end
	[17],              // Phase 12: conn c8
];

const PHASE_DELAYS = [0, 600, 1100, 1600, 2000, 2500, 2900, 3400, 3800, 4300, 4800, 5200, 5600, 6000];

/**
 * BpmnRealTimeBuilder — BPMN 2.0 diagram construction animation.
 * Swim lanes form, then nodes slide in, then connections draw with pathLength.
 * 7-second looping. Supports prefers-reduced-motion.
 */
export function BpmnRealTimeBuilder({ className, loopMs = 8000 }: BpmnRealTimeBuilderProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(containerRef, { once: false, margin: "-80px" });
	const [visibleCount, setVisibleCount] = useState(0);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const prefersReduced =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	function clearAllTimers() {
		for (const t of timersRef.current) clearTimeout(t);
		timersRef.current = [];
	}

	function runSequence() {
		clearAllTimers();
		setVisibleCount(0);

		if (prefersReduced) {
			setVisibleCount(BPMN_ELEMENTS.length);
			return;
		}

		// Reveal elements one by one with staged delays
		for (let i = 0; i < BPMN_ELEMENTS.length; i++) {
			const t = setTimeout(() => setVisibleCount((c) => Math.max(c, i + 1)), i * 380 + 200);
			timersRef.current.push(t);
		}

		// Loop
		const loopT = setTimeout(runSequence, loopMs);
		timersRef.current.push(loopT);
	}

	useEffect(() => {
		if (isInView) {
			runSequence();
		} else {
			clearAllTimers();
			setVisibleCount(0);
		}
		return () => clearAllTimers();
	}, [isInView]); // eslint-disable-line react-hooks/exhaustive-deps

	const visible = (idx: number) => idx < visibleCount;

	return (
		<div
			ref={containerRef}
			className={`relative w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm ${className ?? ""}`}
			aria-hidden="true"
		>
			{/* Header bar */}
			<div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="size-2 rounded-full bg-[#00E5C0] shadow-[0_0_6px_rgba(0,229,192,0.8)]" />
					<span className="text-xs font-medium text-white/60">Generando diagrama BPMN 2.0…</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-[10px] text-white/30">ISO 19510</span>
					<div className="h-3.5 w-px bg-white/10" />
					<span className="text-[10px] text-[#00E5C0]/70">Auto-generando</span>
				</div>
			</div>

			{/* SVG Canvas */}
			<div className="px-3 py-3">
				<svg viewBox="0 0 600 260" className="h-auto w-full" fill="none">
					{/* Swim lanes */}
					{[0, 1, 2].map((idx) => {
						const el = BPMN_ELEMENTS[idx];
						if (el.type !== "lane") return null;
						return (
							<motion.g key={el.id}>
								<motion.rect
									x={el.x}
									y={el.y}
									width={el.w}
									height={el.h}
									rx={4}
									stroke="rgba(255,255,255,0.06)"
									strokeWidth={1}
									fill={idx === 0 ? "rgba(0,229,192,0.03)" : "rgba(255,255,255,0.015)"}
									initial={{ opacity: 0, scaleX: 0 }}
									animate={visible(idx) ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
									style={{ transformOrigin: `${el.x}px ${el.y + el.h / 2}px` }}
									transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
								/>
								<motion.text
									x={el.x + 8}
									y={el.y + el.h / 2 + 4}
									fill="rgba(255,255,255,0.25)"
									fontSize="7"
									fontWeight="500"
									fontFamily="system-ui, sans-serif"
									letterSpacing="0.8"
									initial={{ opacity: 0 }}
									animate={visible(idx) ? { opacity: 1 } : { opacity: 0 }}
									transition={{ delay: 0.3 }}
								>
									{el.label}
								</motion.text>
							</motion.g>
						);
					})}

					{/* Start event */}
					{visible(3) && (
						<motion.g>
							<motion.circle
								cx={BPMN_ELEMENTS[3].x}
								cy={BPMN_ELEMENTS[3].y}
								r={BPMN_ELEMENTS[3].r}
								stroke="#00E5C0"
								strokeWidth={2}
								fill="rgba(0,229,192,0.12)"
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								style={{ transformOrigin: `${BPMN_ELEMENTS[3].x}px ${BPMN_ELEMENTS[3].y}px` }}
								transition={{ type: "spring", stiffness: 350, damping: 20 }}
							/>
							<motion.text
								x={BPMN_ELEMENTS[3].x}
								y={BPMN_ELEMENTS[3].y + 24}
								textAnchor="middle"
								fill="rgba(0,229,192,0.6)"
								fontSize="6"
								fontFamily="system-ui"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.3 }}
							>
								Start
							</motion.text>
						</motion.g>
					)}

					{/* Task boxes */}
					{([4, 6, 7, 8] as const).map((elIdx) => {
						const el = BPMN_ELEMENTS[elIdx];
						if (el.type !== "task") return null;
						const lines = el.label.split("\n");
						return (
							<motion.g key={el.id}>
								<motion.rect
									x={el.x}
									y={el.y}
									width={el.w}
									height={el.h}
									rx={6}
									stroke="#38BDF8"
									strokeWidth={1.5}
									fill="rgba(56,189,248,0.08)"
									initial={{ opacity: 0, y: el.y + 10, scale: 0.9 }}
									animate={
										visible(elIdx)
											? { opacity: 1, y: el.y, scale: 1 }
											: { opacity: 0, y: el.y + 10, scale: 0.9 }
									}
									transition={{ type: "spring", stiffness: 280, damping: 22 }}
								/>
								{lines.map((line, li) => (
									<motion.text
										key={li}
										x={el.x + el.w / 2}
										y={el.y + el.h / 2 + (li - (lines.length - 1) / 2) * 9 + 3}
										textAnchor="middle"
										fill="rgba(56,189,248,0.9)"
										fontSize="7"
										fontFamily="system-ui"
										fontWeight="500"
										initial={{ opacity: 0 }}
										animate={visible(elIdx) ? { opacity: 1 } : { opacity: 0 }}
										transition={{ delay: 0.25 + li * 0.05 }}
									>
										{line}
									</motion.text>
								))}
							</motion.g>
						);
					})}

					{/* Gateway diamond */}
					{visible(5) && (() => {
						const el = BPMN_ELEMENTS[5];
						const { x, y, size } = el as { type: string; id: string; x: number; y: number; size: number; label: string };
						const pts = `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`;
						return (
							<motion.g>
								<motion.polygon
									points={pts}
									stroke="#A78BFA"
									strokeWidth={1.5}
									fill="rgba(167,139,250,0.08)"
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									style={{ transformOrigin: `${x}px ${y}px` }}
									transition={{ type: "spring", stiffness: 320, damping: 20 }}
								/>
								<motion.text
									x={x}
									y={y + 4}
									textAnchor="middle"
									fill="rgba(167,139,250,0.8)"
									fontSize="6"
									fontFamily="system-ui"
									fontWeight="600"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.2 }}
								>
									XOR
								</motion.text>
								<motion.text
									x={x}
									y={y + 32}
									textAnchor="middle"
									fill="rgba(167,139,250,0.5)"
									fontSize="6"
									fontFamily="system-ui"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.3 }}
								>
									{el.label}
								</motion.text>
							</motion.g>
						);
					})()}

					{/* End event */}
					{visible(9) && (
						<motion.g>
							<motion.circle
								cx={BPMN_ELEMENTS[9].x}
								cy={BPMN_ELEMENTS[9].y}
								r={BPMN_ELEMENTS[9].r}
								stroke="#00E5C0"
								strokeWidth={3}
								fill="rgba(0,229,192,0.12)"
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								style={{ transformOrigin: `${BPMN_ELEMENTS[9].x}px ${BPMN_ELEMENTS[9].y}px` }}
								transition={{ type: "spring", stiffness: 350, damping: 20 }}
							/>
							<motion.text
								x={BPMN_ELEMENTS[9].x}
								y={BPMN_ELEMENTS[9].y + 24}
								textAnchor="middle"
								fill="rgba(0,229,192,0.6)"
								fontSize="6"
								fontFamily="system-ui"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.3 }}
							>
								End
							</motion.text>
						</motion.g>
					)}

					{/* Connections — drawn as animated paths */}
					{visible(10) && (
						<motion.line
							x1={84} y1={110} x2={150} y2={110}
							stroke="rgba(0,229,192,0.4)" strokeWidth={1.5}
							strokeDasharray="1 0"
							initial={{ pathLength: 0 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						/>
					)}
					{visible(11) && (
						<motion.line
							x1={230} y1={110} x2={270} y2={110}
							stroke="rgba(0,229,192,0.4)" strokeWidth={1.5}
							initial={{ pathLength: 0 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: 0.3 }}
						/>
					)}
					{visible(12) && (
						<>
							<motion.line
								x1={294} y1={110} x2={340} y2={110}
								stroke="rgba(167,139,250,0.5)" strokeWidth={1.5}
								initial={{ pathLength: 0 }}
								animate={{ pathLength: 1 }}
								transition={{ duration: 0.35 }}
							/>
							<motion.text x={307} y={106} fill="rgba(167,139,250,0.7)" fontSize="7" fontFamily="system-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>Sí</motion.text>
						</>
					)}
					{visible(13) && (
						<>
							<motion.line
								x1={270} y1={122} x2={270} y2={178}
								stroke="rgba(167,139,250,0.5)" strokeWidth={1.5}
								initial={{ pathLength: 0 }}
								animate={{ pathLength: 1 }}
								transition={{ duration: 0.4 }}
							/>
							<motion.text x={275} y={155} fill="rgba(167,139,250,0.7)" fontSize="7" fontFamily="system-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>No</motion.text>
						</>
					)}
					{visible(14) && (
						<motion.line
							x1={420} y1={110} x2={440} y2={110}
							stroke="rgba(56,189,248,0.4)" strokeWidth={1.5}
							initial={{ pathLength: 0 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: 0.3 }}
						/>
					)}
					{/* Return path from task3 back up to gateway */}
					{visible(15) && (
						<motion.path
							d="M310 196 Q380 218 380 110 L420 110"
							stroke="rgba(167,139,250,0.3)" strokeWidth={1} strokeDasharray="3 3"
							fill="none"
							initial={{ pathLength: 0 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: 0.8 }}
						/>
					)}
					{visible(16) && (
						<motion.line
							x1={520} y1={110} x2={536} y2={110}
							stroke="rgba(0,229,192,0.4)" strokeWidth={1.5}
							initial={{ pathLength: 0 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: 0.3 }}
						/>
					)}
				</svg>
			</div>

			{/* Status footer */}
			<div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-4 py-2.5">
				<div className="flex items-center gap-3">
					<span className="text-[10px] text-white/30">Elementos: {visibleCount} / {BPMN_ELEMENTS.length}</span>
					<span className="text-[10px] text-white/20">·</span>
					<span className="text-[10px] text-white/30">Conforme ISO 19510</span>
				</div>
				<AnimatePresence>
					{visibleCount >= BPMN_ELEMENTS.length && (
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0 }}
							className="flex items-center gap-1.5 rounded-full bg-[#00E5C0]/10 px-2.5 py-0.5"
						>
							<div className="size-1.5 rounded-full bg-[#00E5C0]" />
							<span className="text-[10px] font-medium text-[#00E5C0]">Diagrama completo</span>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Ambient glow */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl"
				style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(56,189,248,0.04) 0%, transparent 60%)" }}
			/>
		</div>
	);
}
