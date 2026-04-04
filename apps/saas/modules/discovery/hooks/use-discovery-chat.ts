"use client";

import { useState, useCallback, useRef } from "react";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
	id: string;
	role: "ai" | "user";
	content: string;
	timestamp: Date;
}

export type ProcessCategory = "estrategico" | "operativo" | "soporte";

export interface SuggestedProcess {
	id: string;
	name: string;
	description: string;
	category: ProcessCategory;
	confirmed: boolean;
	critical: boolean;
	removed: boolean;
}

export type DiscoveryPhase = "interview" | "generating" | "review";

export interface DiscoveryState {
	messages: ChatMessage[];
	phase: DiscoveryPhase;
	currentQuestion: number;
	totalQuestions: number;
	suggestedProcesses: SuggestedProcess[];
	isTyping: boolean;
	companyContext: Record<string, string>;
}

// ────────────────────────────────────────────────────────────────────────────
// Consultant questions (realistic BPM senior consultant flow)
// ────────────────────────────────────────────────────────────────────────────

const CONSULTANT_QUESTIONS: Array<{
	key: string;
	question: string;
	followUp?: (answer: string) => string;
}> = [
	{
		key: "greeting",
		question:
			"¡Hola! Soy tu consultor BPM. Voy a hacerte algunas preguntas para entender tu organización y diseñar una arquitectura de procesos a medida. Empecemos: ¿A qué se dedica tu empresa? Cuéntame brevemente sobre tu industria y actividad principal.",
	},
	{
		key: "product_service",
		question:
			"Muy bien. ¿Cuál es el producto o servicio principal que ofrecen? Si manejan varios, dime cuáles son los más importantes en términos de facturación.",
	},
	{
		key: "customers",
		question:
			"¿Quiénes son sus clientes principales? Me refiero a los segmentos: ¿B2B, B2C, gobierno, distribuidores? ¿Cuál es su perfil típico?",
	},
	{
		key: "value_chain",
		question:
			"Ahora hablemos de la cadena de valor. Desde que un cliente los contacta hasta que recibe el producto/servicio y soporte post-venta, ¿cuáles son las grandes etapas que atraviesa?",
	},
	{
		key: "size",
		question:
			"¿Cuántos empleados tiene la empresa aproximadamente? ¿Y cuántas ubicaciones o sedes manejan?",
	},
	{
		key: "departments",
		question:
			"¿Cuáles son los departamentos o áreas principales que tienen actualmente? Por ejemplo: ventas, producción, logística, RRHH, finanzas, TI, calidad...",
	},
	{
		key: "pain_points",
		question:
			"En su operación del día a día, ¿cuáles son los mayores dolores o cuellos de botella? ¿Dónde sienten que se pierde más tiempo o se cometen más errores?",
	},
	{
		key: "certifications",
		question:
			"¿Cuentan con alguna certificación o están buscando obtenerla? Por ejemplo: ISO 9001, ISO 14001, ISO 45001, ISO 27001, HACCP, u otra normativa regulatoria de su industria.",
	},
	{
		key: "digital_maturity",
		question:
			"¿Cómo describirías el nivel de digitalización actual? ¿Usan ERP, CRM, o la mayoría de los procesos son manuales/en hojas de cálculo?",
	},
	{
		key: "goals",
		question:
			"Última pregunta: ¿Cuál es el objetivo principal de mapear sus procesos? ¿Certificación, mejora continua, escalar el negocio, reducir costos, o algo más?",
	},
];

// ────────────────────────────────────────────────────────────────────────────
// Mock architecture generator
// ────────────────────────────────────────────────────────────────────────────

function generateMockArchitecture(
	_context: Record<string, string>,
): SuggestedProcess[] {
	return [
		// Estratégicos
		{
			id: "p-01",
			name: "Planificación Estratégica",
			description:
				"Definición de la visión, misión, objetivos estratégicos y despliegue del plan anual.",
			category: "estrategico",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-02",
			name: "Gestión de la Innovación",
			description:
				"Identificación de oportunidades, evaluación de ideas y desarrollo de nuevos productos/servicios.",
			category: "estrategico",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-03",
			name: "Gestión de Relaciones con Stakeholders",
			description:
				"Gestión de expectativas y comunicación con accionistas, reguladores y comunidad.",
			category: "estrategico",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-04",
			name: "Revisión por la Dirección",
			description:
				"Evaluación periódica del desempeño organizacional, indicadores clave y toma de decisiones estratégicas.",
			category: "estrategico",
			confirmed: true,
			critical: false,
			removed: false,
		},

		// Operativos
		{
			id: "p-05",
			name: "Gestión Comercial y Ventas",
			description:
				"Prospección, cotización, negociación y cierre de ventas con clientes.",
			category: "operativo",
			confirmed: true,
			critical: true,
			removed: false,
		},
		{
			id: "p-06",
			name: "Diseño y Desarrollo del Producto",
			description:
				"Diseño, prototipado y validación técnica del producto o servicio.",
			category: "operativo",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-07",
			name: "Producción / Prestación del Servicio",
			description:
				"Ejecución de la transformación o entrega del producto/servicio al cliente.",
			category: "operativo",
			confirmed: true,
			critical: true,
			removed: false,
		},
		{
			id: "p-08",
			name: "Logística y Distribución",
			description:
				"Almacenamiento, transporte y entrega al cliente final.",
			category: "operativo",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-09",
			name: "Servicio Post-Venta",
			description:
				"Atención de garantías, reclamos, soporte técnico y seguimiento de satisfacción.",
			category: "operativo",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-10",
			name: "Gestión de Compras y Abastecimiento",
			description:
				"Selección de proveedores, emisión de órdenes de compra y recepción de materiales.",
			category: "operativo",
			confirmed: true,
			critical: false,
			removed: false,
		},

		// Soporte
		{
			id: "p-11",
			name: "Gestión de Recursos Humanos",
			description:
				"Reclutamiento, capacitación, evaluación de desempeño y bienestar del personal.",
			category: "soporte",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-12",
			name: "Gestión Financiera y Contable",
			description:
				"Presupuesto, tesorería, contabilidad, facturación y reportes financieros.",
			category: "soporte",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-13",
			name: "Gestión de Tecnología de Información",
			description:
				"Infraestructura TI, soporte técnico, seguridad de la información y proyectos digitales.",
			category: "soporte",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-14",
			name: "Gestión de Calidad",
			description:
				"Auditorías internas, control de documentos, acciones correctivas y mejora continua.",
			category: "soporte",
			confirmed: true,
			critical: true,
			removed: false,
		},
		{
			id: "p-15",
			name: "Gestión Legal y Cumplimiento",
			description:
				"Contratos, cumplimiento regulatorio, propiedad intelectual y gestión de riesgos legales.",
			category: "soporte",
			confirmed: true,
			critical: false,
			removed: false,
		},
		{
			id: "p-16",
			name: "Gestión de Mantenimiento",
			description:
				"Mantenimiento preventivo y correctivo de equipos, instalaciones e infraestructura.",
			category: "soporte",
			confirmed: true,
			critical: false,
			removed: false,
		},
	];
}

// ────────────────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────────────────

let msgId = 0;
function nextId() {
	msgId += 1;
	return `msg-${msgId}-${Date.now()}`;
}

export function useDiscoveryChat() {
	const [state, setState] = useState<DiscoveryState>({
		messages: [],
		phase: "interview",
		currentQuestion: 0,
		totalQuestions: CONSULTANT_QUESTIONS.length,
		suggestedProcesses: [],
		isTyping: false,
		companyContext: {},
	});

	const initialized = useRef(false);

	// Start conversation with first AI message
	const initialize = useCallback(() => {
		if (initialized.current) return;
		initialized.current = true;

		const firstQuestion = CONSULTANT_QUESTIONS[0];
		if (!firstQuestion) return;

		setState((prev) => ({
			...prev,
			isTyping: true,
		}));

		// Simulate AI typing delay
		setTimeout(() => {
			setState((prev) => ({
				...prev,
				isTyping: false,
				messages: [
					{
						id: nextId(),
						role: "ai",
						content: firstQuestion.question,
						timestamp: new Date(),
					},
				],
				currentQuestion: 1,
			}));
		}, 800);
	}, []);

	// Send user message and get next AI question
	const sendMessage = useCallback((content: string) => {
		const trimmed = content.trim();
		if (!trimmed) return;

		const userMsg: ChatMessage = {
			id: nextId(),
			role: "user",
			content: trimmed,
			timestamp: new Date(),
		};

		setState((prev) => {
			const questionIndex = prev.currentQuestion - 1;
			const questionKey =
				CONSULTANT_QUESTIONS[questionIndex]?.key ?? `q${questionIndex}`;

			const newContext = {
				...prev.companyContext,
				[questionKey]: trimmed,
			};

			const newMessages = [...prev.messages, userMsg];

			// Check if we have more questions
			const nextQuestionIndex = prev.currentQuestion;
			const hasMoreQuestions =
				nextQuestionIndex < CONSULTANT_QUESTIONS.length;

			return {
				...prev,
				messages: newMessages,
				isTyping: true,
				companyContext: newContext,
				...(hasMoreQuestions ? {} : { phase: "generating" as const }),
			};
		});

		// Simulate AI response delay (realistic typing feel)
		const delay = 800 + Math.random() * 1200;

		setTimeout(() => {
			setState((prev) => {
				const nextQuestionIndex = prev.currentQuestion;

				if (nextQuestionIndex >= CONSULTANT_QUESTIONS.length) {
					// All questions done — generate architecture
					const transitionMsg: ChatMessage = {
						id: nextId(),
						role: "ai",
						content:
							"¡Excelente! Con toda esta información ya tengo una imagen clara de tu organización. Dame un momento mientras diseño la arquitectura de procesos...",
						timestamp: new Date(),
					};
					return {
						...prev,
						messages: [...prev.messages, transitionMsg],
						isTyping: false,
						phase: "generating",
					};
				}

				const nextQuestion = CONSULTANT_QUESTIONS[nextQuestionIndex];
				if (!nextQuestion) return { ...prev, isTyping: false };

				const aiMsg: ChatMessage = {
					id: nextId(),
					role: "ai",
					content: nextQuestion.question,
					timestamp: new Date(),
				};

				return {
					...prev,
					messages: [...prev.messages, aiMsg],
					isTyping: false,
					currentQuestion: nextQuestionIndex + 1,
				};
			});
		}, delay);
	}, []);

	// Trigger architecture generation
	const generateArchitecture = useCallback(() => {
		setState((prev) => ({
			...prev,
			phase: "generating",
			isTyping: true,
		}));

		// Simulate generation time
		setTimeout(() => {
			const processes = generateMockArchitecture(state.companyContext);
			setState((prev) => ({
				...prev,
				phase: "review",
				isTyping: false,
				suggestedProcesses: processes,
			}));
		}, 3000);
	}, [state.companyContext]);

	// Process actions
	const toggleConfirm = useCallback((processId: string) => {
		setState((prev) => ({
			...prev,
			suggestedProcesses: prev.suggestedProcesses.map((p) =>
				p.id === processId ? { ...p, confirmed: !p.confirmed } : p,
			),
		}));
	}, []);

	const toggleCritical = useCallback((processId: string) => {
		setState((prev) => ({
			...prev,
			suggestedProcesses: prev.suggestedProcesses.map((p) =>
				p.id === processId ? { ...p, critical: !p.critical } : p,
			),
		}));
	}, []);

	const removeProcess = useCallback((processId: string) => {
		setState((prev) => ({
			...prev,
			suggestedProcesses: prev.suggestedProcesses.map((p) =>
				p.id === processId
					? { ...p, removed: true, confirmed: false }
					: p,
			),
		}));
	}, []);

	const restoreProcess = useCallback((processId: string) => {
		setState((prev) => ({
			...prev,
			suggestedProcesses: prev.suggestedProcesses.map((p) =>
				p.id === processId
					? { ...p, removed: false, confirmed: true }
					: p,
			),
		}));
	}, []);

	const confirmArchitecture = useCallback(() => {
		const confirmed = state.suggestedProcesses.filter(
			(p) => p.confirmed && !p.removed,
		);
		// In production this would call an API
		console.log("Architecture confirmed:", confirmed);
		return confirmed;
	}, [state.suggestedProcesses]);

	const progressPercent =
		state.phase === "review"
			? 100
			: Math.round(
					(state.currentQuestion / state.totalQuestions) * 100,
				);

	return {
		...state,
		progressPercent,
		initialize,
		sendMessage,
		generateArchitecture,
		toggleConfirm,
		toggleCritical,
		removeProcess,
		restoreProcess,
		confirmArchitecture,
	};
}
