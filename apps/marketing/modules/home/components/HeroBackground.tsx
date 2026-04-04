"use client";

import { useId, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Hero background: on desktop the A sits centered behind content.
 * On mobile the A floats ABOVE the text area (top 40%) so it never
 * competes with readability. Particles fill the whole viewport but
 * fade to near-zero in the text zone on mobile.
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
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = canvas.offsetWidth * dpr;
			canvas.height = canvas.offsetHeight * dpr;
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function init() {
			resize();
			particles = [];
			const w = canvas!.offsetWidth;
			const h = canvas!.offsetHeight;
			const count = Math.min(100, Math.floor((w * h) / 15000));
			for (let i = 0; i < count; i++) {
				particles.push({
					x: Math.random() * w,
					y: Math.random() * h,
					vx: (Math.random() - 0.5) * 0.5,
					vy: (Math.random() - 0.5) * 0.5,
					size: Math.random() * 2 + 0.8,
					alpha: Math.random() * 0.5 + 0.15,
					pulse: Math.random() * Math.PI * 2,
				});
			}
		}

		function draw() {
			if (!ctx || !canvas) return;
			const w = canvas.offsetWidth;
			const h = canvas.offsetHeight;
			const isMobile = w < 768;
			ctx.clearRect(0, 0, w, h);

			for (const p of particles) {
				p.x += p.vx;
				p.y += p.vy;
				p.pulse += 0.015;

				if (p.x < 0) p.x = w;
				if (p.x > w) p.x = 0;
				if (p.y < 0) p.y = h;
				if (p.y > h) p.y = 0;

				// On mobile, fade particles in the text zone (bottom 60%)
				let zoneFade = 1;
				if (isMobile && p.y > h * 0.35) {
					zoneFade = Math.max(0, 1 - (p.y - h * 0.35) / (h * 0.3));
				}

				const breathe = Math.sin(p.pulse) * 0.3 + 0.7;
				const a = p.alpha * breathe * zoneFade;
				if (a < 0.01) continue;

				// Glow
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(59, 143, 232, ${a * 0.12})`;
				ctx.fill();

				// Core
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(59, 143, 232, ${a})`;
				ctx.fill();

				// Connections
				for (const p2 of particles) {
					if (p === p2) continue;
					const d = Math.hypot(p.x - p2.x, p.y - p2.y);
					if (d < 130) {
						const la = (1 - d / 130) * 0.1 * breathe * zoneFade;
						if (la < 0.005) continue;
						ctx.beginPath();
						ctx.moveTo(p.x, p.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.strokeStyle = `rgba(59, 143, 232, ${la})`;
						ctx.lineWidth = 0.6;
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

	return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── The animated A composition ───
function AnimatedA() {
	const uid = useId();
	const grad = `ag-${uid}`;
	const gf = `af-${uid}`;
	const bgf = `abg-${uid}`;

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 500 500"
			className="w-full h-full"
		>
			<defs>
				<linearGradient id={grad} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#00B4FF" />
					<stop offset="50%" stopColor="#3B8FE8" />
					<stop offset="100%" stopColor="#0077CC" />
				</linearGradient>
				<filter id={gf} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="3" result="b" />
					<feMerge>
						<feMergeNode in="b" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<filter id={bgf} x="-100%" y="-100%" width="300%" height="300%">
					<feGaussianBlur stdDeviation="20" result="b" />
					<feMerge>
						<feMergeNode in="b" />
						<feMergeNode in="b" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			{/* Blueprint grid */}
			<g stroke="#00C4FF" fill="none">
				{[200, 160, 120].map((r, i) => (
					<motion.circle
						key={r}
						cx="250" cy="250" r={r}
						strokeWidth={i === 0 ? "0.8" : "0.5"}
						opacity={0.2 - i * 0.05}
						strokeDasharray={2 * Math.PI * r}
						strokeDashoffset={2 * Math.PI * r}
						animate={{ strokeDashoffset: 0 }}
						transition={{ duration: 2, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
					/>
				))}
				{/* Cross lines */}
				{[[250,50,250,450],[50,250,450,250],[110,110,390,390],[390,110,110,390]].map(([x1,y1,x2,y2], i) => (
					<motion.line
						key={i} x1={x1} y1={y1} x2={x2} y2={y2}
						strokeWidth="0.4" opacity="0.15"
						initial={{ pathLength: 0, opacity: 0 }}
						animate={{ pathLength: 1, opacity: 0.15 }}
						transition={{ duration: 1.8, delay: 0.4 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
					/>
				))}
				{/* Tick marks */}
				{Array.from({ length: 24 }).map((_, i) => {
					const a = (i / 24) * Math.PI * 2;
					return (
						<motion.line key={`t${i}`}
							x1={250 + Math.cos(a) * 195} y1={250 + Math.sin(a) * 195}
							x2={250 + Math.cos(a) * 205} y2={250 + Math.sin(a) * 205}
							strokeWidth="0.6" opacity="0.18"
							initial={{ opacity: 0 }} animate={{ opacity: 0.18 }}
							transition={{ delay: 1.5 + i * 0.02 }}
						/>
					);
				})}
			</g>

			{/* Corner marks */}
			{["M65,100 L65,75 L90,75","M435,100 L435,75 L410,75","M65,400 L65,425 L90,425","M435,400 L435,425 L410,425"].map((d, i) => (
				<motion.path key={i} d={d} stroke="#00C4FF" strokeWidth="1.2" fill="none"
					initial={{ opacity: 0, pathLength: 0 }}
					animate={{ opacity: 0.35, pathLength: 1 }}
					transition={{ duration: 0.8, delay: 1.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
				/>
			))}

			{/* Radar pulses */}
			{[0,1,2].map((i) => (
				<motion.circle key={`r${i}`} cx="250" cy="250" fill="none" stroke="#3B8FE8" strokeWidth="1.2"
					initial={{ r: 30, opacity: 0.4 }}
					animate={{ r: 220, opacity: 0, strokeWidth: 0.2 }}
					transition={{ duration: 4, delay: 2.5 + i * 1.3, repeat: Infinity, ease: "easeOut" }}
				/>
			))}

			{/* THE A — dramatic triple glow */}
			<g filter={`url(#${bgf})`}>
				<motion.path d="M250,85 L148,415" stroke={`url(#${grad})`} strokeWidth="6" fill="none" strokeLinecap="round"
					strokeDasharray="360" strokeDashoffset="360"
					animate={{ strokeDashoffset: 0 }}
					transition={{ duration: 1.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
				/>
				<motion.path d="M250,85 L352,415" stroke={`url(#${grad})`} strokeWidth="6" fill="none" strokeLinecap="round"
					strokeDasharray="360" strokeDashoffset="360"
					animate={{ strokeDashoffset: 0 }}
					transition={{ duration: 1.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
				/>
				<motion.line x1="178" y1="305" x2="322" y2="305" stroke={`url(#${grad})`} strokeWidth="5" strokeLinecap="round"
					initial={{ pathLength: 0, opacity: 0 }}
					animate={{ pathLength: 1, opacity: 1 }}
					transition={{ duration: 1, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
				/>
			</g>

			{/* A echo shadow */}
			<motion.g opacity="0" initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} transition={{ duration: 2, delay: 1.5 }}>
				<path d="M250,85 L148,415" stroke="#3B8FE8" strokeWidth="14" fill="none" strokeLinecap="round" filter={`url(#${bgf})`} />
				<path d="M250,85 L352,415" stroke="#3B8FE8" strokeWidth="14" fill="none" strokeLinecap="round" filter={`url(#${bgf})`} />
				<line x1="178" y1="305" x2="322" y2="305" stroke="#3B8FE8" strokeWidth="12" strokeLinecap="round" filter={`url(#${bgf})`} />
			</motion.g>

			{/* Orbiting nodes */}
			{[0,1,2,3,4,5,6,7].map((i) => {
				const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
				const r = 185;
				return (
					<motion.circle key={`o${i}`} r={i % 3 === 0 ? "3.5" : "2"} fill="#3B8FE8" filter={`url(#${gf})`}
						initial={{ opacity: 0 }}
						animate={{
							opacity: [0, 0.8, 0.4, 0.8],
							cx: Array.from({ length: 4 }, (_, k) => 250 + Math.cos(angle + (k / 4) * Math.PI * 2) * r),
							cy: Array.from({ length: 4 }, (_, k) => 250 + Math.sin(angle + (k / 4) * Math.PI * 2) * r),
						}}
						transition={{ duration: 25, delay: 2.5 + i * 0.4, repeat: Infinity, ease: "linear" }}
					/>
				);
			})}
			{/* Orbit ring */}
			<motion.circle cx="250" cy="250" r="185" fill="none" stroke="#3B8FE8" strokeWidth="0.4" strokeDasharray="4 12"
				initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} transition={{ duration: 1, delay: 2.2 }}
			/>

			{/* Sparkle at apex */}
			<g transform="translate(250, 80)">
				<motion.circle r="20" fill="none" stroke="#00B4FF" strokeWidth="0.5"
					initial={{ opacity: 0, scale: 0 }}
					animate={{ opacity: [0, 0.3, 0], scale: [0, 2, 3] }}
					transition={{ duration: 2, delay: 2.2, repeat: Infinity, repeatDelay: 4 }}
				/>
				{[0, 45, 90, 135].map((deg) => (
					<motion.line key={deg}
						x1={-14 * Math.cos(deg * Math.PI / 180)} y1={-14 * Math.sin(deg * Math.PI / 180)}
						x2={14 * Math.cos(deg * Math.PI / 180)} y2={14 * Math.sin(deg * Math.PI / 180)}
						stroke="#00B4FF" strokeWidth={deg % 90 === 0 ? "2.5" : "1.5"} strokeLinecap="round"
						filter={`url(#${gf})`}
						initial={{ opacity: 0, scale: 0 }}
						animate={{ opacity: [0, 1, 0.6, 1], scale: 1 }}
						transition={{ duration: 0.8, delay: 2.3 + deg / 500, ease: [0.22, 1, 0.36, 1] }}
					/>
				))}
				<motion.circle r="4" fill="#00B4FF" filter={`url(#${bgf})`}
					initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5, 1], scale: [0, 1.3, 1, 1.2] }}
					transition={{ duration: 3, delay: 2.3, repeat: Infinity, repeatType: "reverse" }}
				/>
			</g>

			{/* Methodology labels */}
			{[
				{ x: 405, y: 140, text: "SIPOC" },
				{ x: 80, y: 165, text: "BPMN 2.0" },
				{ x: 400, y: 370, text: "FMEA" },
				{ x: 100, y: 390, text: "ISO 31000" },
			].map((item, i) => (
				<motion.text key={item.text} x={item.x} y={item.y}
					fill="#3B8FE8" fontSize="10" fontFamily="var(--font-mono, monospace)"
					letterSpacing="0.15em" textAnchor="middle"
					initial={{ opacity: 0 }}
					animate={{ opacity: [0, 0.45, 0.2, 0.45] }}
					transition={{ duration: 5, delay: 3 + i * 0.3, repeat: Infinity, repeatType: "reverse" }}
				>
					{item.text}
				</motion.text>
			))}
		</svg>
	);
}

// ─── Main export ───
export function HeroBackground() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			{/* Radial glow */}
			<div className="absolute inset-0" style={{
				background: [
					"radial-gradient(ellipse 70% 50% at 50% 30%, rgba(59,143,232,0.15) 0%, transparent 70%)",
					"radial-gradient(ellipse 40% 30% at 50% 25%, rgba(0,180,255,0.06) 0%, transparent 60%)",
				].join(", "),
			}} />

			{/* Particles */}
			<ParticleField />

			{/* The A composition — MOBILE: pushed to top third, DESKTOP: centered */}
			<div className="absolute inset-0 flex items-start md:items-center justify-center pt-[8vh] md:pt-0">
				<motion.div
					className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[580px] md:h-[580px] lg:w-[680px] lg:h-[680px]"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
				>
					<AnimatedA />
				</motion.div>
			</div>

			{/* Mobile: gradient mask so text zone is clean */}
			<div className="absolute inset-0 md:hidden" style={{
				background: "linear-gradient(to bottom, transparent 30%, rgba(10,15,30,0.7) 45%, rgba(10,15,30,0.95) 55%, rgba(10,15,30,0.95) 100%)",
			}} />

			{/* Top glow line */}
			<div className="absolute top-0 left-0 right-0 h-px" style={{
				background: "linear-gradient(90deg, transparent 10%, #3B8FE8 50%, transparent 90%)",
				opacity: 0.4,
			}} />
		</div>
	);
}
