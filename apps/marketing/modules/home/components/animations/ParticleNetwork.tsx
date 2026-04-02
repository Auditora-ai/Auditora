"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const NODE_COUNT = 18;
const CONNECTION_DISTANCE = 120;
const COLORS = ["#00E5C0", "#38BDF8", "#A78BFA"] as const;

interface Node {
	x: number;
	y: number;
	vx: number;
	vy: number;
	color: string;
}

interface ParticleNetworkProps {
	/** Width of the canvas area */
	width?: number;
	/** Height of the canvas area */
	height?: number;
	/** Custom class name */
	className?: string;
}

/**
 * Subtle floating particle network background animation.
 * Nodes drift slowly and connect with thin lines when close.
 * Very atmospheric — designed to be a background, not the hero.
 * Uses requestAnimationFrame for smooth 60fps.
 * Respects prefers-reduced-motion (shows static version).
 */
export function ParticleNetwork({
	width = 800,
	height = 400,
	className,
}: ParticleNetworkProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const nodesRef = useRef<Node[]>([]);
	const rafRef = useRef<number>(0);
	const reducedMotion = useRef(false);

	const initNodes = useCallback(() => {
		const nodes: Node[] = [];
		for (let i = 0; i < NODE_COUNT; i++) {
			nodes.push({
				x: Math.random() * width,
				y: Math.random() * height,
				vx: (Math.random() - 0.5) * 0.3,
				vy: (Math.random() - 0.5) * 0.3,
				color: COLORS[i % COLORS.length],
			});
		}
		nodesRef.current = nodes;
	}, [width, height]);

	useEffect(() => {
		reducedMotion.current = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (reducedMotion.current) return;

		initNodes();
		const svg = svgRef.current;
		if (!svg) return;

		const lineGroup = svg.querySelector("#pn-lines");
		const dotGroup = svg.querySelector("#pn-dots");
		if (!lineGroup || !dotGroup) return;

		// Pre-create SVG elements
		const maxConnections = NODE_COUNT * (NODE_COUNT - 1);
		const lines: SVGLineElement[] = [];
		for (let i = 0; i < maxConnections; i++) {
			const line = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"line",
			);
			line.setAttribute("stroke", "#00E5C0");
			line.setAttribute("stroke-width", "0.5");
			line.setAttribute("opacity", "0");
			lineGroup.appendChild(line);
			lines.push(line);
		}

		const dots: SVGCircleElement[] = [];
		for (let i = 0; i < NODE_COUNT; i++) {
			const circle = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"circle",
			);
			circle.setAttribute("r", "2");
			circle.setAttribute("fill", nodesRef.current[i]?.color ?? "#00E5C0");
			circle.setAttribute("opacity", "0.4");
			dotGroup.appendChild(circle);
			dots.push(circle);
		}

		function tick() {
			const nodes = nodesRef.current;
			let lineIdx = 0;

			// Update positions
			for (const node of nodes) {
				node.x += node.vx;
				node.y += node.vy;

				// Bounce off edges
				if (node.x < 0 || node.x > width) node.vx *= -1;
				if (node.y < 0 || node.y > height) node.vy *= -1;
				node.x = Math.max(0, Math.min(width, node.x));
				node.y = Math.max(0, Math.min(height, node.y));

				// Update dot positions
				const dot = dots[nodes.indexOf(node)];
				if (dot) {
					dot.setAttribute("cx", String(node.x));
					dot.setAttribute("cy", String(node.y));
				}
			}

			// Draw connections
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const dx = nodes[i].x - nodes[j].x;
					const dy = nodes[i].y - nodes[j].y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					const line = lines[lineIdx];
					if (!line) continue;

					if (dist < CONNECTION_DISTANCE) {
						const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15;
						line.setAttribute("x1", String(nodes[i].x));
						line.setAttribute("y1", String(nodes[i].y));
						line.setAttribute("x2", String(nodes[j].x));
						line.setAttribute("y2", String(nodes[j].y));
						line.setAttribute("opacity", String(opacity));
					} else {
						line.setAttribute("opacity", "0");
					}
					lineIdx++;
				}
			}

			rafRef.current = requestAnimationFrame(tick);
		}

		rafRef.current = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(rafRef.current);
		};
	}, [width, height, initNodes]);

	return (
		<motion.div
			className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
			aria-hidden="true"
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			viewport={{ once: true }}
			transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
		>
			{reducedMotion.current ? (
				<svg
					viewBox={`0 0 ${width} ${height}`}
					className="w-full h-full"
					preserveAspectRatio="xMidYMid slice"
				>
					{Array.from({ length: 12 }).map((_, i) => (
						<circle
							key={i}
							cx={(i * 73) % width}
							cy={(i * 47) % height}
							r="2"
							fill={COLORS[i % COLORS.length]}
							opacity="0.2"
						/>
					))}
				</svg>
			) : (
				<svg
					ref={svgRef}
					viewBox={`0 0 ${width} ${height}`}
					className="w-full h-full"
					preserveAspectRatio="xMidYMid slice"
				>
					<g id="pn-lines" />
					<g id="pn-dots" />
				</svg>
			)}
		</motion.div>
	);
}
