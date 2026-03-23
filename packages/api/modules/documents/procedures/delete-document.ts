import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteDocument = protectedProcedure
	.route({
		method: "POST",
		path: "/documents/delete",
		tags: ["Documents"],
		summary: "Delete document",
		description: "Delete a document record from the database",
	})
	.input(
		z.object({
			documentId: z.string(),
		}),
	)
	.handler(async ({ context: { session }, input: { documentId } }) => {
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

		await db.document.delete({
			where: { id: documentId },
		});

		return { success: true };
	});
