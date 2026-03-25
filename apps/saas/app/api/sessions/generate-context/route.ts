import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { instrumentedGenerateText } from "@repo/ai";

export async function POST(request: Request) {
  const authCtx = await getAuthContext();
  if (!authCtx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { processName, sessionType } = (await request.json()) as {
    processName: string;
    sessionType: string;
  };

  if (!processName) {
    return NextResponse.json({ error: "processName is required" }, { status: 400 });
  }

  const sessionTypeLabel =
    sessionType === "DISCOVERY"
      ? "primera documentación (discovery)"
      : sessionType === "DEEP_DIVE"
        ? "profundización (deep dive)"
        : "continuación";

  const { text } = await instrumentedGenerateText({
    organizationId: authCtx.org.id,
    pipeline: "context-template",
    system: `Eres un experto en BPM. Genera un template breve de contexto previo para una sesión de elicitación de procesos. El template debe ser en español, práctico, y fácil de editar. Usa bullet points. NO uses markdown headers. Máximo 8-10 líneas. El consultor va a editar esto — es un punto de partida, no un documento final.`,
    prompt: `Proceso: "${processName}"
Tipo de sesión: ${sessionTypeLabel}

Genera un template de contexto con:
1. Una línea describiendo qué es este proceso basado en su nombre
2. Objetivo probable de la sesión (1 línea)
3. Participantes típicos para este tipo de proceso (lista corta)
4. Preguntas clave que el consultor debería tener en mente
5. Información que sería útil tener antes de la sesión

Escribe directo, sin encabezados, como notas rápidas de un consultor experimentado.`,
    maxOutputTokens: 512,
    temperature: 0.5,
  });

  return NextResponse.json({ context: text });
}
