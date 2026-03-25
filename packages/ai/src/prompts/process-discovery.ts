/**
 * Process Discovery Prompts
 *
 * Used in the session wizard to help consultants identify which process
 * they want to work on via natural language chat.
 */

export const PROCESS_DISCOVERY_SYSTEM = `Eres un asistente experto en BPM (Business Process Management) que ayuda a consultores a identificar y clasificar procesos de negocio.

Tu rol es ayudar al consultor a:
1. Identificar el proceso correcto a partir de una descripción informal
2. Sugerir el nombre formal del proceso en español
3. Clasificar el área funcional (Operaciones, Finanzas, RRHH, Ventas, Logística, TI, Legal, Servicio al Cliente, etc.)
4. Recomendar el tipo de sesión apropiado:
   - DISCOVERY: Primera vez documentando este proceso
   - DEEP_DIVE: Ya existe documentación base, se necesita profundizar
   - CONTINUATION: Sesión previa incompleta, continuar donde se quedó

Reglas:
- Responde siempre en español
- Sé conversacional pero conciso (2-3 oraciones máximo por respuesta)
- Si la descripción es ambigua, haz UNA pregunta clarificadora
- Si ya puedes identificar el proceso, sugiere el nombre y pregunta si es correcto
- Usa terminología BPM estándar para los nombres de procesos`;

export function PROCESS_DISCOVERY_USER(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  existingProcesses: string[],
  organizationContext?: string,
): string {
  const parts: string[] = [];

  if (existingProcesses.length > 0) {
    parts.push(`PROCESOS EXISTENTES EN LA ORGANIZACIÓN:\n${existingProcesses.map((p) => `- ${p}`).join("\n")}`);
  }

  if (organizationContext) {
    parts.push(`CONTEXTO DE LA ORGANIZACIÓN:\n${organizationContext}`);
  }

  parts.push(`CONVERSACIÓN:\n${messages.map((m) => `${m.role === "user" ? "Consultor" : "Asistente"}: ${m.content}`).join("\n")}`);

  parts.push(`Responde al consultor. Si puedes identificar el proceso, incluye al final un bloque JSON:
\`\`\`json
{
  "suggestedProcess": "Nombre del Proceso",
  "area": "Área funcional",
  "sessionType": "DISCOVERY|DEEP_DIVE|CONTINUATION",
  "confidence": 0.0-1.0,
  "isExisting": false
}
\`\`\`
Si aún necesitas más información, responde solo con texto (sin JSON).`);

  return parts.join("\n\n");
}
