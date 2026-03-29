/**
 * SIPOC to KnowledgeSnapshot Mapper
 *
 * Converts a SipocResult (from extractSipoc or from the SIPOC conversation)
 * into a KnowledgeSnapshot that the risk audit pipeline can consume.
 *
 * Sparse knowledge is intentional — the risk pipeline flags gaps as risks,
 * so a thin snapshot produces MORE risk findings.
 */

import type { KnowledgeSnapshot } from "@repo/ai";
import type { SipocResult } from "@repo/ai";

/**
 * Extended SIPOC data used during the deep conversation phase.
 * Adds role/system/decision/exception info that the basic SipocResult doesn't have.
 */
export interface EnrichedSipocData {
	suppliers: Array<{ name: string; description?: string }>;
	inputs: Array<{ name: string; description?: string }>;
	processSteps: Array<{
		label: string;
		order: number;
		role?: string;
		system?: string;
		hasDecision?: boolean;
		hasException?: boolean;
	}>;
	outputs: Array<{ name: string; description?: string; recipient?: string }>;
	customers: Array<{ name: string; description?: string }>;
}

/**
 * Convert a basic SipocResult (from extractSipoc pipeline) to EnrichedSipocData.
 */
export function sipocResultToEnriched(sipoc: SipocResult): EnrichedSipocData {
	return {
		suppliers: sipoc.suppliers,
		inputs: sipoc.inputs,
		processSteps: sipoc.processSteps.map((s) => ({
			label: s.name,
			order: s.order,
		})),
		outputs: sipoc.outputs,
		customers: sipoc.customers,
	};
}

export function sipocToKnowledge(
	sipoc: EnrichedSipocData,
	industry?: string,
	conversationExcerpts?: string[],
): KnowledgeSnapshot {
	// Map suppliers to roles
	const roles = sipoc.suppliers.map((s) => ({
		name: s.name,
		responsibilities: s.description ? [s.description] : [],
		department: undefined,
		confirmed: false,
	}));

	// Add customer roles if they look like internal departments
	for (const customer of sipoc.customers) {
		if (!roles.some((r) => r.name === customer.name)) {
			roles.push({
				name: customer.name,
				responsibilities: customer.description
					? [`Recibe: ${customer.description}`]
					: [],
				department: undefined,
				confirmed: false,
			});
		}
	}

	// Map inputs — some might be triggers, some might be systems
	const triggers = sipoc.inputs
		.filter(
			(i) =>
				i.name.toLowerCase().includes("solicitud") ||
				i.name.toLowerCase().includes("orden") ||
				i.name.toLowerCase().includes("pedido") ||
				i.name.toLowerCase().includes("requerimiento") ||
				i.name.toLowerCase().includes("evento"),
		)
		.map((i) => ({
			description: i.description || i.name,
			sourceProcess: undefined,
			confirmed: false,
		}));

	// If no triggers found from inputs, create a generic one
	if (triggers.length === 0 && sipoc.processSteps.length > 0) {
		triggers.push({
			description: `Inicio del proceso`,
			sourceProcess: undefined,
			confirmed: false,
		});
	}

	// Extract systems from inputs and process steps
	const systemNames = new Set<string>();
	const systems: KnowledgeSnapshot["systems"] = [];

	for (const input of sipoc.inputs) {
		if (
			input.name.match(
				/\b(SAP|ERP|CRM|Excel|email|sistema|software|plataforma)\b/i,
			)
		) {
			if (!systemNames.has(input.name)) {
				systemNames.add(input.name);
				systems.push({
					name: input.name,
					type: undefined,
					usedInSteps: [],
					vendor: undefined,
					confirmed: false,
				});
			}
		}
	}

	for (const step of sipoc.processSteps) {
		if (step.system && !systemNames.has(step.system)) {
			systemNames.add(step.system);
			systems.push({
				name: step.system,
				type: undefined,
				usedInSteps: [step.label],
				vendor: undefined,
				confirmed: false,
			});
		}
	}

	// Map process steps
	const steps = sipoc.processSteps
		.sort((a, b) => a.order - b.order)
		.map((s) => ({
			label: s.label,
			role: s.role || undefined,
			system: s.system || undefined,
			format: undefined,
			hasExceptionPath: s.hasException || false,
			hasDecisionCriteria: s.hasDecision || false,
			estimatedTime: undefined,
			confirmed: false,
		}));

	// Map decisions from process steps that have them
	const decisions = sipoc.processSteps
		.filter((s) => s.hasDecision)
		.map((s) => ({
			label: s.label,
			criteria: undefined,
			outcomes: [],
			confirmed: false,
		}));

	// Map exceptions
	const exceptions = sipoc.processSteps
		.filter((s) => s.hasException)
		.map((s) => ({
			step: s.label,
			scenario: "Excepcion detectada en el proceso",
			handling: undefined,
			confirmed: false,
		}));

	// Map outputs
	const outputs = sipoc.outputs.map((o) => ({
		description: o.description || o.name,
		targetProcess: o.recipient || undefined,
		format: undefined,
		confirmed: false,
	}));

	return {
		roles,
		triggers,
		steps,
		decisions,
		exceptions,
		outputs,
		systems,
		formats: [],
		slas: [],
		volumetrics: [],
		costs: [],
		interProcessLinks: [],
		contradictions: [],
	};
}
