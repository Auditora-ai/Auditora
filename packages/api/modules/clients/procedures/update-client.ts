import { ORPCError } from "@orpc/client";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const updateClient = protectedProcedure
	.route({
		method: "POST",
		path: "/clients/{clientId}/update",
		tags: ["Clients"],
		summary: "Update client",
	})
	.input(
		z.object({
			clientId: z.string(),
			name: z.string().min(1).optional(),
			industry: z.string().optional(),
			operationsProfile: z.string().optional(),
			businessModel: z.string().optional(),
			employeeCount: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input: { clientId, ...data }, context: { session } }) => {
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

		const client = await db.client.update({
			where: { id: clientId },
			data,
		});

		return client;
	});
