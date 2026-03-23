import { describe, it, expect } from "vitest";
import { CHAT_EXTRACTION_USER } from "../chat-extraction";
import type { ProcessChatContext } from "../../pipelines/chat-extraction";

const baseMessages = [
	{ role: "user", content: "Tenemos un proceso de aprobación de compras" },
	{
		role: "assistant",
		content: "Entendido, cuéntame más sobre ese proceso.",
	},
];

const baseExisting = [
	{ name: "Gestión de Inventario", level: "PROCESS", category: "core" },
];

const baseProjectContext = {
	clientName: "Acme Corp",
	clientIndustry: "Manufacturing",
};

const fullProcessContext: ProcessChatContext = {
	targetProcess: {
		name: "Aprobación de Compras",
		level: "SUBPROCESS",
		description: "Proceso de aprobación de órdenes de compra",
		triggers: ["Solicitud de compra recibida"],
		outputs: ["Orden de compra aprobada"],
		goals: ["Reducir tiempo de aprobación"],
		owner: "Departamento de Compras",
		siblings: ["Recepción de Materiales", "Pago a Proveedores"],
	},
	intelligenceGaps: [
		{
			question: "¿Cuáles son los criterios de aprobación por monto?",
			category: "decisions",
			priority: 80,
		},
		{
			question: "¿Qué pasa cuando se rechaza una solicitud?",
			category: "exceptions",
			priority: 50,
		},
	],
	completenessScore: 35,
	rejectedNames: ["Control de Calidad", "Logística Interna"],
};

describe("CHAT_EXTRACTION_USER", () => {
	it("builds prompt without process context (backward compat)", () => {
		const result = CHAT_EXTRACTION_USER(
			baseMessages,
			baseExisting,
			baseProjectContext,
		);

		expect(result).toContain("PROJECT CONTEXT:");
		expect(result).toContain("Client: Acme Corp");
		expect(result).toContain("Industry: Manufacturing");
		expect(result).toContain("EXISTING PROCESSES");
		expect(result).toContain("Gestión de Inventario");
		expect(result).toContain("CONVERSATION:");
		expect(result).not.toContain("TARGET PROCESS CONTEXT:");
		expect(result).not.toContain("INTELLIGENCE GAPS");
		expect(result).not.toContain("REJECTED SUGGESTIONS");
	});

	it("builds prompt with target process context", () => {
		const result = CHAT_EXTRACTION_USER(
			baseMessages,
			baseExisting,
			baseProjectContext,
			{
				targetProcess: fullProcessContext.targetProcess,
			},
		);

		expect(result).toContain("TARGET PROCESS CONTEXT:");
		expect(result).toContain('Process: "Aprobación de Compras" (SUBPROCESS)');
		expect(result).toContain("Description: Proceso de aprobación");
		expect(result).toContain("Known triggers: Solicitud de compra recibida");
		expect(result).toContain("Expected outputs: Orden de compra aprobada");
		expect(result).toContain("Goals: Reducir tiempo de aprobación");
		expect(result).toContain("Owner: Departamento de Compras");
		expect(result).toContain(
			"Sibling processes: Recepción de Materiales, Pago a Proveedores",
		);
	});

	it("builds prompt with intelligence gaps", () => {
		const result = CHAT_EXTRACTION_USER(
			baseMessages,
			baseExisting,
			baseProjectContext,
			fullProcessContext,
		);

		expect(result).toContain("INTELLIGENCE GAPS");
		expect(result).toContain(
			"[HIGH] decisions: ¿Cuáles son los criterios de aprobación por monto?",
		);
		expect(result).toContain(
			"[MED] exceptions: ¿Qué pasa cuando se rechaza una solicitud?",
		);
		expect(result).toContain("Process completeness: 35%");
	});

	it("builds prompt with rejected names", () => {
		const result = CHAT_EXTRACTION_USER(
			baseMessages,
			baseExisting,
			baseProjectContext,
			fullProcessContext,
		);

		expect(result).toContain("REJECTED SUGGESTIONS");
		expect(result).toContain("Control de Calidad, Logística Interna");
	});

	it("builds prompt with all context combined", () => {
		const result = CHAT_EXTRACTION_USER(
			baseMessages,
			baseExisting,
			{
				...baseProjectContext,
				liveTranscript: "Speaker A: Hablemos del proceso de compras",
			},
			fullProcessContext,
		);

		// All blocks should be present in order
		expect(result).toContain("PROJECT CONTEXT:");
		expect(result).toContain("TARGET PROCESS CONTEXT:");
		expect(result).toContain("INTELLIGENCE GAPS");
		expect(result).toContain("LIVE MEETING TRANSCRIPT");
		expect(result).toContain("EXISTING PROCESSES");
		expect(result).toContain("REJECTED SUGGESTIONS");
		expect(result).toContain("CONVERSATION:");

		// Verify order: process context before transcript before existing
		const processIdx = result.indexOf("TARGET PROCESS CONTEXT:");
		const gapsIdx = result.indexOf("INTELLIGENCE GAPS");
		const transcriptIdx = result.indexOf("LIVE MEETING TRANSCRIPT");
		const existingIdx = result.indexOf("EXISTING PROCESSES");
		const rejectedIdx = result.indexOf("REJECTED SUGGESTIONS");
		const conversationIdx = result.indexOf("CONVERSATION:");

		expect(processIdx).toBeLessThan(gapsIdx);
		expect(gapsIdx).toBeLessThan(transcriptIdx);
		expect(transcriptIdx).toBeLessThan(existingIdx);
		expect(existingIdx).toBeLessThan(rejectedIdx);
		expect(rejectedIdx).toBeLessThan(conversationIdx);
	});

	it("truncates long descriptions to 500 chars", () => {
		const longDesc = "A".repeat(600);
		const result = CHAT_EXTRACTION_USER(baseMessages, baseExisting, undefined, {
			targetProcess: {
				...fullProcessContext.targetProcess,
				description: longDesc,
			},
		});

		expect(result).toContain("Description: " + "A".repeat(500));
		expect(result).not.toContain("A".repeat(501));
	});

	it("handles empty arrays gracefully", () => {
		const result = CHAT_EXTRACTION_USER(baseMessages, baseExisting, undefined, {
			targetProcess: {
				name: "Simple Process",
				level: "PROCESS",
				triggers: [],
				outputs: [],
				goals: [],
				siblings: [],
			},
		});

		expect(result).toContain('Process: "Simple Process" (PROCESS)');
		expect(result).not.toContain("Known triggers:");
		expect(result).not.toContain("Expected outputs:");
		expect(result).not.toContain("Goals:");
		expect(result).not.toContain("Sibling processes:");
	});

	it("applies sliding window to last 20 messages", () => {
		const manyMessages = Array.from({ length: 30 }, (_, i) => ({
			role: i % 2 === 0 ? "user" : "assistant",
			content: `Message ${i}`,
		}));

		const result = CHAT_EXTRACTION_USER(manyMessages, []);

		expect(result).toContain("Message 10");
		expect(result).toContain("Message 29");
		expect(result).not.toContain("Message 9");
	});
});
