/**
 * Simulation Generator Prompts
 *
 * Builds Harvard Business School-style case simulations from
 * process definitions, BPMN steps, and identified risks.
 *
 * Pipeline flow:
 *   PROCESS + BPMN STEPS + RISKS → LLM → SIMULATION TEMPLATE (narrative + decisions)
 */

export const SIMULATION_GENERATOR_SYSTEM = `Eres un experto en diseño de simulaciones estilo Harvard Business School, especializado en crear casos de decisión para evaluar el criterio operativo de profesionales.

Tu trabajo es generar una simulación realista basada en un proceso de negocio real y sus riesgos identificados. La simulación debe:

1. NARRAR un escenario empresarial creíble y específico (empresa ficticia pero realista, con nombres, cifras, contexto de mercado)
2. PRESENTAR 5 puntos de decisión donde el participante debe elegir entre 3-4 opciones
3. Cada decisión debe estar ANCLADA a un paso real del proceso y a un riesgo identificado
4. Las opciones deben tener MATICES — no debe haber una respuesta "obviamente correcta"
5. Las consecuencias de cada opción deben ser realistas y proporcionales

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título de la simulación (corto, descriptivo)",
  "narrative": "Narrativa del escenario (3-4 párrafos). Describe la empresa, su situación actual, las presiones del mercado, y el contexto específico que enfrentará el participante. Debe sentirse como un caso real de Harvard. En español.",
  "decisions": [
    {
      "order": 1,
      "prompt": "Situación específica que enfrenta el participante. Incluye contexto, datos relevantes, presión de tiempo si aplica. Mínimo 2 párrafos.",
      "options": [
        { "label": "Opción A", "description": "Descripción detallada de la acción" },
        { "label": "Opción B", "description": "Descripción detallada de la acción" },
        { "label": "Opción C", "description": "Descripción detallada de la acción" }
      ],
      "consequences": [
        "Consecuencia narrativa si elige Opción A (qué pasa después, impacto en el negocio)",
        "Consecuencia narrativa si elige Opción B",
        "Consecuencia narrativa si elige Opción C"
      ],
      "proceduralReference": "Lo que dice el procedimiento documentado para esta situación (~200 tokens máx)",
      "riskLevelByOption": [
        { "level": "LOW", "reason": "Por qué esta opción tiene riesgo bajo" },
        { "level": "HIGH", "reason": "Por qué esta opción tiene riesgo alto" },
        { "level": "MEDIUM", "reason": "Por qué esta opción tiene riesgo medio" }
      ]
    }
  ]
}

REGLAS:
- La narrativa debe estar en ESPAÑOL
- Cada decisión debe referenciar un paso real del proceso (proceduralReference)
- Los riskLevelByOption deben reflejar el riesgo REAL, no moralidad — a veces la opción de mayor riesgo es la más innovadora
- Las opciones deben cubrir un espectro: conservadora, moderada, agresiva (no siempre en ese orden)
- Las consecuencias deben ser ESPECÍFICAS con cifras cuando sea posible ("reducción del 15% en tiempo de ciclo", "riesgo de multa de $50K")
- NO incluyas opciones absurdas o claramente incorrectas — todas deben ser defensibles
- Las 5 decisiones deben tener una progresión narrativa lógica (cada decisión construye sobre las anteriores)
- Genera exactamente 5 decisiones, cada una con 3-4 opciones
- Los niveles de riesgo válidos son: LOW, MEDIUM, HIGH, CRITICAL`;

export interface SimulationPromptData {
  processName: string;
  processDescription?: string;
  bpmnStepLabels: string[];
  risks: Array<{
    title: string;
    description: string;
    riskType: string;
    severity: number;
    probability: number;
    affectedStep?: string;
  }>;
  targetRole: string;
}

export function buildSimulationPrompt(data: SimulationPromptData): {
  system: string;
  user: string;
} {
  const risksSummary = data.risks
    .map(
      (r, i) =>
        `${i + 1}. [${r.riskType}] ${r.title} (Sev:${r.severity}, Prob:${r.probability})${r.affectedStep ? ` — Paso: ${r.affectedStep}` : ""}\n   ${r.description}`,
    )
    .join("\n");

  const stepsText =
    data.bpmnStepLabels.length > 0
      ? data.bpmnStepLabels.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : "(No se extrajeron pasos del BPMN)";

  const user = `PROCESO: ${data.processName}
${data.processDescription ? `DESCRIPCIÓN: ${data.processDescription}` : ""}

ROL OBJETIVO (el participante asume este rol): ${data.targetRole}

PASOS DEL PROCESO (extraídos del diagrama BPMN):
${stepsText}

RIESGOS IDENTIFICADOS (la simulación debe evaluar estos riesgos):
${risksSummary}

Genera una simulación completa con 5 decisiones que evalúen la capacidad del participante (en su rol de ${data.targetRole}) para manejar los riesgos identificados dentro de este proceso.`;

  return {
    system: SIMULATION_GENERATOR_SYSTEM,
    user,
  };
}
