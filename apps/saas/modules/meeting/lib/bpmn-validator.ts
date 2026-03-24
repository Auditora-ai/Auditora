/**
 * BPMN Diagram Validator
 *
 * Two-level validation:
 * 1. Structural: orphans, cycles, dead ends, invalid refs
 * 2. Best Practices: BPMN 2.0 methodology (naming, gateways, lanes, flow conditions)
 */

import type { DiagramNode } from "../types";

export interface DiagramWarning {
	type:
		| "orphan"
		| "cycle"
		| "duplicate"
		| "dead_end"
		| "missing_connection"
		| "invalid_ref"
		| "naming"
		| "gateway_label"
		| "gateway_no_conditions"
		| "gateway_no_merge"
		| "lane_inconsistency"
		| "missing_start"
		| "missing_end"
		| "task_as_decision";
	nodeId: string;
	message: string;
	severity: "info" | "warning" | "error";
	/** Suggested fix for best practice violations */
	suggestion?: string;
}

export interface ValidationResult {
	valid: boolean;
	warnings: DiagramWarning[];
	/** True if the diagram has problems severe enough to warrant auto-repair */
	needsRepair: boolean;
	/** Best practices score 0-100 */
	bestPracticesScore: number;
}

/**
 * Full validation: structural + best practices.
 */
export function validateDiagram(inputNodes: DiagramNode[]): ValidationResult {
	const nodes = inputNodes.filter((n) => n.state !== "rejected");
	const structural = validateStructure(nodes);
	const bestPractices = validateBestPractices(nodes);

	const allWarnings = [...structural, ...bestPractices];
	const errorCount = allWarnings.filter((w) => w.severity === "error").length;
	const warningCount = allWarnings.filter((w) => w.severity === "warning").length;
	const bpWarnings = bestPractices.length;
	const bpTotal = nodes.length * 3; // ~3 rules checked per node
	const bestPracticesScore = bpTotal > 0 ? Math.max(0, Math.round(100 - (bpWarnings / bpTotal) * 100)) : 100;

	return {
		valid: errorCount === 0,
		warnings: allWarnings,
		needsRepair: errorCount > 0 || warningCount >= 3,
		bestPracticesScore,
	};
}

/**
 * Structural validation only (fast, used during live polling).
 */
function validateStructure(nodes: DiagramNode[]): DiagramWarning[] {
	const warnings: DiagramWarning[] = [];
	const nodeIds = new Set(nodes.map((n) => n.id));

	// 1. Invalid connection references
	for (const node of nodes) {
		for (const targetId of node.connections) {
			if (!nodeIds.has(targetId)) {
				warnings.push({
					type: "invalid_ref",
					nodeId: node.id,
					message: `"${node.label}" conecta a un nodo inexistente`,
					severity: "warning",
				});
			}
		}
	}

	// 2. Orphaned nodes
	const hasIncoming = new Set<string>();
	for (const node of nodes) {
		for (const targetId of node.connections) {
			hasIncoming.add(targetId);
		}
	}
	for (const node of nodes) {
		if (node.connections.length === 0 && !hasIncoming.has(node.id) && nodes.length > 1) {
			warnings.push({
				type: "orphan",
				nodeId: node.id,
				message: `"${node.label}" esta desconectado del flujo`,
				severity: "warning",
			});
		}
	}

	// 3. Dead ends
	for (const node of nodes) {
		if (
			node.connections.length === 0 &&
			hasIncoming.has(node.id) &&
			!isEndEvent(node.type)
		) {
			const hasFlowingNodes = nodes.some((n) => n.connections.length > 0);
			if (hasFlowingNodes) {
				warnings.push({
					type: "dead_end",
					nodeId: node.id,
					message: `"${node.label}" no tiene salida (dead end)`,
					severity: "info",
				});
			}
		}
	}

	// 4. Duplicates
	const seen = new Map<string, string>();
	for (const node of nodes) {
		const key = `${node.label.toLowerCase().trim()}|${node.type}|${(node.lane || "").toLowerCase().trim()}`;
		const existing = seen.get(key);
		if (existing) {
			warnings.push({
				type: "duplicate",
				nodeId: node.id,
				message: `"${node.label}" parece ser duplicado`,
				severity: "warning",
			});
		} else {
			seen.set(key, node.id);
		}
	}

	// 5. Simple cycles
	const nodeMap = new Map(nodes.map((n) => [n.id, n]));
	for (const node of nodes) {
		for (const targetId of node.connections) {
			const target = nodeMap.get(targetId);
			if (target && target.connections.includes(node.id)) {
				const isGateway =
					isGatewayType(node.type) || isGatewayType(target.type);
				if (!isGateway) {
					warnings.push({
						type: "cycle",
						nodeId: node.id,
						message: `Ciclo entre "${node.label}" y "${target.label}" sin gateway`,
						severity: "error",
					});
				}
			}
		}
	}

	return warnings;
}

/**
 * BPMN 2.0 best practices validation.
 */
function validateBestPractices(nodes: DiagramNode[]): DiagramWarning[] {
	const warnings: DiagramWarning[] = [];
	if (nodes.length < 2) return warnings;

	// --- Connection rules (BPMN structural rules) ---
	for (const node of nodes) {
		// Rule: Tasks/Events can have MAX 1 outgoing connection
		if (node.connections.length > 1 && !isGatewayType(node.type) && !isStartEvent(node.type)) {
			warnings.push({
				type: "task_as_decision",
				nodeId: node.id,
				message: `"${node.label}" tiene ${node.connections.length} salidas — solo gateways pueden tener multiples salidas`,
				severity: "error",
				suggestion: `Convertir a gateway o mantener solo 1 conexion de salida`,
			});
		}

		// Rule: Start event should have exactly 1 outgoing
		if (isStartEvent(node.type) && node.connections.length > 1) {
			warnings.push({
				type: "task_as_decision",
				nodeId: node.id,
				message: `Evento de inicio tiene ${node.connections.length} salidas — debe tener solo 1`,
				severity: "error",
				suggestion: `Conectar inicio a una sola tarea o gateway`,
			});
		}

		// Rule: Gateways must have 2+ outgoing connections
		if (isGatewayType(node.type) && node.connections.length < 2 && node.connections.length > 0) {
			warnings.push({
				type: "gateway_no_conditions",
				nodeId: node.id,
				message: `Gateway "${node.label}" tiene solo ${node.connections.length} salida — necesita minimo 2`,
				severity: "warning",
				suggestion: `Agregar la rama alternativa (Si/No)`,
			});
		}

		// Rule: No node should connect to itself
		if (node.connections.includes(node.id)) {
			warnings.push({
				type: "cycle",
				nodeId: node.id,
				message: `"${node.label}" se conecta a si mismo`,
				severity: "error",
				suggestion: `Eliminar auto-conexion`,
			});
		}
	}

	// Rule: Process must have a connected path from start to end
	const startNodes = nodes.filter(n => isStartEvent(n.type));
	const endNodes = nodes.filter(n => isEndEvent(n.type));
	if (endNodes.length > 0 && startNodes.length > 0) {
		// Check if end is reachable from start
		const reachable = new Set<string>();
		const queue = startNodes.map(n => n.id);
		const nodeMap = new Map(nodes.map(n => [n.id, n]));
		while (queue.length > 0) {
			const id = queue.shift()!;
			if (reachable.has(id)) continue;
			reachable.add(id);
			const n = nodeMap.get(id);
			if (n) {
				for (const target of n.connections) {
					if (!reachable.has(target)) queue.push(target);
				}
			}
		}
		const unreachableFromStart = nodes.filter(n =>
			!isStartEvent(n.type) && !reachable.has(n.id) && n.state !== "rejected"
		);
		for (const n of unreachableFromStart) {
			warnings.push({
				type: "orphan",
				nodeId: n.id,
				message: `"${n.label}" no es alcanzable desde el inicio del proceso`,
				severity: "warning",
				suggestion: `Conectar a la secuencia principal del proceso`,
			});
		}
	}

	// --- Naming rules ---
	for (const node of nodes) {
		const label = node.label.trim();
		if (!label) continue;

		if (isTaskType(node.type)) {
			// Tasks should be verb + noun
			if (isNounOnly(label)) {
				warnings.push({
					type: "naming",
					nodeId: node.id,
					message: `Tarea "${label}" deberia usar formato verbo + sustantivo`,
					severity: "info",
					suggestion: suggestVerbNoun(label),
				});
			}
		}

		if (isGatewayType(node.type)) {
			// Gateways should be questions
			if (!label.includes("?") && !label.startsWith("¿")) {
				warnings.push({
					type: "gateway_label",
					nodeId: node.id,
					message: `Gateway "${label}" deberia ser una pregunta`,
					severity: "warning",
					suggestion: `¿${label}?`,
				});
			}
		}
	}

	// --- Gateway flow conditions ---
	for (const node of nodes) {
		if (isGatewayType(node.type) && node.connections.length >= 2) {
			const labels = node.connectionLabels || [];
			const hasLabels = labels.some((l) => l && l.trim().length > 0);
			if (!hasLabels) {
				warnings.push({
					type: "gateway_no_conditions",
					nodeId: node.id,
					message: `Gateway "${node.label}" necesita etiquetas en sus flujos (Si/No)`,
					severity: "warning",
					suggestion: 'Agregar "Si" y "No" a las flechas de salida',
				});
			}
		}
	}

	// --- Gateway split without merge ---
	const nodeMap = new Map(nodes.map((n) => [n.id, n]));
	for (const node of nodes) {
		if (isGatewayType(node.type) && node.connections.length >= 2) {
			// Check if there's a downstream merge gateway
			const hasMerge = findMergeGateway(node, nodeMap);
			if (!hasMerge) {
				warnings.push({
					type: "gateway_no_merge",
					nodeId: node.id,
					message: `Gateway "${node.label}" divide el flujo pero no tiene gateway de reunion`,
					severity: "info",
					suggestion: "Agregar un gateway exclusivo donde los caminos se reunen",
				});
			}
		}
	}

	// --- Missing start/end ---
	const hasStart = nodes.some((n) => isStartEvent(n.type));
	const hasEnd = nodes.some((n) => isEndEvent(n.type));
	if (!hasStart && nodes.length >= 3) {
		warnings.push({
			type: "missing_start",
			nodeId: nodes[0].id,
			message: "El proceso no tiene evento de inicio",
			severity: "warning",
		});
	}
	if (!hasEnd && nodes.length >= 3) {
		warnings.push({
			type: "missing_end",
			nodeId: nodes[nodes.length - 1].id,
			message: "El proceso no tiene evento de fin",
			severity: "warning",
		});
	}

	// --- Task used as decision ---
	for (const node of nodes) {
		if (isTaskType(node.type) && node.connections.length >= 2) {
			const label = node.label.toLowerCase();
			const decisionWords = ["aprobar", "rechazar", "decidir", "evaluar", "verificar", "validar", "autorizar"];
			if (decisionWords.some((w) => label.includes(w))) {
				warnings.push({
					type: "task_as_decision",
					nodeId: node.id,
					message: `"${node.label}" parece una decision — deberia ser un gateway`,
					severity: "warning",
					suggestion: `Cambiar a exclusiveGateway: "¿${node.label}?"`,
				});
			}
		}
	}

	// --- Lane consistency ---
	const laneNames = nodes.map((n) => n.lane).filter(Boolean) as string[];
	const laneGroups = new Map<string, string[]>();
	for (const lane of laneNames) {
		const normalized = lane.toLowerCase().trim();
		if (!laneGroups.has(normalized)) {
			laneGroups.set(normalized, []);
		}
		laneGroups.get(normalized)!.push(lane);
	}
	// Check for similar but not identical lane names
	const laneKeys = Array.from(laneGroups.keys());
	for (let i = 0; i < laneKeys.length; i++) {
		for (let j = i + 1; j < laneKeys.length; j++) {
			if (areSimilarLanes(laneKeys[i], laneKeys[j])) {
				const node = nodes.find((n) => n.lane?.toLowerCase().trim() === laneKeys[j]);
				if (node) {
					warnings.push({
						type: "lane_inconsistency",
						nodeId: node.id,
						message: `Lane "${node.lane}" es similar a "${laneGroups.get(laneKeys[i])![0]}"`,
						severity: "info",
						suggestion: `Unificar a un solo nombre de lane`,
					});
				}
			}
		}
	}

	return warnings;
}

// --- Helpers ---

function isTaskType(type: string): boolean {
	const t = type.toLowerCase();
	return t === "task" || t === "usertask" || t === "user_task" ||
		t === "servicetask" || t === "service_task" || t === "manualtask" || t === "manual_task";
}

function isGatewayType(type: string): boolean {
	const t = type.toLowerCase();
	return t.includes("gateway");
}

function isStartEvent(type: string): boolean {
	const t = type.toLowerCase();
	return t === "startevent" || t === "start_event";
}

function isEndEvent(type: string): boolean {
	const t = type.toLowerCase();
	return t === "endevent" || t === "end_event";
}

function isNounOnly(label: string): boolean {
	// Common Spanish noun endings without verb prefix
	const nounPatterns = /^(la |el |los |las |un |una )?(revisión|aprobación|validación|verificación|evaluación|notificación|solicitud|registro|documento|informe|reporte|análisis|gestión|control|proceso|procedimiento)$/i;
	return nounPatterns.test(label.trim());
}

function suggestVerbNoun(label: string): string {
	const suggestions: Record<string, string> = {
		"revisión": "Revisar documento",
		"aprobación": "Aprobar solicitud",
		"validación": "Validar datos",
		"verificación": "Verificar información",
		"evaluación": "Evaluar caso",
		"notificación": "Enviar notificación",
		"registro": "Registrar información",
		"análisis": "Analizar datos",
		"gestión": "Gestionar caso",
		"control": "Controlar proceso",
	};
	const lower = label.toLowerCase().replace(/^(la |el |los |las |un |una )/, "").trim();
	return suggestions[lower] || `Realizar ${label.toLowerCase()}`;
}

function findMergeGateway(splitGateway: DiagramNode, nodeMap: Map<string, DiagramNode>): boolean {
	// BFS downstream from each branch, looking for a common gateway
	const branches = splitGateway.connections;
	if (branches.length < 2) return true;

	const visited = new Set<string>();
	const reachable = new Map<string, Set<string>>(); // nodeId → which branches reach it

	for (const branchStart of branches) {
		const queue = [branchStart];
		const branchVisited = new Set<string>();
		while (queue.length > 0) {
			const current = queue.shift()!;
			if (branchVisited.has(current)) continue;
			branchVisited.add(current);
			visited.add(current);

			if (!reachable.has(current)) reachable.set(current, new Set());
			reachable.get(current)!.add(branchStart);

			const node = nodeMap.get(current);
			if (node) {
				for (const next of node.connections) {
					if (!branchVisited.has(next)) queue.push(next);
				}
			}
		}
	}

	// A merge point is a gateway node reachable from 2+ branches
	for (const [nodeId, fromBranches] of reachable) {
		if (fromBranches.size >= 2) {
			const node = nodeMap.get(nodeId);
			if (node && isGatewayType(node.type)) return true;
		}
	}
	return false;
}

function areSimilarLanes(a: string, b: string): boolean {
	// Simple similarity: one contains the other, or Levenshtein-like
	if (a.includes(b) || b.includes(a)) return true;
	// Check for common abbreviations
	const normalize = (s: string) => s.replace(/\s+/g, "").replace(/[.-]/g, "");
	return normalize(a) === normalize(b);
}
