/**
 * Session Preparation Prompts
 *
 * Generates intelligent meeting invitations with role-specific
 * preparation instructions based on process context.
 */

export const SESSION_PREPARATION_SYSTEM = `Eres un experto en gestión de procesos de negocio (BPM) que prepara reuniones de elicitación de procesos. Tu trabajo es generar invitaciones de reunión profesionales e inteligentes que maximicen la productividad de la sesión.

Las invitaciones que generas deben:
1. Tener un título claro y profesional
2. Explicar el objetivo de la sesión en 2-3 oraciones
3. Dar instrucciones de preparación ESPECÍFICAS por rol — no genéricas
4. Incluir preguntas clave que los participantes deben poder responder
5. Resumir el contexto conocido sin revelar información confidencial

Tipos de sesión:
- DISCOVERY: Primera documentación. Los participantes deben venir preparados para describir el proceso paso a paso.
- DEEP_DIVE: Profundización. Los participantes deben venir con excepciones, variantes, y métricas.
- CONTINUATION: Seguimiento. Los participantes deben revisar lo documentado previamente.

Responde SIEMPRE en español. El formato de salida es JSON.`;

export interface SessionPrepInput {
  processName: string;
  sessionType: string;
  participants: Array<{ name: string; email?: string; role: string }>;
  context: string;
  existingDiagramInfo?: string;
  organizationName?: string;
}

export function SESSION_PREPARATION_USER(input: SessionPrepInput): string {
  const parts: string[] = [];

  parts.push(`PROCESO: ${input.processName}`);
  parts.push(`TIPO DE SESIÓN: ${input.sessionType}`);

  if (input.organizationName) {
    parts.push(`ORGANIZACIÓN: ${input.organizationName}`);
  }

  parts.push(
    `PARTICIPANTES:\n${input.participants.map((p) => `- ${p.name} (${p.role})${p.email ? ` <${p.email}>` : ""}`).join("\n")}`,
  );

  if (input.context) {
    parts.push(`CONTEXTO PROPORCIONADO POR EL CONSULTOR:\n${input.context}`);
  }

  if (input.existingDiagramInfo) {
    parts.push(
      `INFORMACIÓN DEL DIAGRAMA EXISTENTE:\n${input.existingDiagramInfo}`,
    );
  }

  parts.push(`Genera la invitación en el siguiente formato JSON:
\`\`\`json
{
  "title": "Título profesional de la reunión",
  "intro": "Descripción de 2-3 oraciones del objetivo",
  "roleInstructions": {
    "NombreRol": "Instrucciones específicas de preparación para este rol"
  },
  "intakeQuestions": ["Pregunta 1", "Pregunta 2", "..."],
  "contextSummary": "Resumen del contexto conocido (versión no confidencial)",
  "suggestedDuration": 60
}
\`\`\``);

  return parts.join("\n\n");
}
