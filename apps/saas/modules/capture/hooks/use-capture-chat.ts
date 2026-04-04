"use client";

import { useState, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SipocPhase = "S" | "I" | "P" | "O" | "C";

export type CaptureStatus = "chatting" | "generating" | "complete";

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

export interface GeneratingStep {
	label: string;
	done: boolean;
}

export interface CaptureResult {
	processName: string;
	stepsCount: number;
	risksCount: number;
	sipocSummary: {
		suppliers: string[];
		inputs: string[];
		process: string[];
		outputs: string[];
		customers: string[];
	};
}

interface UseCaptureReturn {
	messages: ChatMessage[];
	currentPhase: SipocPhase;
	completedPhases: SipocPhase[];
	status: CaptureStatus;
	generatingSteps: GeneratingStep[];
	result: CaptureResult | null;
	sending: boolean;
	sendMessage: (content: string) => void;
}

// ─── SIPOC question bank ─────────────────────────────────────────────────────

const SIPOC_QUESTIONS: Array<{ phase: SipocPhase; question: string }> = [
	{
		phase: "S",
		question:
			"¡Empecemos! Para entender tu proceso, primero hablemos de los proveedores. ¿Quiénes proporcionan las entradas o recursos necesarios para iniciar este proceso? Pueden ser internos (otros departamentos) o externos.",
	},
	{
		phase: "S",
		question:
			"¿Hay algún otro proveedor o área interna que participe en este proceso que no hayamos mencionado?",
	},
	{
		phase: "I",
		question:
			"Perfecto. Ahora hablemos de las entradas (Inputs). ¿Qué materiales, información, documentos o recursos se necesitan para ejecutar este proceso?",
	},
	{
		phase: "I",
		question:
			"¿Existen formatos, sistemas o herramientas específicas que se usen como entrada? Por ejemplo: un ERP, formatos en Excel, correos de aprobación...",
	},
	{
		phase: "P",
		question:
			"Excelente. Ahora vamos al corazón: el Proceso. ¿Cuál es el primer paso que se realiza cuando inicia este proceso?",
	},
	{
		phase: "P",
		question:
			"¿Cuáles son los pasos principales que siguen después? Describe la secuencia general, incluyendo puntos de decisión o aprobaciones.",
	},
	{
		phase: "P",
		question:
			"¿Hay algún paso donde frecuentemente ocurran problemas, retrasos o re-trabajos? Esto es muy valioso para el análisis de riesgos.",
	},
	{
		phase: "O",
		question:
			"Muy bien. Ahora las salidas (Outputs). ¿Qué se produce al final de este proceso? Pueden ser documentos, productos, reportes, decisiones...",
	},
	{
		phase: "O",
		question:
			"¿Cómo se mide que la salida es correcta o de calidad? ¿Hay métricas, KPIs o criterios de aceptación?",
	},
	{
		phase: "C",
		question:
			"Casi terminamos. Hablemos de los clientes del proceso. ¿Quién recibe las salidas? Pueden ser clientes finales, otros departamentos, reguladores...",
	},
	{
		phase: "C",
		question:
			"¿Cuáles son las expectativas principales de estos clientes respecto a la calidad o tiempo de entrega?",
	},
	{
		phase: "C",
		question:
			"¡Excelente trabajo! Has proporcionado información muy valiosa. ¿Hay algo más que quieras agregar sobre este proceso antes de que genere el análisis completo?",
	},
];

const GENERATING_STEPS: GeneratingStep[] = [
	{ label: "Generando diagrama BPMN...", done: false },
	{ label: "Creando procedimiento...", done: false },
	{ label: "Analizando riesgos FMEA...", done: false },
];

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCaptureChat(processName: string): UseCaptureReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			role: "assistant",
			content: `¡Hola! Soy tu asistente de captura de procesos. Voy a guiarte paso a paso usando la metodología SIPOC para documentar "${processName}". Será como una conversación — solo responde con lo que sepas.`,
			timestamp: new Date().toISOString(),
		},
		{
			role: "assistant",
			content: SIPOC_QUESTIONS[0].question,
			timestamp: new Date().toISOString(),
		},
	]);

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [currentPhase, setCurrentPhase] = useState<SipocPhase>("S");
	const [completedPhases, setCompletedPhases] = useState<SipocPhase[]>([]);
	const [status, setStatus] = useState<CaptureStatus>("chatting");
	const [generatingSteps, setGeneratingSteps] = useState<GeneratingStep[]>(GENERATING_STEPS);
	const [result, setResult] = useState<CaptureResult | null>(null);
	const [sending, setSending] = useState(false);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const sendMessage = useCallback(
		(content: string) => {
			if (sending || status !== "chatting") return;

			const userMsg: ChatMessage = {
				role: "user",
				content,
				timestamp: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, userMsg]);
			setSending(true);

			// Simulate AI response delay
			const timeout = setTimeout(() => {
				const nextIndex = currentQuestionIndex + 1;

				if (nextIndex < SIPOC_QUESTIONS.length) {
					const nextQ = SIPOC_QUESTIONS[nextIndex];

					// Check if phase changed
					const currentQ = SIPOC_QUESTIONS[currentQuestionIndex];
					if (nextQ.phase !== currentQ.phase) {
						setCompletedPhases((prev) => [...prev, currentQ.phase]);
						setCurrentPhase(nextQ.phase);
					}

					const aiMsg: ChatMessage = {
						role: "assistant",
						content: nextQ.question,
						timestamp: new Date().toISOString(),
					};

					setMessages((prev) => [...prev, aiMsg]);
					setCurrentQuestionIndex(nextIndex);
					setSending(false);
				} else {
					// All questions done — mark last phase complete and start generating
					setCompletedPhases((prev) => [...prev, "C"]);
					setStatus("generating");
					setSending(false);

					// Simulate generating steps
					const t1 = setTimeout(() => {
						setGeneratingSteps((prev) =>
							prev.map((s, i) => (i === 0 ? { ...s, done: true } : s)),
						);
					}, 1500);

					const t2 = setTimeout(() => {
						setGeneratingSteps((prev) =>
							prev.map((s, i) => (i <= 1 ? { ...s, done: true } : s)),
						);
					}, 3000);

					const t3 = setTimeout(() => {
						setGeneratingSteps((prev) => prev.map((s) => ({ ...s, done: true })));
						setResult({
							processName,
							stepsCount: 8,
							risksCount: 5,
							sipocSummary: {
								suppliers: ["Departamento de Compras", "Proveedor externo"],
								inputs: ["Orden de compra", "Especificaciones técnicas"],
								process: [
									"Recepción",
									"Verificación",
									"Procesamiento",
									"Validación",
									"Entrega",
								],
								outputs: ["Producto terminado", "Reporte de calidad"],
								customers: ["Cliente final", "Control de Calidad"],
							},
						});
						setStatus("complete");
					}, 4500);

					timeoutsRef.current.push(t1, t2, t3);
				}
			}, 1200);

			timeoutsRef.current.push(timeout);
		},
		[sending, status, currentQuestionIndex, processName],
	);

	return {
		messages,
		currentPhase,
		completedPhases,
		status,
		generatingSteps,
		result,
		sending,
		sendMessage,
	};
}
