"use client";

import { useGSAP } from "@gsap/react";
import { Logo } from "@repo/ui";
import gsap from "gsap";
import { useRef } from "react";
import { SplitWords } from "@shared/components/SplitWords";

gsap.registerPlugin();

interface LoginShowcasePanelProps {
	variant?: "login" | "signup";
}

export function LoginShowcasePanel({
	variant = "login",
}: LoginShowcasePanelProps) {
	const panelRef = useRef<HTMLDivElement>(null);

	const tagline =
		variant === "signup"
			? "Join 500+ teams mapping smarter processes."
			: "Map your processes. Transform your business.";

	useGSAP(
		() => {
			if (!panelRef.current) return;

			const prefersReducedMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;

			if (prefersReducedMotion) return;

			const svg = panelRef.current.querySelector(".showcase-svg");
			if (!svg) return;

			const paths = svg.querySelectorAll(".bpmn-path");
			const nodes = svg.querySelectorAll(".bpmn-node");
			const logo = panelRef.current.querySelector(".showcase-logo");
			const taglineWords =
				panelRef.current.querySelectorAll(".tagline-word");
			const metrics =
				panelRef.current.querySelectorAll(".showcase-metric");

			const tl = gsap.timeline({ delay: 0.2 });

			// Panel fade in
			tl.from(panelRef.current, {
				opacity: 0,
				duration: 0.3,
				ease: "power2.out",
			});

			// Logo clip-path wipe
			if (logo) {
				tl.from(
					logo,
					{
						clipPath: "inset(0 100% 0 0)",
						duration: 0.6,
						ease: "power2.inOut",
					},
					0.1,
				);
			}

			// Draw connection paths
			paths.forEach((path) => {
				const el = path as SVGPathElement | SVGLineElement;
				if (
					el instanceof SVGPathElement ||
					el instanceof SVGLineElement
				) {
					const length =
						el instanceof SVGPathElement
							? el.getTotalLength()
							: Math.hypot(
									Number(el.getAttribute("x2")) -
										Number(el.getAttribute("x1")),
									Number(el.getAttribute("y2")) -
										Number(el.getAttribute("y1")),
								);
					gsap.set(el, {
						strokeDasharray: length,
						strokeDashoffset: length,
					});
					tl.to(
						el,
						{ strokeDashoffset: 0, duration: 0.8, ease: "none" },
						"<0.15",
					);
				}
			});

			// Nodes fade in with bounce + dashed→solid
			nodes.forEach((node) => {
				const border = node.querySelector(".node-border");
				tl.from(
					node,
					{
						opacity: 0,
						scale: 0.8,
						duration: 0.4,
						ease: "back.out(1.5)",
					},
					">-0.2",
				);
				if (border) {
					gsap.set(border, { strokeDasharray: "4 4" });
					tl.to(
						border,
						{
							strokeDasharray: "0 0",
							duration: 0.3,
							ease: "power2.out",
						},
						">",
					);
				}
			});

			// Tagline word reveal
			if (taglineWords.length > 0) {
				tl.from(
					taglineWords,
					{
						y: "110%",
						duration: 1.0,
						stagger: 0.06,
						ease: "power4.out",
					},
					"-=1.2",
				);
			}

			// Social proof blur-fade
			if (metrics.length > 0) {
				tl.from(
					metrics,
					{
						opacity: 0,
						y: 15,
						filter: "blur(4px)",
						duration: 0.6,
						stagger: 0.1,
						ease: "power2.out",
					},
					"-=0.6",
				);
			}
		},
		{ scope: panelRef },
	);

	return (
		<div
			ref={panelRef}
			className="relative flex h-full flex-col justify-between overflow-hidden p-8 lg:p-12"
			style={{ backgroundColor: "#1C1917" }}
		>
			{/* Logo */}
			<div className="showcase-logo">
				<Logo
					withLabel
					className="text-[#FAFAF9] [&_svg]:text-[#2563EB] [&_.text-muted-foreground]:text-[#A8A29E]"
				/>
			</div>

			{/* Animated BPMN Diagram */}
			<div className="flex flex-1 items-center justify-center py-8">
				<svg
					className="showcase-svg w-full max-w-lg"
					viewBox="0 0 820 340"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					{/* Connection paths */}
					{/* Start → Interview */}
					<line
						className="bpmn-path"
						x1="45"
						y1="170"
						x2="100"
						y2="170"
						stroke="#78716C"
						strokeWidth="2"
					/>
					{/* Interview → AI Analysis */}
					<line
						className="bpmn-path"
						x1="260"
						y1="170"
						x2="320"
						y2="170"
						stroke="#78716C"
						strokeWidth="2"
					/>
					{/* AI Analysis → Gateway */}
					<line
						className="bpmn-path"
						x1="480"
						y1="170"
						x2="530"
						y2="170"
						stroke="#78716C"
						strokeWidth="2"
					/>
					{/* Gateway → Process Map (upper) */}
					<path
						className="bpmn-path"
						d="M570 170 L600 170 L600 90 L640 90"
						stroke="#78716C"
						strokeWidth="2"
						fill="none"
					/>
					{/* Gateway → RACI Matrix (lower) */}
					<path
						className="bpmn-path"
						d="M570 170 L600 170 L600 250 L640 250"
						stroke="#78716C"
						strokeWidth="2"
						fill="none"
					/>
					{/* Process Map → End */}
					<path
						className="bpmn-path"
						d="M780 90 L800 90 L800 170"
						stroke="#78716C"
						strokeWidth="2"
						fill="none"
					/>
					{/* RACI → End */}
					<path
						className="bpmn-path"
						d="M780 250 L800 250 L800 170"
						stroke="#78716C"
						strokeWidth="2"
						fill="none"
					/>

					{/* Start Event (green circle) */}
					<g className="bpmn-node" transform="translate(25, 170)">
						<circle
							className="node-border"
							r="18"
							stroke="#16A34A"
							strokeWidth="2.5"
							fill="rgba(22,163,74,0.12)"
						/>
					</g>

					{/* Task: Interview Session */}
					<g className="bpmn-node" transform="translate(180, 170)">
						<rect
							className="node-border"
							x="-78"
							y="-28"
							width="156"
							height="56"
							rx="8"
							stroke="#3B82F6"
							strokeWidth="2"
							fill="rgba(59,130,246,0.1)"
						/>
						<text
							x="0"
							y="1"
							textAnchor="middle"
							dominantBaseline="middle"
							fill="#93C5FD"
							fontSize="13"
							fontFamily="system-ui, sans-serif"
						>
							Interview Session
						</text>
					</g>

					{/* Task: AI Analysis */}
					<g className="bpmn-node" transform="translate(400, 170)">
						<rect
							className="node-border"
							x="-78"
							y="-28"
							width="156"
							height="56"
							rx="8"
							stroke="#3B82F6"
							strokeWidth="2"
							fill="rgba(59,130,246,0.1)"
						/>
						<text
							x="0"
							y="1"
							textAnchor="middle"
							dominantBaseline="middle"
							fill="#93C5FD"
							fontSize="13"
							fontFamily="system-ui, sans-serif"
						>
							AI Analysis
						</text>
					</g>

					{/* Gateway: Output Type (amber diamond) */}
					<g className="bpmn-node" transform="translate(550, 170)">
						<rect
							className="node-border"
							x="-18"
							y="-18"
							width="36"
							height="36"
							rx="3"
							transform="rotate(45)"
							stroke="#EAB308"
							strokeWidth="2"
							fill="rgba(234,179,8,0.1)"
						/>
					</g>

					{/* Task: Process Map (upper branch) */}
					<g className="bpmn-node" transform="translate(710, 90)">
						<rect
							className="node-border"
							x="-68"
							y="-24"
							width="136"
							height="48"
							rx="8"
							stroke="#3B82F6"
							strokeWidth="2"
							fill="rgba(59,130,246,0.1)"
						/>
						<text
							x="0"
							y="1"
							textAnchor="middle"
							dominantBaseline="middle"
							fill="#93C5FD"
							fontSize="13"
							fontFamily="system-ui, sans-serif"
						>
							Process Map
						</text>
					</g>

					{/* Task: RACI Matrix (lower branch) */}
					<g className="bpmn-node" transform="translate(710, 250)">
						<rect
							className="node-border"
							x="-68"
							y="-24"
							width="136"
							height="48"
							rx="8"
							stroke="#7C3AED"
							strokeWidth="2"
							fill="rgba(124,58,237,0.1)"
						/>
						<text
							x="0"
							y="1"
							textAnchor="middle"
							dominantBaseline="middle"
							fill="#C4B5FD"
							fontSize="13"
							fontFamily="system-ui, sans-serif"
						>
							RACI Matrix
						</text>
					</g>

					{/* End Event (red circle, where paths converge) */}
					<g className="bpmn-node" transform="translate(800, 170)">
						<circle
							className="node-border"
							r="18"
							stroke="#DC2626"
							strokeWidth="3"
							fill="rgba(220,38,38,0.12)"
						/>
					</g>

					{/* Gateway labels */}
					<text
						x="610"
						y="75"
						fill="#78716C"
						fontSize="11"
						fontFamily="system-ui, sans-serif"
					>
						Diagrams
					</text>
					<text
						x="610"
						y="240"
						fill="#78716C"
						fontSize="11"
						fontFamily="system-ui, sans-serif"
					>
						Matrices
					</text>
				</svg>
			</div>

			{/* Tagline */}
			<div className="mb-8">
				<h2
					className="font-display text-2xl leading-snug tracking-tight lg:text-3xl"
					style={{
						color: "#FAFAF9",
						fontFamily: "'Instrument Serif', serif",
					}}
				>
					<SplitWords innerClassName="tagline-word">
						{tagline}
					</SplitWords>
				</h2>
			</div>

			{/* Social proof metrics */}
			<div className="flex items-center gap-8">
				<div className="showcase-metric">
					<p
						className="text-2xl font-bold"
						style={{ color: "#FAFAF9" }}
					>
						2,000+
					</p>
					<p className="text-sm" style={{ color: "#A8A29E" }}>
						Processes mapped
					</p>
				</div>
				<div
					className="h-8 w-px"
					style={{ backgroundColor: "#44403C" }}
				/>
				<div className="showcase-metric">
					<p
						className="text-2xl font-bold"
						style={{ color: "#FAFAF9" }}
					>
						500+
					</p>
					<p className="text-sm" style={{ color: "#A8A29E" }}>
						Organizations
					</p>
				</div>
				<div
					className="h-8 w-px"
					style={{ backgroundColor: "#44403C" }}
				/>
				<div className="showcase-metric">
					<p
						className="text-2xl font-bold"
						style={{ color: "#FAFAF9" }}
					>
						98%
					</p>
					<p className="text-sm" style={{ color: "#A8A29E" }}>
						Accuracy rate
					</p>
				</div>
			</div>
		</div>
	);
}
