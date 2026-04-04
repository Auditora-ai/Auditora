"use client";

import { useId, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Top-tier hero background animation featuring the Auditora "A" isologo.
 *
 * Layers (back to front):
 * 1. Radial gradient base (dark navy)
 * 2. Animated particle field (floating dots)
 * 3. Blueprint grid that draws itself
 * 4. Concentric radar rings that pulse outward
 * 5. The "A" drawn with animated stroke-dashoffset
 * 6. Orbital data nodes circling the A
 * 7. Connecting scan lines that sweep across
 * 8. Sparkle burst at apex
 * 9. Soft glow bloom on the whole composition
 */

// ─── Particle Canvas ───
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
			canvas.width = canvas.offsetWidth * 2;
			canvas.height = canvas.offsetHeight * 2;
		}

		function init() {
			resize();
			particles = [];
			const count = Math.min(80, Math.floor((canvas!.width * canvas!.height) / 25000));
			for (let i = 0; i < count; i++) {
				particles.push({
					x: Math.random() * canvas!.width,
					y: Math.random() * canvas!.height,
					vx: (Math.random() - 0.5) * 0.4,
					vy: (Math.random() - 0.5) * 0.4,
					size: Math.random() * 2 + 0.5,
					alpha: Math.random() * 0.4 + 0.1,
					pulse: Math.random() * Math.PI * 2,
				});
			}
		}

		function draw(time: number) {
			if (!ctx || !canvas) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const cx = canvas.width / 2;
			const cy = canvas.height / 2;

			for (const p of particles) {
				p.x += p.vx;
				p.y += p.vy;
				p.pulse += 0.02;

				// Wrap around
				if (p.x < 0) p.x = canvas.width;
				if (p.x > canvas.width) p.x = 0;
				if (p.y < 0) p.y = canvas.height;
				if (p.y > canvas.height) p.y = 0;

				const dist = Math.hypot(p.x - cx, p.y - cy);
				const maxDist = Math.min(canvas.width, canvas.height) * 0.45;
				const proximity = Math.max(0, 1 - dist / maxDist);
				const breathe = Math.sin(p.pulse) * 0.3 + 0.7;
				const a = p.alpha * breathe * (0.3 + proximity * 0.7);

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * (1 + proximity * 0.5), 0, Math.PI * 2);
				ctx.fillStyle = `rgba(59, 143, 232, ${a})`;
				ctx.fill();

				// Draw connections to nearby particles
				for (const p2 of particles) {
					const d = Math.hypot(p.x - p2.x, p.y - p2.y);
					if (d < 120 && d > 0) {
						ctx.beginPath();
						ctx.moveTo(p.x, p.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.strokeStyle = `rgba(59, 143, 232, ${(1 - d / 120) * 0.06 * breathe})`;
						ctx.lineWidth = 0.5;
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
			style={{ opacity: 0.6 }}
		/>
	);
}

// ─── Main animated A composition ───
export function HeroBackground() {
	const uid = useId();
	const blueGrad = `hb-grad-${uid}`;
	const glowFilter = `hb-glow-${uid}`;
	const bigGlow = `hb-bigglow-${uid}`;

	return (
		<div
			className="pointer-events-none absolute inset-0 overflow-hidden"
			aria-hidden="true"
		>
			{/* L1: Base radial gradient */}
			<div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 80% 60% at 50% 45%, rgba(59,143,232,0.08) 0%, transparent 70%)",
				}}
			/>

			{/* L2: Particle field */}
			<ParticleField />

			{/* L3-L8: SVG composition */}
			<div className="absolute inset-0 flex items-center justify-center">
				<motion.svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 500 500"
					className="w-[420px] h-[420px] sm:w-[520px] sm:h-[520px] md:w-[620px] md:h-[620px] lg:w-[720px] lg:h-[720px]"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1.5 }}
				>
					<defs>
						<linearGradient id={blueGrad} x1="0%" y1="0%" x2="0%" y2="100%">
							<stop offset="0%" stopColor="#00B4FF" />
							<stop offset="100%" stopColor="#0077CC" />
						</linearGradient>
						<filter id={glowFilter} x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="4" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						<filter id={bigGlow} x="-100%" y="-100%" width="300%" height="300%">
							<feGaussianBlur stdDeviation="20" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						<radialGradient id={`${uid}-rg`} cx="50%" cy="45%" r="50%">
							<stop offset="0%" stopColor="rgba(59,143,232,0.15)" />
							<stop offset="100%" stopColor="transparent" />
						</radialGradient>
					</defs>

					{/* L3: Blueprint grid — draws itself */}
					<g opacity="0.12" stroke="#00C4FF" fill="none">
						{/* Concentric circles */}
						{[200, 160, 120, 80].map((r, i) => (
							<motion.circle
								key={`c-${r}`}
								cx="250"
								cy="250"
								r={r}
								strokeWidth="0.5"
								strokeDasharray={2 * Math.PI * r}
								strokeDashoffset={2 * Math.PI * r}
								animate={{ strokeDashoffset: 0 }}
								transition={{
									duration: 2.5,
									delay: 0.3 + i * 0.2,
									ease: [0.22, 1, 0.36, 1],
								}}
							/>
						))}

						{/* Crosshairs */}
						{[
							["250,50", "250,450"],
							["50,250", "450,250"],
							["100,100", "400,400"],
							["400,100", "100,400"],
						].map(([from, to], i) => (
							<motion.line
								key={`l-${i}`}
								x1={from.split(",")[0]}
								y1={from.split(",")[1]}
								x2={to.split(",")[0]}
								y2={to.split(",")[1]}
								strokeWidth="0.3"
								initial={{ pathLength: 0, opacity: 0 }}
								animate={{ pathLength: 1, opacity: 1 }}
								transition={{
									duration: 2,
									delay: 0.5 + i * 0.15,
									ease: [0.22, 1, 0.36, 1],
								}}
							/>
						))}
					</g>

					{/* L3b: Corner registration marks */}
					<g stroke="#00C4FF" strokeWidth="1" opacity="0" fill="none">
						{[
							"M70,100 L70,80 L90,80",
							"M430,100 L430,80 L410,80",
							"M70,400 L70,420 L90,420",
							"M430,400 L430,420 L410,420",
						].map((d, i) => (
							<motion.path
								key={`corner-${i}`}
								d={d}
								initial={{ opacity: 0 }}
								animate={{ opacity: 0.25 }}
								transition={{ duration: 0.6, delay: 1.5 + i * 0.1 }}
							/>
						))}
					</g>

					{/* L4: Radar pulse rings */}
					{[0, 1, 2].map((i) => (
						<motion.circle
							key={`radar-${i}`}
							cx="250"
							cy="250"
							r="40"
							fill="none"
							stroke="#3B8FE8"
							strokeWidth="0.8"
							initial={{ r: 40, opacity: 0.3 }}
							animate={{ r: 220, opacity: 0 }}
							transition={{
								duration: 4,
								delay: 2 + i * 1.3,
								repeat: Number.POSITIVE_INFINITY,
								ease: "linear",
							}}
						/>
					))}

					{/* L5: The A — animated stroke draw */}
					<g filter={`url(#${bigGlow})`}>
						{/* Left leg */}
						<motion.path
							d="M250,90 L150,410"
							stroke={`url(#${blueGrad})`}
							strokeWidth="5"
							fill="none"
							strokeLinecap="round"
							strokeDasharray="350"
							strokeDashoffset="350"
							animate={{ strokeDashoffset: 0 }}
							transition={{
								duration: 1.8,
								delay: 0.8,
								ease: [0.22, 1, 0.36, 1],
							}}
						/>
						{/* Right leg */}
						<motion.path
							d="M250,90 L350,410"
							stroke={`url(#${blueGrad})`}
							strokeWidth="5"
							fill="none"
							strokeLinecap="round"
							strokeDasharray="350"
							strokeDashoffset="350"
							animate={{ strokeDashoffset: 0 }}
							transition={{
								duration: 1.8,
								delay: 1.0,
								ease: [0.22, 1, 0.36, 1],
							}}
						/>
						{/* Crossbar */}
						<motion.line
							x1="180"
							y1="300"
							x2="320"
							y2="300"
							stroke={`url(#${blueGrad})`}
							strokeWidth="4"
							strokeLinecap="round"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 1 }}
							transition={{
								duration: 1.2,
								delay: 2.0,
								ease: [0.22, 1, 0.36, 1],
							}}
						/>
					</g>

					{/* L6: Orbital data nodes */}
					{[0, 1, 2, 3, 4, 5].map((i) => {
						const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
						const rx = 180;
						const ry = 180;
						return (
							<motion.g key={`node-${i}`}>
								{/* Orbit path (very subtle) */}
								{i === 0 && (
									<motion.ellipse
										cx="250"
										cy="250"
										rx={rx}
										ry={ry}
										fill="none"
										stroke="#3B8FE8"
										strokeWidth="0.3"
										strokeDasharray="4 8"
										initial={{ opacity: 0 }}
										animate={{ opacity: 0.2 }}
										transition={{ duration: 1, delay: 2.5 }}
									/>
								)}
								{/* Node dot */}
								<motion.circle
									r="3"
									fill="#3B8FE8"
									filter={`url(#${glowFilter})`}
									initial={{ opacity: 0 }}
									animate={{
										opacity: [0, 0.8, 0.4, 0.8],
										cx: [
											250 + Math.cos(angle) * rx,
											250 + Math.cos(angle + 0.3) * rx,
											250 + Math.cos(angle + 0.6) * rx,
											250 + Math.cos(angle + Math.PI * 2) * rx,
										],
										cy: [
											250 + Math.sin(angle) * ry,
											250 + Math.sin(angle + 0.3) * ry,
											250 + Math.sin(angle + 0.6) * ry,
											250 + Math.sin(angle + Math.PI * 2) * ry,
										],
									}}
									transition={{
										duration: 20,
										delay: 2.5 + i * 0.3,
										repeat: Number.POSITIVE_INFINITY,
										ease: "linear",
									}}
								/>
							</motion.g>
						);
					})}

					{/* L7: Scan line sweep */}
					<motion.line
						x1="50"
						y1="250"
						x2="450"
						y2="250"
						stroke="#3B8FE8"
						strokeWidth="0.5"
						initial={{ opacity: 0 }}
						animate={{
							opacity: [0, 0.4, 0],
							y1: [100, 400],
							y2: [100, 400],
						}}
						transition={{
							duration: 4,
							delay: 3,
							repeat: Number.POSITIVE_INFINITY,
							repeatDelay: 5,
							ease: "linear",
						}}
					/>

					{/* L8: Sparkle burst at apex */}
					<g transform="translate(250, 85)" filter={`url(#${glowFilter})`}>
						{/* Vertical spark */}
						<motion.line
							x1="0"
							y1="-20"
							x2="0"
							y2="20"
							stroke="#00B4FF"
							strokeWidth="2.5"
							strokeLinecap="round"
							initial={{ opacity: 0, scaleY: 0 }}
							animate={{ opacity: [0, 1, 0.6, 1], scaleY: 1 }}
							transition={{
								duration: 0.8,
								delay: 2.5,
								ease: [0.22, 1, 0.36, 1],
							}}
						/>
						{/* Horizontal spark */}
						<motion.line
							x1="-20"
							y1="0"
							x2="20"
							y2="0"
							stroke="#00B4FF"
							strokeWidth="2.5"
							strokeLinecap="round"
							initial={{ opacity: 0, scaleX: 0 }}
							animate={{ opacity: [0, 1, 0.6, 1], scaleX: 1 }}
							transition={{
								duration: 0.8,
								delay: 2.6,
								ease: [0.22, 1, 0.36, 1],
							}}
						/>
						{/* Diagonal sparks */}
						{[45, 135].map((deg) => (
							<motion.line
								key={deg}
								x1={-10 * Math.cos((deg * Math.PI) / 180)}
								y1={-10 * Math.sin((deg * Math.PI) / 180)}
								x2={10 * Math.cos((deg * Math.PI) / 180)}
								y2={10 * Math.sin((deg * Math.PI) / 180)}
								stroke="#00B4FF"
								strokeWidth="1.5"
								strokeLinecap="round"
								initial={{ opacity: 0, scale: 0 }}
								animate={{ opacity: [0, 0.7, 0.4, 0.7], scale: 1 }}
								transition={{
									duration: 0.6,
									delay: 2.8,
									ease: [0.22, 1, 0.36, 1],
								}}
							/>
						))}
						{/* Center glow dot */}
						<motion.circle
							r="3"
							fill="#00B4FF"
							initial={{ opacity: 0, scale: 0 }}
							animate={{
								opacity: [0, 1, 0.5, 1],
								scale: [0, 1.5, 1, 1.2],
							}}
							transition={{
								duration: 2,
								delay: 2.5,
								repeat: Number.POSITIVE_INFINITY,
								repeatType: "reverse",
								ease: "easeInOut",
							}}
						/>
					</g>

					{/* L8b: Data readout text fragments */}
					{[
						{ x: 395, y: 155, text: "SIPOC", delay: 3.0 },
						{ x: 80, y: 180, text: "BPMN 2.0", delay: 3.3 },
						{ x: 380, y: 350, text: "FMEA", delay: 3.6 },
						{ x: 95, y: 370, text: "RPN:142", delay: 3.9 },
					].map((item) => (
						<motion.text
							key={item.text}
							x={item.x}
							y={item.y}
							fill="#3B8FE8"
							fontSize="9"
							fontFamily="monospace"
							letterSpacing="0.1em"
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

			{/* L9: Top edge glow line */}
			<div
				className="absolute top-0 left-0 right-0 h-px"
				style={{
					background:
						"linear-gradient(90deg, transparent 0%, #3B8FE8 50%, transparent 100%)",
					opacity: 0.3,
				}}
			/>
		</div>
	);
}
