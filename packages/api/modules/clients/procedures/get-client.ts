import { ORPCError } from "@orpc/client";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getClient = protectedProcedure
	.route({
		method: "GET",
		path: "/clients/{clientId}",
		tags: ["Clients"],
		summary: "Get client by ID",
	})
	.input(
		z.object({
			clientId: z.string(),
		}),
	)
	.handler(async ({ input: { clientId }, context: { session } }) => {
		const client = await db.client.findUnique({
			where: {
				id: clientId,
			},
			include: {
				projects: {
					include: {
						_count: {
							select: {
								sessions: true,
							},
						},
					},
				},
				documents: true,
			},
		});

		if (!client) {
			throw new ORPCError("NOT_FOUND");
		}

		if (client.organizationId !== session.activeOrganizationId) {
			throw new ORPCError("FORBIDDEN");
		}

		return client;
	});
