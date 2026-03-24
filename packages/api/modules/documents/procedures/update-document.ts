import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const updateDocument = protectedProcedure
	.route({
		method: "POST",
		path: "/documents/update",
		tags: ["Documents"],
		summary: "Update document metadata",
		description: "Update name, description, or process association of a document",
	})
	.input(
		z.object({
			documentId: z.string(),
			name: z.string().min(1).optional(),
			description: z.string().nullable().optional(),
			processDefinitionId: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ context: { session }, input: { documentId, ...data } }) => {
		const document = await db.document.findUnique({
			where: { id: documentId },
		});

		if (!document) {
			throw new ORPCError("NOT_FOUND", {
				message: "Document not found",
			});
		}

		if (document.organizationId !== session.activeOrganizationId) {
			throw new ORPCError("FORBIDDEN");
		}

		// Validate processDefinitionId belongs to same org
		if (data.processDefinitionId) {
			const process = await db.processDefinition.findUnique({
				where: { id: data.processDefinitionId },
				include: { architecture: { select: { organizationId: true } } },
			});
			if (!process || process.architecture.organizationId !== session.activeOrganizationId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Invalid process definition",
				});
			}
		}

		const updated = await db.document.update({
			where: { id: documentId },
			data,
		});

		return updated;
	});
