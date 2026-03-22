import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getArchitectureTree = protectedProcedure
	.route({
		method: "GET",
		path: "/processes/architecture-tree",
		tags: ["Processes"],
		summary: "Get architecture tree",
		description:
			"Get the full process architecture tree for a project, including all definitions with recursive children",
	})
	.input(
		z.object({
			projectId: z.string(),
		}),
	)
	.handler(async ({ context: { session }, input: { projectId } }) => {
		// Verify org ownership: project → client → organizationId
		const project = await db.project.findUnique({
			where: { id: projectId },
			include: { client: true },
		});

		if (!project) {
			throw new ORPCError("NOT_FOUND", {
				message: "Project not found",
			});
		}

		if (project.client.organizationId !== session.activeOrganizationId) {
			throw new ORPCError("FORBIDDEN");
		}

		const architecture = await db.processArchitecture.findUnique({
			where: { projectId },
			include: {
				definitions: {
					include: {
						children: {
							include: {
								children: {
									include: {
										children: true,
									},
								},
							},
						},
					},
					where: {
						parentId: null,
					},
					orderBy: {
						priority: "asc",
					},
				},
			},
		});

		return architecture;
	});
