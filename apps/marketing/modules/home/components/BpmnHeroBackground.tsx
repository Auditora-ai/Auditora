"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function BpmnHeroBackground() {
	const svgRef = useRef<SVGSVGElement>(null);

	useGSAP(
		() => {
			if (!svgRef.current) return;

			const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			if (prefersReducedMotion) return;

			const paths = svgRef.current.querySelectorAll(".bpmn-path");
			const nodes = svgRef.current.querySelectorAll(".bpmn-node");

			const tl = gsap.timeline({ delay: 0.5 });

			// Draw connection paths first
			paths.forEach((path) => {
				const el = path as SVGPathElement | SVGLineElement;
				if (el instanceof SVGPathElement || el instanceof SVGLineElement) {
					const length = el instanceof SVGPathElement ? el.getTotalLength() : Math.hypot(
						Number(el.getAttribute("x2")) - Number(el.getAttribute("x1")),
						Number(el.getAttribute("y2")) - Number(el.getAttribute("y1")),
					);
					gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
					tl.to(el, { strokeDashoffset: 0, duration: 0.8, ease: "none" }, "<0.15");
				}
			});

			// Nodes fade in with forming → confirmed animation
			nodes.forEach((node, i) => {
				const border = node.querySelector(".node-border");
				tl.from(
					node,
					{
						opacity: 0,
						scale: 0.8,
						duration: 0.4,
						ease: "back.out(1.5)",
					},
					`>-0.2`,
				);
				// Dashed → solid transition
				if (border) {
					gsap.set(border, { strokeDasharray: "4 4" });
					tl.to(
						border,
						{
							strokeDasharray: "0 0",
							duration: 0.3,
							ease: "power2.out",
						},
						`>`,
					);
				}
			});

			// Parallax on scroll
			gsap.to(svgRef.current, {
				y: 60,
				ease: "none",
				scrollTrigger: {
					trigger: svgRef.current,
					start: "top top",
					end: "bottom top",
					scrub: true,
				},
			});
		},
		{ scope: svgRef },
	);

	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
			<svg
				ref={svgRef}
				viewBox="0 0 1200 500"
				className="absolute inset-0 w-full h-full opacity-[0.10]"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Connection paths */}
				<line className="bpmn-path" x1="180" y1="250" x2="300" y2="250" stroke="#64748B" strokeWidth="2" />
				<line className="bpmn-path" x1="460" y1="250" x2="560" y2="250" stroke="#64748B" strokeWidth="2" />
				<line className="bpmn-path" x1="560" y1="250" x2="660" y2="180" stroke="#64748B" strokeWidth="2" />
				<line className="bpmn-path" x1="560" y1="250" x2="660" y2="320" stroke="#64748B" strokeWidth="2" />
				<line className="bpmn-path" x1="820" y1="180" x2="920" y2="250" stroke="#64748B" strokeWidth="2" />
				<line className="bpmn-path" x1="820" y1="320" x2="920" y2="250" stroke="#64748B" strokeWidth="2" />
				<line className="bpmn-path" x1="980" y1="250" x2="1060" y2="250" stroke="#64748B" strokeWidth="2" />

				{/* Start Event (green circle) */}
				<g className="bpmn-node" transform="translate(150, 250)">
					<circle className="node-border" r="25" stroke="#16A34A" strokeWidth="2.5" fill="#F0FDF4" />
				</g>

				{/* Task: Receive Request (blue rectangle) */}
				<g className="bpmn-node" transform="translate(380, 250)">
					<rect className="node-border" x="-80" y="-30" width="160" height="60" rx="8" stroke="#2563EB" strokeWidth="2" fill="#EFF6FF" />
					<text x="0" y="5" textAnchor="middle" className="text-[13px]" fill="#2563EB" fontFamily="system-ui">Receive Request</text>
				</g>

				{/* Gateway (amber diamond) */}
				<g className="bpmn-node" transform="translate(560, 250)">
					<rect className="node-border" x="-22" y="-22" width="44" height="44" rx="4" transform="rotate(45)" stroke="#D97706" strokeWidth="2" fill="#FFFBEB" />
				</g>

				{/* Task: Manager Approval (blue) */}
				<g className="bpmn-node" transform="translate(740, 180)">
					<rect className="node-border" x="-80" y="-30" width="160" height="60" rx="8" stroke="#2563EB" strokeWidth="2" fill="#EFF6FF" />
					<text x="0" y="5" textAnchor="middle" className="text-[13px]" fill="#2563EB" fontFamily="system-ui">Mgr Approval</text>
				</g>

				{/* Task: VP Approval (blue) */}
				<g className="bpmn-node" transform="translate(740, 320)">
					<rect className="node-border" x="-80" y="-30" width="160" height="60" rx="8" stroke="#2563EB" strokeWidth="2" fill="#EFF6FF" />
					<text x="0" y="5" textAnchor="middle" className="text-[13px]" fill="#2563EB" fontFamily="system-ui">VP Approval</text>
				</g>

				{/* Merge Gateway */}
				<g className="bpmn-node" transform="translate(950, 250)">
					<rect className="node-border" x="-22" y="-22" width="44" height="44" rx="4" transform="rotate(45)" stroke="#D97706" strokeWidth="2" fill="#FFFBEB" />
				</g>

				{/* End Event (red circle) */}
				<g className="bpmn-node" transform="translate(1080, 250)">
					<circle className="node-border" r="25" stroke="#DC2626" strokeWidth="3" fill="#FEF2F2" />
				</g>

				{/* Gateway labels */}
				<text x="600" y="215" className="text-[11px]" fill="#64748B" fontFamily="system-ui">&lt; $5k</text>
				<text x="600" y="300" className="text-[11px]" fill="#64748B" fontFamily="system-ui">&ge; $5k</text>
			</svg>
		</div>
	);
}
