/**
 * Procedure Chat API
 *
 * POST — intelligent conversation to build procedure step by step
 *
 * The AI analyzes what's missing, asks the right questions,
 * and progressively fills the procedure fields from user answers.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";
import { instrumentedGenerateText } from "@repo/ai";

type Params = { params: Promise<{ sessionId: string; nodeId: string }> };

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

const SYSTEM_PROMPT = `Eres un consultor BPM senior ayudando a documentar un procedimiento de trabajo (SOP) para una actividad específica. Tu trabajo es hacer las preguntas correctas para llenar los campos del procedimiento.

CONTEXTO que recibes:
- Nombre de la actividad y proceso
- Propiedades ya conocidas del nodo (de la sesión de elicitación)
- Extractos del transcript donde se mencionó esta actividad
- Historial de la conversación contigo
- Procedimiento parcial si ya existe

TU COMPORTAMIENTO:
1. Analiza qué información YA tienes (propiedades, transcript) y qué FALTA
2. No preguntes lo que ya sabes — confirma brevemente y pregunta lo siguiente
3. Haz UNA pregunta a la vez, específica y clara
4. Si algo NO APLICA para esta actividad (ej: SLA para una tarea de sistema automática), dilo y salta al siguiente campo
5. Cuando tengas suficiente información para un campo, actualízalo en el JSON de respuesta
6. Prioriza: pasos del procedimiento > excepciones > sistemas > tiempos > controles

CAMPOS DEL PROCEDIMIENTO:
- objective: Qué logra este procedimiento
- scope: Cuándo y dónde aplica
- responsible: Rol que ejecuta
- frequency: Con qué frecuencia (diario, semanal, por evento, etc.)
- prerequisites: Qué debe ser verdad antes de empezar
- steps: Pasos detallados (acción, descripción, responsable, sistemas, entradas, salidas, controles, excepciones, tiempo estimado)
- indicators: KPIs para medir
- gaps: Información que falta

RESPONDE SIEMPRE EN JSON:
{
  "message": "Tu mensaje/pregunta al usuario (en español, natural, conciso)",
  "updatedFields": ["campo1", "campo2"],
  "procedureUpdate": { ... campos actualizados del PROCEDIMIENTO, solo los que cambiaron ... },
  "propertiesUpdate": { ... campos actualizados de las PROPIEDADES del nodo si aplica ... },
  "completeness": 0.0-1.0,
  "nextFieldToFill": "nombre del siguiente campo a preguntar o null si completo"
}

CAMPOS DE PROPIEDADES DEL NODO (propertiesUpdate) — mapea a estos cuando la info aplique:
- description: string (descripción general de la actividad)
- responsable: string (rol responsable)
- slaValue: number + slaUnit: "minutes"|"hours"|"days"
- frequency: "daily"|"weekly"|"monthly"|"per_event"
- frequencyCount: number
- estimatedDuration: number (minutos)
- systems: string[] (sistemas usados, ej: ["SAP", "CRM"])
- inputs: string[] (documentos/datos de entrada)
- outputs: string[] (documentos/datos de salida)
- costPerExecution: number
- costCurrency: string

Si el usuario menciona un sistema, tiempo, responsable, etc., SIEMPRE incluye propertiesUpdate además de procedureUpdate.

REGLAS:
- Sé conciso y directo — esto es una sesión de trabajo, no una clase
- Usa lenguaje natural en español
- Si el usuario dice algo vago ("normal", "lo de siempre"), pide especificidad
- Si tienes info del transcript, úsala: "Según lo que comentaron en la sesión, [cita]. ¿Es correcto?"
- Cuando completes un campo, muestra brevemente qué registraste con ✓`;

export async function POST(request: NextRequest, { params }: Params) {
	try {
		const { sessionId, nodeId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;
		const { session } = authResult;

		const body = await request.json();
		const { message, history = [] } = body as { message: string; history: ChatMessage[] };

		if (!message?.trim()) {
			return NextResponse.json({ error: "message required" }, { status: 400 });
		}

		const node = await db.diagramNode.findFirst({
			where: { id: nodeId, sessionId },
		});

		if (!node) {
			return NextResponse.json({ error: "Node not found" }, { status: 404 });
		}

		// Get relevant transcript excerpts
		const transcriptEntries = await db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "asc" },
			select: { text: true, speaker: true },
		});

		const nodeLabel = node.label.toLowerCase();
		const props = (node.properties as Record<string, any>) || {};
		const procedure = (node.procedure as Record<string, any>) || null;

		const keywords = [nodeLabel, ...(props.systems || []), ...(props.inputs || []), ...(props.outputs || [])].map(k => k?.toLowerCase()).filter(Boolean);
		const relevantExcerpts = transcriptEntries
			.filter(t => keywords.some(kw => t.text.toLowerCase().includes(kw)))
			.slice(0, 15)
			.map(t => `[${t.speaker || "?"}] ${t.text}`);

		// Get process name
		const processName = session.processDefinition?.name || "Proceso";

		// Build user prompt with full context
		const contextBlock = [
			`ACTIVIDAD: ${node.label}`,
			`PROCESO: ${processName}`,
			node.lane ? `LANE/ROL: ${node.lane}` : null,
			`TIPO: ${node.nodeType}`,
			props.description ? `DESCRIPCIÓN EXISTENTE: ${props.description}` : null,
			props.systems?.length > 0 ? `SISTEMAS CONOCIDOS: ${props.systems.join(", ")}` : null,
			props.inputs?.length > 0 ? `ENTRADAS CONOCIDAS: ${props.inputs.join(", ")}` : null,
			props.outputs?.length > 0 ? `SALIDAS CONOCIDAS: ${props.outputs.join(", ")}` : null,
			props.slaValue ? `SLA: ${props.slaValue} ${props.slaUnit || ""}` : null,
			props.responsable ? `RESPONSABLE: ${props.responsable}` : null,
			relevantExcerpts.length > 0 ? `\nEXTRACTOS DEL TRANSCRIPT:\n${relevantExcerpts.join("\n")}` : null,
			procedure ? `\nPROCEDIMIENTO PARCIAL EXISTENTE:\n${JSON.stringify(procedure, null, 2)}` : null,
		].filter(Boolean).join("\n");

		// Build conversation for the LLM
		const conversationMessages = history.map(m => `${m.role === "user" ? "USUARIO" : "ASISTENTE"}: ${m.content}`).join("\n");

		const fullPrompt = `${contextBlock}\n\n${conversationMessages ? `HISTORIAL:\n${conversationMessages}\n\n` : ""}USUARIO: ${message}`;

		const { text } = await instrumentedGenerateText({
			organizationId: session.organizationId,
			pipeline: "procedure-chat",
			system: SYSTEM_PROMPT,
			prompt: fullPrompt,
			maxOutputTokens: 2048,
			temperature: 0.3,
		});

		// Parse response
		let parsed: any;
		try {
			// Handle markdown code blocks
			const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
			parsed = JSON.parse(cleaned);
		} catch {
			// If JSON parse fails, treat as plain message
			parsed = { message: text, updatedFields: [], procedureUpdate: null, completeness: 0, nextFieldToFill: null };
		}

		// Build update payload
		const updateData: Record<string, any> = {};

		// Merge procedure update
		if (parsed.procedureUpdate && Object.keys(parsed.procedureUpdate).length > 0) {
			const existing = (node.procedure as Record<string, any>) || {};
			const merged = { ...existing, ...parsed.procedureUpdate };
			if (parsed.procedureUpdate.steps) merged.steps = parsed.procedureUpdate.steps;
			updateData.procedure = merged;
		}

		// Merge properties update (systems, SLA, inputs, outputs, etc.)
		if (parsed.propertiesUpdate && Object.keys(parsed.propertiesUpdate).length > 0) {
			const existingProps = (node.properties as Record<string, any>) || {};
			// For arrays, merge and dedupe
			const merged = { ...existingProps };
			for (const [key, value] of Object.entries(parsed.propertiesUpdate)) {
				if (Array.isArray(value) && Array.isArray(existingProps[key])) {
					merged[key] = [...new Set([...existingProps[key], ...value])];
				} else {
					merged[key] = value;
				}
			}
			updateData.properties = merged;
		}

		if (Object.keys(updateData).length > 0) {
			await db.diagramNode.update({
				where: { id: nodeId },
				data: updateData as any,
			});
		}

		return NextResponse.json({
			message: parsed.message,
			updatedFields: parsed.updatedFields || [],
			propertiesUpdated: !!parsed.propertiesUpdate && Object.keys(parsed.propertiesUpdate).length > 0,
			completeness: parsed.completeness || 0,
			nextFieldToFill: parsed.nextFieldToFill,
		});
	} catch (error: any) {
		console.error("[ProcedureChat]", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
