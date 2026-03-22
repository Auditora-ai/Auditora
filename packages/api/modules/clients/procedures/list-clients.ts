import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";

export const listClients = protectedProcedure
	.route({
		method: "GET",
		path: "/clients",
		tags: ["Clients"],
		summary: "List clients",
	})
	.handler(async ({ context: { session } }) => {
		const clients = await db.client.findMany({
			where: {
				organizationId: session.activeOrganizationId,
			},
			include: {
				_count: {
					select: {
						projects: true,
						documents: true,
					},
				},
			},
			orderBy: {
				name: "asc",
			},
		});

		return clients;
	});
