import { ORPCError } from "@orpc/client";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteClient = protectedProcedure
	.route({
		method: "POST",
		path: "/clients/{clientId}/delete",
		tags: ["Clients"],
		summary: "Delete client",
	})
	.input(
		z.object({
			clientId: z.string(),
		}),
	)
	.handler(async ({ input: { clientId }, context: { session } }) => {
		const existing = await db.client.findUnique({
			where: { id: clientId },
			select: { organizationId: true },
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND");
		}

		if (existing.organizationId !== session.activeOrganizationId) {
			throw new ORPCError("FORBIDDEN");
		}

		await db.client.delete({
			where: { id: clientId },
		});

		return { success: true };
	});
