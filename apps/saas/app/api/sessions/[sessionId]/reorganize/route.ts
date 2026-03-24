/**
 * Smart Reorganize API
 *
 * POST /api/sessions/[sessionId]/reorganize
 *
 * Acts as a BPM consultant: evaluates all nodes, removes what doesn't
 * belong, fixes lanes, determines correct flow, updates DB.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: { processDefinition: true },
		});

		// Pre-clean: reject nodes without lane (junk from pattern library)
		await db.diagramNode.updateMany({
			where: { sessionId, lane: null, state: { not: "REJECTED" },
				nodeType: { notIn: ["START_EVENT", "END_EVENT"] } },
			data: { state: "REJECTED", rejectedAt: new Date() },
		});
		// Also reject nodes with lane = empty string
		await db.diagramNode.updateMany({
			where: { sessionId, lane: "", state: { not: "REJECTED" },
				nodeType: { notIn: ["START_EVENT", "END_EVENT"] } },
			data: { state: "REJECTED", rejectedAt: new Date() },
		});

		const allNodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
			orderBy: { createdAt: "asc" },
		});

		if (allNodes.length < 2) {
			return NextResponse.json({ ok: true, message: "Not enough nodes" });
		}

		console.log(`[Reorganize] ${allNodes.length} nodes after pre-clean`);

		// Get transcript for context
		const transcript = await db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { createdAt: "asc" },
			take: 50,
		});

		const processName = session?.processDefinition?.name || "Proceso";
		const processDesc = session?.processDefinition?.description || "";

		const nodeList = allNodes.map((n) =>
			`- id:"${n.id}" type:${n.nodeType} label:"${n.label}" lane:${n.lane || "SIN_LANE"}`,
		).join("\n");

		const transcriptText = transcript
			.map((t) => `${t.speaker}: ${t.text}`)
			.join("\n")
			.substring(0, 3000);

		const { text } = await generateText({
			model: anthropic("claude-sonnet-4-6"),
			system: `Eres un consultor senior de BPM revisando un diagrama BPMN generado por IA durante una sesión de elicitación de procesos.

TU ROL: Actúa como un ingeniero modelador profesional. Tu trabajo es limpiar, corregir y organizar el diagrama para que sea un entregable profesional.

PROCESO: "${processName}"${processDesc ? ` — ${processDesc}` : ""}

EVALUACIÓN DE CADA NODO — Para cada nodo, evalúa:
1. ¿Fue mencionado en la conversación o es relevante al proceso "${processName}"?
2. ¿Tiene un nombre correcto (verbo + sustantivo para tareas, pregunta para gateways)?
3. ¿Está en el lane correcto (quién hace esta actividad)?
4. ¿Es un duplicado de otro nodo?

REGLAS DE LIMPIEZA:
- ELIMINA nodos que NO pertenecen al proceso (ej: "Solicitar información" genérico sin contexto)
- ELIMINA nodos que NO fueron discutidos en la conversación
- ELIMINA duplicados (misma actividad con diferente nombre)
- CORRIGE labels: tareas = verbo + sustantivo, gateways = pregunta con ¿?
- CORRIGE lanes: asigna el rol/área correcto basado en el contexto
- CORRIGE tipos: si una "tarea" es realmente una decisión, cámbiala a exclusiveGateway

REGLAS DE CONEXIÓN:
- El proceso fluye de INICIO a FIN en una secuencia lógica
- Tareas/eventos: exactamente 1 salida
- Gateways exclusivos: exactamente 2 salidas (Sí/No o las condiciones correctas)
- Gateways paralelos: 2+ salidas que se ejecutan simultáneamente
- DEBE haber un camino completo de inicio a fin
- Los gateways que dividen DEBEN tener un gateway que reúne los caminos

CRITICAL: Output ONLY a JSON object. NO text before or after. NO markdown. NO explanations. Start your response with { and end with }.

JSON format:
{
  "keep": [
    {
      "id": "existing_node_id",
      "label": "Label corregido si necesario",
      "type": "tipo corregido si necesario (task, userTask, exclusiveGateway, etc)",
      "lane": "Lane corregido si necesario",
      "targets": ["id_del_siguiente_nodo"],
      "targetLabels": ["", ""]
    }
  ],
  "remove": ["id_de_nodo_a_eliminar", ...],
  "reasoning": "Explicación breve de los cambios"
}

IMPORTANTE:
- "keep" incluye SOLO los nodos que deben quedarse, con sus datos CORREGIDOS
- "remove" incluye los IDs de nodos que no pertenecen al proceso
- Cada nodo en "keep" debe tener "targets" (excepto el evento de fin)
- Los targets deben referenciar IDs de nodos que están en "keep"
- targetLabels son las etiquetas de los flujos (solo para gateways: "Sí", "No", etc)`,
			prompt: `NODOS ACTUALES DEL DIAGRAMA:
${nodeList}

CONVERSACIÓN (contexto de lo que se discutió):
${transcriptText || "(sin transcripción disponible)"}

Revisa cada nodo, elimina lo que no pertenece, corrige lo que esté mal, y organiza las conexiones en un flujo lógico profesional.`,
			maxOutputTokens: 4096,
			temperature: 0.1,
		});

		// Parse result — extract JSON even if AI added text around it
		let result: any;
		try {
			// Try direct parse first
			const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
			result = JSON.parse(cleaned);
		} catch {
			// Try to find JSON object in the response
			const jsonMatch = text.match(/\{[\s\S]*"keep"[\s\S]*\}/);
			if (jsonMatch) {
				try {
					result = JSON.parse(jsonMatch[0]);
				} catch {
					console.error("[Reorganize] Failed to parse AI response:", text.substring(0, 300));
					return NextResponse.json({ error: "AI response parse failed" }, { status: 422 });
				}
			} else {
				console.error("[Reorganize] No JSON found in AI response:", text.substring(0, 300));
				return NextResponse.json({ error: "AI response parse failed" }, { status: 422 });
			}
		}

		const validIds = new Set(allNodes.map((n) => n.id));

		// Step 1: Delete removed nodes
		const removeIds = (result.remove || []).filter((id: string) => validIds.has(id));
		if (removeIds.length > 0) {
			await db.diagramNode.updateMany({
				where: { id: { in: removeIds } },
				data: { state: "REJECTED", rejectedAt: new Date() },
			});
			console.log(`[Reorganize] Rejected ${removeIds.length} nodes`);
		}

		// Step 2: Update kept nodes (label, type, lane, connections)
		let updated = 0;
		const keepIds = new Set<string>();
		for (const node of result.keep || []) {
			if (!node.id || !validIds.has(node.id)) continue;
			keepIds.add(node.id);

			const updateData: any = {};
			if (node.label) updateData.label = node.label;
			if (node.type) {
				const typeMap: Record<string, string> = {
					task: "TASK", usertask: "USER_TASK", userTask: "USER_TASK",
					servicetask: "SERVICE_TASK", serviceTask: "SERVICE_TASK",
					exclusivegateway: "EXCLUSIVE_GATEWAY", exclusiveGateway: "EXCLUSIVE_GATEWAY",
					parallelgateway: "PARALLEL_GATEWAY", parallelGateway: "PARALLEL_GATEWAY",
					startevent: "START_EVENT", startEvent: "START_EVENT",
					endevent: "END_EVENT", endEvent: "END_EVENT",
				};
				const mapped = typeMap[node.type] || typeMap[node.type.toLowerCase()];
				if (mapped) updateData.nodeType = mapped;
			}
			if (node.lane) updateData.lane = node.lane;

			// Update connections
			const targets = (node.targets || []).filter((t: string) => validIds.has(t));
			updateData.connections = targets;

			await db.diagramNode.update({
				where: { id: node.id },
				data: updateData,
			});
			updated++;
		}

		// Step 3: Reject any nodes not in keep list and not already removed
		const notKept = allNodes
			.filter((n) => !keepIds.has(n.id) && !removeIds.includes(n.id))
			.map((n) => n.id);
		if (notKept.length > 0) {
			await db.diagramNode.updateMany({
				where: { id: { in: notKept } },
				data: { state: "REJECTED", rejectedAt: new Date() },
			});
			console.log(`[Reorganize] Rejected ${notKept.length} nodes not in keep list`);
		}

		console.log(`[Reorganize] Updated ${updated} nodes, removed ${removeIds.length + notKept.length}`);
		console.log(`[Reorganize] Reasoning: ${result.reasoning}`);

		// Return cleaned nodes
		const finalNodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
		});

		return NextResponse.json({
			ok: true,
			updated,
			removed: removeIds.length + notKept.length,
			reasoning: result.reasoning,
			nodes: finalNodes.map((n) => ({
				id: n.id,
				type: n.nodeType.toLowerCase(),
				label: n.label,
				state: n.state.toLowerCase(),
				lane: n.lane || undefined,
				connections: n.connections || [],
				confidence: n.confidence,
			})),
		});
	} catch (error) {
		console.error("[Reorganize] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
