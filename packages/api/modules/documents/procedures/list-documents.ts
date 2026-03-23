import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";

export const listDocuments = protectedProcedure
	.route({
		method: "GET",
		path: "/documents",
		tags: ["Documents"],
		summary: "List documents",
		description: "List documents for the current organization",
	})
	.handler(
		async ({ context: { session } }) => {
			const orgId = session.activeOrganizationId;
			if (!orgId) {
				throw new ORPCError("FORBIDDEN");
			}

			const documents = await db.document.findMany({
				where: {
					organizationId: orgId,
				},
				include: {
					_count: {
						select: {
							versions: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			return documents;
		},
	);
