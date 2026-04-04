"use client";

import { useId, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * High-impact hero background — the Auditora "A" as a dramatic
 * animated centerpiece. NOT subtle. This should feel like opening
 * a sci-fi interface or a premium fintech app.
 */

// ─── Particle Canvas — visible, alive ───
function ParticleField() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let raf: number;
		let particles: {
			x: number;
			y: number;
			vx: number;
			vy: number;
			size: number;
			alpha: number;
			pulse: number;
		}[] = [];

		function resize() {
			if (!canvas) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = canvas.offsetWidth * dpr;
			canvas.height = canvas.offsetHeight * dpr;
			ctx!.scale(dpr, dpr);
		}

		function init() {
			resize();
			particles = [];
			const w = canvas!.offsetWidth;
			const h = canvas!.offsetHeight;
			const count = Math.min(120, Math.floor((w * h) / 12000));
			for (let i = 0; i < count; i++) {
				particles.push({
					x: Math.random() * w,
					y: Math.random() * h,
					vx: (Math.random() - 0.5) * 0.6,
					vy: (Math.random() - 0.5) * 0.6,
					size: Math.random() * 2.5 + 1,
					alpha: Math.random() * 0.6 + 0.2,
					pulse: Math.random() * Math.PI * 2,
				});
			}
		}

		function draw() {
			if (!ctx || !canvas) return;
			const w = canvas.offsetWidth;
			const h = canvas.offsetHeight;
			ctx.clearRect(0, 0, w, h);

			const cx = w / 2;
			const cy = h / 2;

			for (const p of particles) {
				p.x += p.vx;
				p.y += p.vy;
				p.pulse += 0.015;

				if (p.x < 0) p.x = w;
				if (p.x > w) p.x = 0;
				if (p.y < 0) p.y = h;
				if (p.y > h) p.y = 0;

				const dist = Math.hypot(p.x - cx, p.y - cy);
				const maxDist = Math.min(w, h) * 0.5;
				const proximity = Math.max(0, 1 - dist / maxDist);
				const breathe = Math.sin(p.pulse) * 0.3 + 0.7;
				const a = p.alpha * breathe * (0.4 + proximity * 0.6);

				// Glow effect - larger faded circle behind
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(59, 143, 232, ${a * 0.15})`;
				ctx.fill();

				// Core dot
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * (1 + proximity * 0.8), 0, Math.PI * 2);
				ctx.fillStyle = `rgba(59, 143, 232, ${a})`;
				ctx.fill();

				// Connections
				for (const p2 of particles) {
					if (p === p2) continue;
					const d = Math.hypot(p.x - p2.x, p.y - p2.y);
					if (d < 150) {
						const lineAlpha = (1 - d / 150) * 0.12 * breathe;
						ctx.beginPath();
						ctx.moveTo(p.x, p.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.strokeStyle = `rgba(59, 143, 232, ${lineAlpha})`;
						ctx.lineWidth = 0.8;
						ctx.stroke();
					}
				}
			}

			raf = requestAnimationFrame(draw);
		}

		init();
		raf = requestAnimationFrame(draw);
		window.addEventListener("resize", init);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", init);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 w-full h-full"
		/>
	);
}

// ─── Main composition ───
export function HeroBackground() {
	const uid = useId();
	const blueGrad = `hb-g-${uid}`;
	const glowF = `hb-f-${uid}`;
	const bigGlowF = `hb-bg-${uid}`;
	const aGlowF = `hb-ag-${uid}`;

	return (
		<div
			className="pointer-events-none absolute inset-0 overflow-hidden"
			aria-hidden="true"
		>
			{/* L1: Dramatic radial gradient — visible blue glow */}
			<div
				className="absolute inset-0"
				style={{
					background: [
						"radial-gradient(ellipse 70% 50% at 50% 45%, rgba(59,143,232,0.18) 0%, transparent 70%)",
						"radial-gradient(ellipse 40% 35% at 50% 42%, rgba(0,180,255,0.08) 0%, transparent 60%)",
					].join(", "),
				}}
			/>

			{/* L2: Particles */}
			<ParticleField />

			{/* L3-L9: SVG layers */}
			<div className="absolute inset-0 flex items-center justify-center">
				<motion.svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 500 500"
					className="w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px]"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.8 }}
				>
					<defs>
						<linearGradient id={blueGrad} x1="0%" y1="0%" x2="0%" y2="100%">
							<stop offset="0%" stopColor="#00B4FF" />
							<stop offset="50%" stopColor="#3B8FE8" />
							<stop offset="100%" stopColor="#0077CC" />
						</linearGradient>
						<filter id={glowF} x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="3" result="b" />
							<feMerge>
								<feMergeNode in="b" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						<filter id={bigGlowF} x="-100%" y="-100%" width="300%" height="300%">
							<feGaussianBlur stdDeviation="12" result="b" />
							<feMerge>
								<feMergeNode in="b" />
								<feMergeNode in="b" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						<filter id={aGlowF} x="-100%" y="-100%" width="300%" height="300%">
							<feGaussianBlur stdDeviation="25" result="b1" />
							<feGaussianBlur stdDeviation="8" in="SourceGraphic" result="b2" />
							<feMerge>
								<feMergeNode in="b1" />
								<feMergeNode in="b2" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					{/* L3: Blueprint grid — draws itself, MORE visible */}
					<g stroke="#00C4FF" fill="none">
						{/* Concentric rings */}
						{[200, 160, 120, 80].map((r, i) => (
							<motion.circle
								key={`c-${r}`}
								cx="250"
								cy="250"
								r={r}
								strokeWidth={i === 0 ? "0.8" : "0.5"}
								opacity={i === 0 ? 0.25 : 0.15}
								strokeDasharray={2 * Math.PI * r}
								strokeDashoffset={2 * Math.PI * r}
								animate={{ strokeDashoffset: 0 }}
								transition={{
									duration: 2,
									delay: 0.2 + i * 0.15,
									ease: [0.22, 1, 0.36, 1],
								}}
							/>
						))}

						{/* Crosshairs */}
						{[
							[250, 50, 250, 450],
							[50, 250, 450, 250],
							[100, 100, 400, 400],
							[400, 100, 100, 400],
						].map(([x1, y1, x2, y2], i) => (
							<motion.line
								key={`xl-${i}`}
								x1={x1}
								y1={y1}
								x2={x2}
								y2={y2}
								strokeWidth="0.4"
								opacity="0.18"
								initial={{ pathLength: 0, opacity: 0 }}
								animate={{ pathLength: 1, opacity: 0.18 }}
								transition={{
									duration: 1.8,
									delay: 0.4 + i * 0.12,
									ease: [0.22, 1, 0.36, 1],
								}}
							/>
						))}

						{/* Tick marks on circles */}
						{Array.from({ length: 24 }).map((_, i) => {
							const angle = (i / 24) * Math.PI * 2;
							const inner = 195;
							const outer = 205;
							return (
								<motion.line
									key={`tick-${i}`}
									x1={250 + Math.cos(angle) * inner}
									y1={250 + Math.sin(angle) * inner}
									x2={250 + Math.cos(angle) * outer}
									y2={250 + Math.sin(angle) * outer}
									strokeWidth="0.6"
									opacity="0.2"
									initial={{ opacity: 0 }}
									animate={{ opacity: 0.2 }}
									transition={{ delay: 1.5 + i * 0.03 }}
								/>
							);
						})}
					</g>

					{/* L3b: Corner marks — crisp and visible */}
					{[
						"M65,100 L65,75 L90,75",
						"M435,100 L435,75 L410,75",
						"M65,400 L65,425 L90,425",
						"M435,400 L435,425 L410,425",
					].map((d, i) => (
						<motion.path
							key={`cn-${i}`}
							d={d}
							stroke="#00C4FF"
							strokeWidth="1.2"
							fill="none"
							initial={{ opacity: 0, pathLength: 0 }}
							animate={{ opacity: 0.4, pathLength: 1 }}
							transition={{
								duration: 0.8,
								delay: 1.2 + i * 0.1,
								ease: [0.22, 1, 0.36, 1],
							}}
						/>
					))}

					{/* L4: Radar pulse rings — dramatic */}
					{[0, 1, 2].map((i) => (
						<motion.circle
							key={`radar-${i}`}
							cx="250"
							cy="250"
							fill="none"
							stroke="#3B8FE8"
							strokeWidth="1.5"
							initial={{ r: 30, opacity: 0.5 }}
							animate={{ r: 230, opacity: 0, strokeWidth: 0.3 }}
							transition={{
								duration: 4,
								delay: 2.5 + i * 1.3,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeOut",
							}}
						/>
					))}

					{/* ═══ L5: THE "A" — HERO ELEMENT — DRAMATIC ═══ */}
					<g filter={`url(#${aGlowF})`}>
						{/* Left leg */}
						<motion.path
							d="M250,85 L148,415"
							stroke={`url(#${blueGrad})`}
							strokeWidth="6"
							fill="none"
							strokeLinecap="round"
							strokeDasharray="360"
							strokeDashoffset="360"
							animate={{ strokeDashoffset: 0 }}
							transition={{
								duration: 1.5,
								delay: 0.6,
								ease: [0.22, 1, 0.36, 1],
							}}
						/>
						{/* Right leg */}
						<motion.path
							d="M250,85 L352,415"
							stroke={`url(#${blueGrad})`}
							strokeWidth="6"
							fill="none"
							strokeLinecap="round"
							strokeDasharray="360"
							strokeDashoffset="360"
							animate={{ strokeDashoffset: 0 }}
							transition={{
								duration: 1.5,
								delay: 0.8,
								ease: [0.22, 1, 0.36, 1],
							}}
						/>
						{/* Crossbar */}
						<motion.line
							x1="178"
							y1="305"
							x2="322"
							y2="305"
							stroke={`url(#${blueGrad})`}
							strokeWidth="5"
							strokeLinecap="round"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 1 }}
							transition={{
								duration: 1,
								delay: 1.8,
								ease: [0.22, 1, 0.36, 1],
							}}
						/>
					</g>

					{/* L5b: A shadow/echo for extra depth */}
					<motion.g
						opacity="0.15"
						filter={`url(#${bigGlowF})`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.15 }}
						transition={{ duration: 2, delay: 1.5 }}
					>
						<path d="M250,85 L148,415" stroke="#3B8FE8" strokeWidth="12" fill="none" strokeLinecap="round" />
						<path d="M250,85 L352,415" stroke="#3B8FE8" strokeWidth="12" fill="none" strokeLinecap="round" />
						<line x1="178" y1="305" x2="322" y2="305" stroke="#3B8FE8" strokeWidth="10" strokeLinecap="round" />
					</motion.g>

					{/* L6: Orbiting nodes */}
					{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
						const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
						const r = 185;
						return (
							<motion.g key={`orb-${i}`}>
								{i === 0 && (
									<motion.circle
										cx="250"
										cy="250"
										r={r}
										fill="none"
										stroke="#3B8FE8"
										strokeWidth="0.5"
										strokeDasharray="4 12"
										initial={{ opacity: 0 }}
										animate={{ opacity: 0.25 }}
										transition={{ duration: 1, delay: 2.2 }}
									/>
								)}
								<motion.circle
									r={i % 3 === 0 ? "4" : "2.5"}
									fill="#3B8FE8"
									filter={`url(#${glowF})`}
									initial={{ opacity: 0 }}
									animate={{
										opacity: [0, 0.9, 0.5, 0.9],
										cx: Array.from({ length: 4 }, (_, k) =>
											250 + Math.cos(angle + (k / 4) * Math.PI * 2) * r,
										),
										cy: Array.from({ length: 4 }, (_, k) =>
											250 + Math.sin(angle + (k / 4) * Math.PI * 2) * r,
										),
									}}
									transition={{
										duration: 25,
										delay: 2.5 + i * 0.4,
										repeat: Number.POSITIVE_INFINITY,
										ease: "linear",
									}}
								/>
							</motion.g>
						);
					})}

					{/* L7: Scan line sweep — visible */}
					<motion.g>
						<motion.line
							x1="50"
							y1="250"
							x2="450"
							y2="250"
							stroke="url(#hb-scanline)"
							strokeWidth="1"
							initial={{ opacity: 0 }}
							animate={{
								opacity: [0, 0.6, 0.6, 0],
								y1: [80, 420, 420, 80],
								y2: [80, 420, 420, 80],
							}}
							transition={{
								duration: 6,
								delay: 3,
								repeat: Number.POSITIVE_INFINITY,
								repeatDelay: 3,
								ease: "linear",
							}}
						/>
					</motion.g>

					{/* L8: SPARKLE at apex — bright and dramatic */}
					<g transform="translate(250, 80)">
						{/* Outer glow burst */}
						<motion.circle
							r="25"
							fill="none"
							stroke="#00B4FF"
							strokeWidth="0.5"
							initial={{ opacity: 0, scale: 0 }}
							animate={{
								opacity: [0, 0.4, 0],
								scale: [0, 2, 3],
							}}
							transition={{
								duration: 2,
								delay: 2.2,
								repeat: Number.POSITIVE_INFINITY,
								repeatDelay: 3,
							}}
						/>
						{/* Main sparkle lines */}
						{[0, 45, 90, 135].map((deg) => (
							<motion.line
								key={`sp-${deg}`}
								x1={-16 * Math.cos((deg * Math.PI) / 180)}
								y1={-16 * Math.sin((deg * Math.PI) / 180)}
								x2={16 * Math.cos((deg * Math.PI) / 180)}
								y2={16 * Math.sin((deg * Math.PI) / 180)}
								stroke="#00B4FF"
								strokeWidth={deg % 90 === 0 ? "2.5" : "1.5"}
								strokeLinecap="round"
								filter={`url(#${glowF})`}
								initial={{ opacity: 0, scale: 0 }}
								animate={{ opacity: [0, 1, 0.6, 1], scale: 1 }}
								transition={{
									duration: 0.8,
									delay: 2.3 + (deg / 180) * 0.2,
									ease: [0.22, 1, 0.36, 1],
								}}
							/>
						))}
						{/* Center bright dot */}
						<motion.circle
							r="4"
							fill="#00B4FF"
							filter={`url(#${bigGlowF})`}
							initial={{ opacity: 0, scale: 0 }}
							animate={{
								opacity: [0, 1, 0.6, 1],
								scale: [0, 1.3, 1, 1.2],
							}}
							transition={{
								duration: 3,
								delay: 2.3,
								repeat: Number.POSITIVE_INFINITY,
								repeatType: "reverse",
								ease: "easeInOut",
							}}
						/>
					</g>

					{/* L9: Methodology labels — visible but classy */}
					{[
						{ x: 405, y: 145, text: "SIPOC", delay: 3.2 },
						{ x: 80, y: 170, text: "BPMN 2.0", delay: 3.5 },
						{ x: 400, y: 365, text: "FMEA", delay: 3.8 },
						{ x: 100, y: 385, text: "ISO 31000", delay: 4.1 },
					].map((item) => (
						<motion.text
							key={item.text}
							x={item.x}
							y={item.y}
							fill="#3B8FE8"
							fontSize="10"
							fontFamily="var(--font-mono, monospace)"
							letterSpacing="0.15em"
							textAnchor="middle"
							initial={{ opacity: 0 }}
							animate={{ opacity: [0, 0.5, 0.25, 0.5] }}
							transition={{
								duration: 5,
								delay: item.delay,
								repeat: Number.POSITIVE_INFINITY,
								repeatType: "reverse",
							}}
						>
							{item.text}
						</motion.text>
					))}

					{/* Readout numbers near the A */}
					{[
						{ x: 170, y: 260, text: "S×F×D", delay: 4.0 },
						{ x: 330, y: 260, text: "RPN:142", delay: 4.3 },
					].map((item) => (
						<motion.text
							key={item.text}
							x={item.x}
							y={item.y}
							fill="#00B4FF"
							fontSize="8"
							fontFamily="var(--font-mono, monospace)"
							letterSpacing="0.2em"
							textAnchor="middle"
							initial={{ opacity: 0 }}
							animate={{ opacity: [0, 0.35, 0.15, 0.35] }}
							transition={{
								duration: 4,
								delay: item.delay,
								repeat: Number.POSITIVE_INFINITY,
								repeatType: "reverse",
							}}
						>
							{item.text}
						</motion.text>
					))}
				</motion.svg>
			</div>

			{/* Top edge glow */}
			<div
				className="absolute top-0 left-0 right-0 h-px"
				style={{
					background:
						"linear-gradient(90deg, transparent 10%, #3B8FE8 50%, transparent 90%)",
					opacity: 0.5,
				}}
			/>

			{/* Bottom vignette so content above fold blends */}
			<div
				className="absolute bottom-0 left-0 right-0 h-32"
				style={{
					background: "linear-gradient(to top, var(--background-dark, #0A0F1E) 0%, transparent 100%)",
				}}
			/>
		</div>
	);
}
