"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";

interface ProcessDiscoveryFlowProps {
	/** Custom class name */
	className?: string;
	/** Loop duration in ms — default 6000 */
	loopMs?: number;
}

const EXAMPLE_URL = "empresa.com/procesos";

const NODES = [
	{ id: "supplier", x: 60, y: 80, label: "Suppliers", color: "#3B8FE8" },
	{ id: "input", x: 180, y: 80, label: "Inputs", color: "#38BDF8" },
	{ id: "process", x: 300, y: 80, label: "Process", color: "#A78BFA" },
	{ id: "output", x: 420, y: 80, label: "Outputs", color: "#38BDF8" },
	{ id: "customer", x: 540, y: 80, label: "Customers", color: "#3B8FE8" },
] as const;

const CONNECTIONS = [
	{ from: 0, to: 1 },
	{ from: 1, to: 2 },
	{ from: 2, to: 3 },
	{ from: 3, to: 4 },
] as const;

const SUB_NODES = [
	{ x: 60, y: 160, label: "Proveedor A", color: "#3B8FE8" },
	{ x: 60, y: 190, label: "Proveedor B", color: "#3B8FE8" },
	{ x: 300, y: 145, label: "Validar", color: "#A78BFA" },
	{ x: 300, y: 175, label: "Aprobar", color: "#A78BFA" },
	{ x: 300, y: 205, label: "Archivar", color: "#A78BFA" },
	{ x: 540, y: 160, label: "Cliente A", color: "#3B8FE8" },
	{ x: 540, y: 190, label: "Cliente B", color: "#3B8FE8" },
] as const;

// Phase timing (ms)
const PHASES = {
	IDLE: 0,
	TYPING: 800,
	SCANNING: 2000,
	NODES: 3200,
	CONNECTIONS: 4400,
	SUBNODES: 5200,
	COMPLETE: 6200,
};

/**
 * ProcessDiscoveryFlow — URL input → scan animation → SIPOC nodes appear → connections draw.
 * Tier 1 hero-level animation for the Auditora landing page.
 * 6-second looping animation. Supports prefers-reduced-motion.
 */
export function ProcessDiscoveryFlow({ className, loopMs = 7500 }: ProcessDiscoveryFlowProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(containerRef, { once: false, margin: "-80px" });
	const [phase, setPhase] = useState(0);
	const [typedUrl, setTypedUrl] = useState("");
	const [scanPct, setScanPct] = useState(0);
	const controls = useAnimation();
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const prefersReduced =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	function clearTimers() {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (loopRef.current) clearTimeout(loopRef.current);
	}

	function runSequence() {
		if (prefersReduced) {
			setPhase(PHASES.COMPLETE);
			setTypedUrl(EXAMPLE_URL);
			setScanPct(100);
			return;
		}

		// Phase 0: idle → start typing
		setPhase(0);
		setTypedUrl("");
		setScanPct(0);

		// Typing animation
		let charIdx = 0;
		const typingInterval = setInterval(() => {
			charIdx++;
			setTypedUrl(EXAMPLE_URL.slice(0, charIdx));
			if (charIdx >= EXAMPLE_URL.length) {
				clearInterval(typingInterval);
				setPhase(PHASES.TYPING);

				// Scanning
				timerRef.current = setTimeout(() => {
					setPhase(PHASES.SCANNING);
					let pct = 0;
					const scanInterval = setInterval(() => {
						pct = Math.min(pct + 2, 100);
						setScanPct(pct);
						if (pct >= 100) {
							clearInterval(scanInterval);
							setPhase(PHASES.NODES);

							timerRef.current = setTimeout(() => {
								setPhase(PHASES.CONNECTIONS);
								timerRef.current = setTimeout(() => {
									setPhase(PHASES.SUBNODES);
									timerRef.current = setTimeout(() => {
										setPhase(PHASES.COMPLETE);
									}, PHASES.COMPLETE - PHASES.SUBNODES);
								}, PHASES.SUBNODES - PHASES.CONNECTIONS);
							}, PHASES.CONNECTIONS - PHASES.NODES);
						}
					}, 15);
				}, 300);
			}
		}, 65);

		loopRef.current = setTimeout(() => {
			clearInterval(typingInterval);
			runSequence();
		}, loopMs);
	}

	useEffect(() => {
		if (isInView) {
			runSequence();
		} else {
			clearTimers();
			setPhase(0);
			setTypedUrl("");
			setScanPct(0);
		}
		return () => clearTimers();
	}, [isInView]); // eslint-disable-line react-hooks/exhaustive-deps

	const showNodes = phase >= PHASES.NODES;
	const showConnections = phase >= PHASES.CONNECTIONS;
	const showSubNodes = phase >= PHASES.SUBNODES;
	const isComplete = phase >= PHASES.COMPLETE;

	return (
		<div
			ref={containerRef}
			className={`relative w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm ${className ?? ""}`}
			aria-hidden="true"
		>
			{/* Browser chrome top bar */}
			<div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
				<div className="flex gap-1.5">
					<div className="size-2.5 rounded-full bg-white/20" />
					<div className="size-2.5 rounded-full bg-white/20" />
					<div className="size-2.5 rounded-full bg-white/20" />
				</div>
				{/* URL bar with typing animation */}
				<div className="mx-3 flex flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-1.5">
					<div className="size-3 rounded-full border border-[#3B8FE8]/50 bg-[#3B8FE8]/10" />
					<span className="font-mono text-xs text-white/70 tracking-wide">
						{typedUrl}
						<AnimatePresence>
							{phase < PHASES.SCANNING && (
								<motion.span
									initial={{ opacity: 1 }}
									animate={{ opacity: [1, 0, 1] }}
									transition={{ duration: 0.8, repeat: Infinity }}
									className="inline-block w-[2px] h-3 bg-[#3B8FE8] ml-0.5 align-middle"
								/>
							)}
						</AnimatePresence>
					</span>
					{phase >= PHASES.SCANNING && (
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="ml-auto text-[10px] font-medium text-[#3B8FE8]"
						>
							Analizando…
						</motion.span>
					)}
					{isComplete && (
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="ml-auto text-[10px] font-medium text-[#3B8FE8]"
						>
							✓ SIPOC generado
						</motion.span>
					)}
				</div>
			</div>

			{/* Scan progress bar */}
			<AnimatePresence>
				{phase >= PHASES.TYPING && phase < PHASES.NODES && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="relative overflow-hidden bg-white/[0.02] px-6 py-4"
					>
						<div className="mb-2 flex items-center justify-between">
							<span className="text-[11px] font-medium uppercase tracking-widest text-[#3B8FE8]/70">
								Escaneando procesos
							</span>
							<span className="font-mono text-xs text-white/40">{scanPct}%</span>
						</div>
						<div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
							<motion.div
								style={{ width: `${scanPct}%` }}
								className="h-full rounded-full bg-gradient-to-r from-[#3B8FE8] to-[#38BDF8]"
							/>
						</div>
						{/* Scan lines effect */}
						<div className="mt-3 space-y-1.5">
							{[0.4, 0.6, 0.3, 0.5].map((opacity, i) => (
								<motion.div
									key={i}
									initial={{ width: "0%", opacity: 0 }}
									animate={{
										width: `${[72, 55, 88, 40][i]}%`,
										opacity: opacity,
									}}
									transition={{ duration: 0.6, delay: i * 0.15 }}
									className="h-1.5 rounded bg-white/20"
								/>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* SIPOC Diagram */}
			<AnimatePresence>
				{showNodes && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="px-4 pt-3 pb-4"
					>
						<div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3B8FE8]/60">
							SIPOC — Mapa de Proceso
						</div>
						<svg
							viewBox="0 0 600 240"
							className="h-auto w-full"
							fill="none"
						>
							{/* Connection lines */}
							{CONNECTIONS.map(({ from, to }, i) => (
								<motion.line
									key={`conn-${i}`}
									x1={NODES[from].x + 44}
									y1={NODES[from].y}
									x2={NODES[to].x - 44}
									y2={NODES[to].y}
									stroke={NODES[from].color}
									strokeWidth={1.5}
									strokeOpacity={0.5}
									initial={{ pathLength: 0, opacity: 0 }}
									animate={
										showConnections
											? { pathLength: 1, opacity: 1 }
											: { pathLength: 0, opacity: 0 }
									}
									transition={{
										duration: 0.5,
										delay: showConnections ? i * 0.12 : 0,
										ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
									}}
								/>
							))}

							{/* Arrowheads */}
							{showConnections &&
								CONNECTIONS.map(({ from, to }, i) => (
									<motion.polygon
										key={`arrow-${i}`}
										points={`${NODES[to].x - 44},${NODES[to].y - 5} ${NODES[to].x - 44},${NODES[to].y + 5} ${NODES[to].x - 36},${NODES[to].y}`}
										fill={NODES[from].color}
										fillOpacity={0.6}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.5 + i * 0.12 }}
									/>
								))}

							{/* Main SIPOC nodes */}
							{NODES.map((node, i) => (
								<motion.g key={node.id}>
									{/* Node box */}
									<motion.rect
										x={node.x - 44}
										y={node.y - 22}
										width={88}
										height={44}
										rx={8}
										stroke={node.color}
										strokeWidth={1.5}
										fill={`${node.color}15`}
										initial={{ scale: 0, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										style={{ transformOrigin: `${node.x}px ${node.y}px` }}
										transition={{
											type: "spring",
											stiffness: 300,
											damping: 22,
											delay: i * 0.1,
										}}
									/>
									{/* Node label */}
									<motion.text
										x={node.x}
										y={node.y + 4}
										textAnchor="middle"
										fill={node.color}
										fontSize="9"
										fontWeight="600"
										fontFamily="system-ui, sans-serif"
										letterSpacing="0.5"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.2 + i * 0.1 }}
									>
										{node.label}
									</motion.text>
								</motion.g>
							))}

							{/* Sub-nodes */}
							{showSubNodes &&
								SUB_NODES.map((sub, i) => (
									<motion.g key={`sub-${i}`}>
										<motion.rect
											x={sub.x - 48}
											y={sub.y - 10}
											width={96}
											height={20}
											rx={4}
											stroke={sub.color}
											strokeWidth={1}
											fill={`${sub.color}08`}
											strokeOpacity={0.4}
											initial={{ opacity: 0, scaleX: 0 }}
											animate={{ opacity: 1, scaleX: 1 }}
											style={{ transformOrigin: `${sub.x}px ${sub.y}px` }}
											transition={{
												duration: 0.35,
												delay: i * 0.07,
												ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
											}}
										/>
										<motion.text
											x={sub.x}
											y={sub.y + 4}
											textAnchor="middle"
											fill={sub.color}
											fontSize="7"
											fontFamily="system-ui, sans-serif"
											opacity={0.7}
											initial={{ opacity: 0 }}
											animate={{ opacity: 0.7 }}
											transition={{ delay: 0.2 + i * 0.07 }}
										>
											{sub.label}
										</motion.text>
									</motion.g>
								))}
						</svg>

						{/* Complete badge */}
						<AnimatePresence>
							{isComplete && (
								<motion.div
									initial={{ opacity: 0, y: 8, scale: 0.95 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0 }}
									transition={{ type: "spring", stiffness: 400, damping: 25 }}
									className="mt-2 flex items-center gap-2 rounded-lg border border-[#3B8FE8]/20 bg-[#3B8FE8]/10 px-3 py-2"
								>
									<div className="size-1.5 rounded-full bg-[#3B8FE8] shadow-[0_0_6px_rgba(59,143,232,0.8)]" />
									<span className="text-[11px] font-medium text-[#3B8FE8]">
										5 áreas identificadas · 3 riesgos detectados · SIPOC listo
									</span>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Glow overlay */}
			<div className="pointer-events-none absolute inset-0 rounded-2xl" style={{
				background: "radial-gradient(ellipse at 50% 0%, rgba(59,143,232,0.04) 0%, transparent 60%)",
			}} />
		</div>
	);
}
