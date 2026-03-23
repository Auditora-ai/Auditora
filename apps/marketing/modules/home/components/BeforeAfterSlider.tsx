"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function BeforeAfterSlider() {
	const t = useTranslations();
	const containerRef = useRef<HTMLDivElement>(null);
	const clipRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (!containerRef.current || !clipRef.current) return;

			gsap.fromTo(
				clipRef.current,
				{ clipPath: "inset(0 100% 0 0)" },
				{
					clipPath: "inset(0 0% 0 0)",
					ease: "none",
					scrollTrigger: {
						trigger: containerRef.current,
						start: "top 60%",
						end: "bottom 40%",
						scrub: 0.5,
					},
				},
			);
		},
		{ scope: containerRef },
	);

	return (
		<div ref={containerRef} className="mt-16 relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl overflow-hidden border">
			{/* BEFORE side: messy notes */}
			<div className="absolute inset-0 bg-[#FFFDF7] p-6 md:p-10 flex flex-col justify-center">
				<div className="absolute top-4 left-4 text-xs font-medium text-red-500/70 uppercase tracking-wider">
					{t("home.problem.beforeLabel")}
				</div>
				{/* Simulated messy notes */}
				<div className="relative space-y-3">
					<div className="bg-yellow-200/80 p-3 rounded shadow-sm rotate-[-1deg] max-w-[240px]" style={{ fontFamily: "'Caveat', cursive" }}>
						<p className="text-sm text-yellow-900">dept manager approves first</p>
					</div>
					<div className="bg-blue-200/60 p-3 rounded shadow-sm rotate-[2deg] max-w-[200px] ml-auto" style={{ fontFamily: "'Caveat', cursive" }}>
						<p className="text-sm text-blue-900">VP if &gt; $5k ???</p>
					</div>
					<div className="bg-pink-200/60 p-3 rounded shadow-sm rotate-[-0.5deg] max-w-[260px]" style={{ fontFamily: "'Caveat', cursive" }}>
						<p className="text-sm text-pink-900 line-through">ask about exceptions</p>
					</div>
					<div className="bg-green-200/50 p-3 rounded shadow-sm rotate-[1.5deg] max-w-[180px] ml-12" style={{ fontFamily: "'Caveat', cursive" }}>
						<p className="text-sm text-green-900">revision loop?</p>
					</div>
					<div className="absolute top-2 right-8 text-red-400 text-2xl rotate-12" style={{ fontFamily: "'Caveat', cursive" }}>
						→ ???
					</div>
				</div>
			</div>

			{/* AFTER side: clean BPMN diagram */}
			<div
				ref={clipRef}
				className="absolute inset-0 bg-white p-6 md:p-10 flex flex-col justify-center"
				style={{ clipPath: "inset(0 100% 0 0)" }}
			>
				<div className="absolute top-4 left-4 text-xs font-medium text-green-600/70 uppercase tracking-wider">
					{t("home.problem.afterLabel")}
				</div>
				{/* Clean BPMN diagram */}
				<svg viewBox="0 0 600 200" className="w-full max-w-[500px] mx-auto" fill="none">
					{/* Connections */}
					<line x1="60" y1="100" x2="120" y2="100" stroke="#64748B" strokeWidth="1.5" />
					<line x1="240" y1="100" x2="290" y2="100" stroke="#64748B" strokeWidth="1.5" />
					<line x1="290" y1="100" x2="340" y2="60" stroke="#64748B" strokeWidth="1.5" />
					<line x1="290" y1="100" x2="340" y2="140" stroke="#64748B" strokeWidth="1.5" />
					<line x1="460" y1="60" x2="500" y2="100" stroke="#64748B" strokeWidth="1.5" />
					<line x1="460" y1="140" x2="500" y2="100" stroke="#64748B" strokeWidth="1.5" />
					<line x1="520" y1="100" x2="560" y2="100" stroke="#64748B" strokeWidth="1.5" />

					{/* Start Event */}
					<circle cx="40" cy="100" r="16" stroke="#16A34A" strokeWidth="2" fill="#F0FDF4" />

					{/* Task: Receive PO */}
					<rect x="120" y="75" width="120" height="50" rx="6" stroke="#2563EB" strokeWidth="1.5" fill="#EFF6FF" />
					<text x="180" y="104" textAnchor="middle" className="text-[11px]" fill="#2563EB" fontFamily="system-ui">Receive PO</text>

					{/* Gateway */}
					<rect x="275" y="85" width="30" height="30" rx="3" transform="rotate(45 290 100)" stroke="#D97706" strokeWidth="1.5" fill="#FFFBEB" />

					{/* Task: Mgr */}
					<rect x="340" y="35" width="120" height="50" rx="6" stroke="#2563EB" strokeWidth="1.5" fill="#EFF6FF" />
					<text x="400" y="64" textAnchor="middle" className="text-[11px]" fill="#2563EB" fontFamily="system-ui">Mgr Approval</text>

					{/* Task: VP */}
					<rect x="340" y="115" width="120" height="50" rx="6" stroke="#2563EB" strokeWidth="1.5" fill="#EFF6FF" />
					<text x="400" y="144" textAnchor="middle" className="text-[11px]" fill="#2563EB" fontFamily="system-ui">VP Approval</text>

					{/* Merge */}
					<rect x="495" y="85" width="30" height="30" rx="3" transform="rotate(45 510 100)" stroke="#D97706" strokeWidth="1.5" fill="#FFFBEB" />

					{/* End Event */}
					<circle cx="570" cy="100" r="16" stroke="#DC2626" strokeWidth="2.5" fill="#FEF2F2" />

					{/* Labels */}
					<text x="310" y="55" className="text-[9px]" fill="#64748B" fontFamily="system-ui">&lt; $5k</text>
					<text x="310" y="135" className="text-[9px]" fill="#64748B" fontFamily="system-ui">&ge; $5k</text>
				</svg>
			</div>

			{/* Divider line */}
			<div className="absolute top-0 bottom-0 w-0.5 bg-primary/50 z-10 pointer-events-none transition-all" style={{ left: "50%" }} />
		</div>
	);
}
