/**
 * Visual integration test for BPMN layout.
 *
 * Runs a realistic BPMN process through the full pipeline:
 * preprocessor → ELK → lane Y-assignment → validates + generates HTML preview.
 *
 * The HTML file can be opened in a browser to visually compare with Bizagi.
 */
import { describe, it, expect } from "vitest";
import { writeFileSync } from "fs";
import { join } from "path";
import ELK from "elkjs/lib/elk.bundled.js";
import { preprocessForElk, assignLaneYPositions } from "../bpmn-layout-preprocessor";
import { ELK_BPMN_CONFIG, LANE_H } from "../layout-constants";
import { dims, bpmnTag } from "../bpmn-builder";
import type { DiagramNode } from "../../types";

function makeNode(overrides: Partial<DiagramNode> & { id: string }): DiagramNode {
	return {
		type: "task",
		label: `Node ${overrides.id}`,
		state: "confirmed",
		connections: [],
		...overrides,
	};
}

/** Generate an HTML visualization of the layout for visual comparison */
function generateLayoutHtml(
	positions: Map<string, { x: number; y: number }>,
	nodes: DiagramNode[],
	laneLayouts: Array<{ name: string; y: number; height: number }>,
	backEdges: Set<string>,
	title: string,
): string {
	const poolHeaderW = 50;
	const offsetX = poolHeaderW + 20;
	const offsetY = 20;

	// Calculate canvas size
	let maxX = 0, maxY = 0;
	for (const [id, pos] of positions) {
		const n = nodes.find((n) => n.id === id);
		const d = n ? dims(n.type) : { w: 160, h: 80 };
		maxX = Math.max(maxX, pos.x + d.w + offsetX + 40);
		maxY = Math.max(maxY, pos.y + d.h + offsetY + 40);
	}
	for (const ll of laneLayouts) {
		maxY = Math.max(maxY, ll.y + ll.height + offsetY + 20);
	}

	// Color scheme (Bizagi-inspired)
	const colors: Record<string, { fill: string; stroke: string }> = {
		startEvent: { fill: "#F0FDF4", stroke: "#16A34A" },
		endEvent: { fill: "#FEF2F2", stroke: "#DC2626" },
		task: { fill: "#ECFDF5", stroke: "#3B82F6" },
		userTask: { fill: "#ECFDF5", stroke: "#3B82F6" },
		serviceTask: { fill: "#ECFDF5", stroke: "#3B82F6" },
		exclusiveGateway: { fill: "#FEF9C3", stroke: "#EAB308" },
		parallelGateway: { fill: "#FEF9C3", stroke: "#EAB308" },
	};

	let svgShapes = "";
	let svgEdges = "";

	// Draw lanes
	for (const ll of laneLayouts) {
		svgShapes += `
		<rect x="${poolHeaderW}" y="${ll.y + offsetY}" width="${maxX - poolHeaderW}" height="${ll.height}"
			fill="none" stroke="#CBD5E1" stroke-width="1" />
		<text x="${poolHeaderW / 2}" y="${ll.y + offsetY + ll.height / 2}"
			font-family="Inter, sans-serif" font-size="12" fill="#64748B"
			text-anchor="middle" dominant-baseline="middle"
			transform="rotate(-90, ${poolHeaderW / 2}, ${ll.y + offsetY + ll.height / 2})">${ll.name}</text>`;
	}

	// Draw pool header
	svgShapes += `
	<rect x="0" y="${offsetY}" width="${poolHeaderW}" height="${maxY - offsetY - 10}"
		fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5" rx="4" />
	<text x="${poolHeaderW / 2}" y="${offsetY + (maxY - offsetY - 10) / 2}"
		font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#334155"
		text-anchor="middle" dominant-baseline="middle"
		transform="rotate(-90, ${poolHeaderW / 2}, ${offsetY + (maxY - offsetY - 10) / 2})">Proceso</text>`;

	// Draw nodes
	for (const n of nodes) {
		const pos = positions.get(n.id);
		if (!pos) continue;
		const tag = bpmnTag(n.type);
		const d = dims(n.type);
		const c = colors[tag] || colors.task;
		const x = pos.x + offsetX;
		const y = pos.y + offsetY;

		if (tag === "startEvent" || tag === "endEvent") {
			const r = d.w / 2;
			svgShapes += `
			<circle cx="${x + r}" cy="${y + r}" r="${r}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.5" />
			<text x="${x + r}" y="${y + r + d.w + 14}" font-family="Inter, sans-serif" font-size="10" fill="#475569" text-anchor="middle">${n.label}</text>`;
		} else if (tag.includes("Gateway")) {
			const cx = x + d.w / 2;
			const cy = y + d.h / 2;
			const half = d.w / 2;
			svgShapes += `
			<polygon points="${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}"
				fill="${c.fill}" stroke="${c.stroke}" stroke-width="2" />
			<text x="${cx}" y="${cy}" font-family="Inter, sans-serif" font-size="16" fill="${c.stroke}" text-anchor="middle" dominant-baseline="middle">X</text>
			<text x="${cx}" y="${cy + half + 14}" font-family="Inter, sans-serif" font-size="10" fill="#475569" text-anchor="middle">${n.label}</text>`;
		} else {
			svgShapes += `
			<rect x="${x}" y="${y}" width="${d.w}" height="${d.h}" rx="8"
				fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" />
			<text x="${x + d.w / 2}" y="${y + d.h / 2}" font-family="Inter, sans-serif" font-size="11" fill="#1E293B" text-anchor="middle" dominant-baseline="middle">${n.label.length > 22 ? n.label.slice(0, 20) + "..." : n.label}</text>`;
		}
	}

	// Draw edges
	for (const n of nodes) {
		const srcPos = positions.get(n.id);
		if (!srcPos) continue;
		const srcD = dims(n.type);
		const srcTag = bpmnTag(n.type);

		for (const targetId of n.connections) {
			const tgtPos = positions.get(targetId);
			if (!tgtPos) continue;
			const tgt = nodes.find((nn) => nn.id === targetId);
			const tgtD = tgt ? dims(tgt.type) : { w: 160, h: 80 };
			const isBack = backEdges.has(`${n.id}->${targetId}`);

			const sx = srcPos.x + offsetX;
			const sy = srcPos.y + offsetY;
			const tx = tgtPos.x + offsetX;
			const ty = tgtPos.y + offsetY;

			const edgeColor = isBack ? "#DC2626" : "#64748B";
			const dashArray = isBack ? "6,3" : "none";

			if (isBack) {
				// Back-edge: goes down from source bottom, routes back to target bottom
				const srcCx = sx + srcD.w / 2;
				const srcBot = sy + srcD.h;
				const tgtCx = tx + tgtD.w / 2;
				const tgtBot = ty + tgtD.h;
				const routeY = Math.max(srcBot, tgtBot) + 30;
				svgEdges += `
				<polyline points="${srcCx},${srcBot} ${srcCx},${routeY} ${tgtCx},${routeY} ${tgtCx},${tgtBot}"
					fill="none" stroke="${edgeColor}" stroke-width="1.5" stroke-dasharray="${dashArray}"
					marker-end="url(#arrowRed)" />`;
			} else {
				// Forward edge: horizontal right exit → horizontal left entry
				const srcRight = sx + srcD.w;
				const srcMidY = sy + srcD.h / 2;
				const tgtLeft = tx;
				const tgtMidY = ty + tgtD.h / 2;

				if (Math.abs(srcMidY - tgtMidY) < 5) {
					// Same Y: straight line
					svgEdges += `
					<line x1="${srcRight}" y1="${srcMidY}" x2="${tgtLeft}" y2="${tgtMidY}"
						stroke="${edgeColor}" stroke-width="1.5" marker-end="url(#arrow)" />`;
				} else {
					// Different Y: orthogonal routing
					const midX = (srcRight + tgtLeft) / 2;
					svgEdges += `
					<polyline points="${srcRight},${srcMidY} ${midX},${srcMidY} ${midX},${tgtMidY} ${tgtLeft},${tgtMidY}"
						fill="none" stroke="${edgeColor}" stroke-width="1.5" marker-end="url(#arrow)" />`;
				}
			}
		}
	}

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
body { margin: 20px; font-family: 'Geist Sans', system-ui, sans-serif; background: #FAFAFA; }
h1 { font-size: 18px; color: #1E293B; margin-bottom: 4px; }
.meta { font-size: 12px; color: #64748B; margin-bottom: 16px; }
.canvas { background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; display: inline-block; }
.legend { margin-top: 12px; font-size: 11px; color: #64748B; }
.legend span { margin-right: 16px; }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="meta">Generated by bpmn-layout-visual.test.ts | ELK layered + BPMN preprocessor</p>
<div class="canvas">
<svg width="${maxX + 20}" height="${maxY + 40}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
			<path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
		</marker>
		<marker id="arrowRed" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
			<path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626" />
		</marker>
	</defs>
	${svgEdges}
	${svgShapes}
</svg>
</div>
<div class="legend">
	<span>&#9632; Forward flow</span>
	<span style="color:#DC2626">- - - Back-edge (loop)</span>
</div>
</body>
</html>`;
}

// ─── Test: Realistic BPMN Process ─────────────────────────────────────

describe("visual layout comparison", () => {
	it("generates correct layout for realistic 2-lane process with gateway loop", async () => {
		// Realistic process: "Solicitud de Compra"
		// Analista: Recibir solicitud → Verificar presupuesto → ¿Aprobado? → (sí) Generar orden
		// Gerente: Revisar solicitud → Aprobar/Rechazar
		// Gateway loop: if rejected, back to Analista "Corregir solicitud"
		const nodes: DiagramNode[] = [
			makeNode({ id: "start", type: "start_event", label: "Inicio", lane: "Analista", connections: ["t1"] }),
			makeNode({ id: "t1", label: "Recibir solicitud", lane: "Analista", connections: ["t2"] }),
			makeNode({ id: "t2", label: "Verificar presupuesto", lane: "Analista", connections: ["t3"] }),
			makeNode({ id: "t3", label: "Revisar solicitud", lane: "Gerente", connections: ["gw1"] }),
			makeNode({ id: "gw1", type: "exclusive_gateway", label: "¿Aprobada?", lane: "Gerente", connections: ["t4", "t5"] }),
			makeNode({ id: "t4", label: "Generar orden de compra", lane: "Analista", connections: ["end"] }),
			makeNode({ id: "t5", label: "Corregir solicitud", lane: "Analista", connections: ["t2"] }), // back to t2 = loop!
			makeNode({ id: "end", type: "end_event", label: "Fin", lane: "Analista" }),
		];

		const pp = preprocessForElk(nodes);

		// Validate back-edge detection
		expect(pp.backEdges.has("t5->t2")).toBe(true);
		expect(pp.backEdges.size).toBe(1);

		// Run ELK
		const elk = new ELK();
		const elkResult = await elk.layout({
			id: "root",
			layoutOptions: { ...ELK_BPMN_CONFIG },
			children: pp.elkNodes.map(({ _lane, ...n }) => n),
			edges: pp.elkEdges,
		});

		const { positions, laneLayouts } = assignLaneYPositions(elkResult, pp, LANE_H, 50);

		// ─── Validate layout properties ───────────────────────────────

		const pos = (id: string) => positions.get(id)!;

		// 1. Left-to-right flow order (forward edges only)
		expect(pos("start").x).toBeLessThan(pos("t1").x);
		expect(pos("t1").x).toBeLessThan(pos("t2").x);
		expect(pos("t2").x).toBeLessThan(pos("t3").x);
		expect(pos("t3").x).toBeLessThan(pos("gw1").x);
		// After gateway, both paths should be to the right
		expect(pos("gw1").x).toBeLessThan(pos("t4").x);
		expect(pos("gw1").x).toBeLessThan(pos("t5").x);
		expect(pos("t4").x).toBeLessThan(pos("end").x);

		// 2. Lanes: Analista and Gerente in different Y bands
		expect(laneLayouts).toHaveLength(2);
		expect(laneLayouts[0].name).toBe("Analista");
		expect(laneLayouts[1].name).toBe("Gerente");

		// Analista nodes should be in Analista Y band
		const analistaY = laneLayouts[0].y;
		const analistaH = laneLayouts[0].height;
		const gerenteY = laneLayouts[1].y;
		const gerenteH = laneLayouts[1].height;

		for (const id of ["start", "t1", "t2", "t4", "t5", "end"]) {
			const p = pos(id);
			expect(p.y).toBeGreaterThanOrEqual(analistaY);
			expect(p.y).toBeLessThan(analistaY + analistaH);
		}

		// Gerente nodes in Gerente Y band
		for (const id of ["t3", "gw1"]) {
			const p = pos(id);
			expect(p.y).toBeGreaterThanOrEqual(gerenteY);
			expect(p.y).toBeLessThan(gerenteY + gerenteH);
		}

		// 3. No overlapping nodes
		const allPositions = [...positions.entries()];
		for (let i = 0; i < allPositions.length; i++) {
			for (let j = i + 1; j < allPositions.length; j++) {
				const [idA, posA] = allPositions[i];
				const [idB, posB] = allPositions[j];
				const dA = dims(nodes.find((n) => n.id === idA)!.type);
				const dB = dims(nodes.find((n) => n.id === idB)!.type);

				const overlapX = posA.x < posB.x + dB.w && posA.x + dA.w > posB.x;
				const overlapY = posA.y < posB.y + dB.h && posA.y + dA.h > posB.y;

				if (overlapX && overlapY) {
					throw new Error(`Nodes ${idA} and ${idB} overlap! A=(${posA.x},${posA.y} ${dA.w}x${dA.h}) B=(${posB.x},${posB.y} ${dB.w}x${dB.h})`);
				}
			}
		}

		// ─── Generate HTML visualization ──────────────────────────────
		const html = generateLayoutHtml(
			positions, nodes, laneLayouts, pp.backEdges,
			"Solicitud de Compra — 2 Lanes + Gateway Loop",
		);
		const outPath = join("/tmp", "bpmn-layout-test.html");
		writeFileSync(outPath, html);
		console.log(`\n  Visual preview: ${outPath}\n  Open in browser to compare with Bizagi.\n`);
	});

	it("generates layout for simple linear 3-lane process", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s", type: "start_event", label: "Inicio", lane: "Solicitante", connections: ["t1"] }),
			makeNode({ id: "t1", label: "Crear solicitud", lane: "Solicitante", connections: ["t2"] }),
			makeNode({ id: "t2", label: "Evaluar solicitud", lane: "Evaluador", connections: ["t3"] }),
			makeNode({ id: "t3", label: "Aprobar solicitud", lane: "Director", connections: ["t4"] }),
			makeNode({ id: "t4", label: "Notificar resultado", lane: "Solicitante", connections: ["e"] }),
			makeNode({ id: "e", type: "end_event", label: "Fin", lane: "Solicitante" }),
		];

		const pp = preprocessForElk(nodes);
		expect(pp.backEdges.size).toBe(0); // No loops

		const elk = new ELK();
		const elkResult = await elk.layout({
			id: "root",
			layoutOptions: { ...ELK_BPMN_CONFIG },
			children: pp.elkNodes.map(({ _lane, ...n }) => n),
			edges: pp.elkEdges,
		});

		const { positions, laneLayouts } = assignLaneYPositions(elkResult, pp, LANE_H, 50);

		const pos = (id: string) => positions.get(id)!;

		// Strict L→R order
		expect(pos("s").x).toBeLessThan(pos("t1").x);
		expect(pos("t1").x).toBeLessThan(pos("t2").x);
		expect(pos("t2").x).toBeLessThan(pos("t3").x);
		expect(pos("t3").x).toBeLessThan(pos("t4").x);
		expect(pos("t4").x).toBeLessThan(pos("e").x);

		// 3 lanes
		expect(laneLayouts).toHaveLength(3);
		expect(laneLayouts.map((l) => l.name)).toEqual(["Solicitante", "Evaluador", "Director"]);

		// Generate HTML
		const html = generateLayoutHtml(
			positions, nodes, laneLayouts, pp.backEdges,
			"Solicitud Simple — 3 Lanes, Sin Loops",
		);
		const outPath = join("/tmp", "bpmn-layout-test-simple.html");
		writeFileSync(outPath, html);
		console.log(`\n  Visual preview: ${outPath}\n`);
	});
});
