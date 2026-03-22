import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const listDocuments = protectedProcedure
	.route({
		method: "GET",
		path: "/documents",
		tags: ["Documents"],
		summary: "List documents",
		description: "List documents for a given client or project",
	})
	.input(
		z.object({
			clientId: z.string().optional(),
			projectId: z.string().optional(),
		}),
	)
	.handler(
		async ({ context: { session }, input: { clientId, projectId } }) => {
			// Verify org ownership through client
			if (clientId) {
				const client = await db.client.findUnique({
					where: { id: clientId },
				});

				if (!client) {
					throw new ORPCError("NOT_FOUND", {
						message: "Client not found",
					});
				}

				if (client.organizationId !== session.activeOrganizationId) {
					throw new ORPCError("FORBIDDEN");
				}
			}

			// Verify org ownership through project → client
			if (projectId) {
				const project = await db.project.findUnique({
					where: { id: projectId },
					include: { client: true },
				});

				if (!project) {
					throw new ORPCError("NOT_FOUND", {
						message: "Project not found",
					});
				}

				if (
					project.client.organizationId !==
					session.activeOrganizationId
				) {
					throw new ORPCError("FORBIDDEN");
				}
			}

			const documents = await db.document.findMany({
				where: {
					...(clientId ? { clientId } : {}),
					...(projectId ? { projectId } : {}),
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
