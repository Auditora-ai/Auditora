import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";

export const getArchitectureTree = protectedProcedure
	.route({
		method: "GET",
		path: "/processes/architecture-tree",
		tags: ["Processes"],
		summary: "Get architecture tree",
		description:
			"Get the full process architecture tree for the organization, including all definitions with recursive children",
	})
	.handler(async ({ context: { session } }) => {
		const orgId = session.activeOrganizationId;
		if (!orgId) {
			throw new ORPCError("FORBIDDEN");
		}

		const architecture = await db.processArchitecture.findUnique({
			where: { organizationId: orgId },
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
