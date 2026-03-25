import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { instrumentedGenerateText, parseLlmJson } from "@repo/ai";
import { z } from "zod";

// connectFrom: AI sometimes returns a string, sometimes an array — normalize to string | null
const connectFromSchema = z.union([
  z.string(),
  z.array(z.string()).transform((arr) => arr[0] ?? null),
  z.null(),
]).optional().default(null);

const PreBuildNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["startEvent", "endEvent", "task", "userTask", "exclusiveGateway", "parallelGateway", "subProcess"]).catch("task"),
  label: z.string(),
  lane: z.string().optional(),
  connectFrom: connectFromSchema,
});

const PreBuildResultSchema = z.object({
  nodes: z.array(PreBuildNodeSchema),
  lanes: z.array(z.string()),
});

export async function POST(request: Request) {
  const authCtx = await getAuthContext();
  if (!authCtx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { processName, sessionType, context } = (await request.json()) as {
    processName: string;
    sessionType: string;
    context: string;
  };

  if (!processName) {
    return NextResponse.json({ error: "processName is required" }, { status: 400 });
  }

  const { text } = await instrumentedGenerateText({
    organizationId: authCtx.org.id,
    pipeline: "pre-build-diagram",
    system: `Eres un experto en modelado de procesos BPMN. Tu trabajo es generar la estructura inicial de un diagrama de proceso basándote en el nombre del proceso y el contexto proporcionado.

Genera un diagrama BORRADOR — no tiene que ser perfecto, es un punto de partida para que el consultor lo refine durante la sesión de elicitación.

Reglas:
- Empieza siempre con un startEvent y termina con un endEvent
- Usa lanes para los roles/departamentos que puedas inferir
- Mantén 5-12 nodos máximo (es un borrador, no el proceso completo)
- Usa IDs cortos: node_1, node_2, etc.
- connectFrom indica de qué nodo viene la conexión (null para startEvent)
- Los tipos válidos son: startEvent, endEvent, task, userTask, exclusiveGateway, parallelGateway, subProcess
- Responde SOLO con JSON`,
    prompt: `Proceso: "${processName}"
Tipo de sesión: ${sessionType}

Contexto del consultor:
${context || "(Sin contexto adicional — infiere del nombre del proceso)"}

Genera la estructura inicial del diagrama:
\`\`\`json
{
  "nodes": [
    { "id": "node_1", "type": "startEvent", "label": "Inicio", "lane": "Lane", "connectFrom": null },
    ...
  ],
  "lanes": ["Lane1", "Lane2"]
}
\`\`\``,
    maxOutputTokens: 1500,
    temperature: 0.4,
  });

  const result = parseLlmJson(text, PreBuildResultSchema, "PreBuildDiagram");

  if (!result) {
    return NextResponse.json(
      { error: "No se pudo generar el diagrama" },
      { status: 422 },
    );
  }

  return NextResponse.json(result);
}
