import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const createClient = protectedProcedure
	.route({
		method: "POST",
		path: "/clients",
		tags: ["Clients"],
		summary: "Create client",
	})
	.input(
		z.object({
			name: z.string().min(1),
			industry: z.string().optional(),
			operationsProfile: z.string().optional(),
			businessModel: z.string().optional(),
			employeeCount: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context: { session } }) => {
		const client = await db.client.create({
			data: {
				...input,
				organizationId: session.activeOrganizationId!,
			},
		});

		return client;
	});
