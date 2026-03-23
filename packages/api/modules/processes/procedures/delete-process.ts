import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteProcess = protectedProcedure
	.route({
		method: "POST",
		path: "/processes/delete",
		tags: ["Processes"],
		summary: "Delete process definition",
		description:
			"Delete a process definition and all its children (cascade)",
	})
	.input(
		z.object({
			processId: z.string(),
		}),
	)
	.handler(async ({ context: { session }, input: { processId } }) => {
		// Verify org ownership
		const process = await db.processDefinition.findUnique({
			where: { id: processId },
			include: {
				architecture: {
					select: { organizationId: true },
				},
			},
		});

		if (!process) {
			throw new ORPCError("NOT_FOUND", {
				message: "Process not found",
			});
		}

		if (
			process.architecture.organizationId !==
			session.activeOrganizationId
		) {
			throw new ORPCError("FORBIDDEN");
		}

		// Recursively delete children by deleting the parent
		// Prisma schema does not have onDelete: Cascade for self-relation,
		// so we need to delete children manually
		async function deleteWithChildren(id: string) {
			const children = await db.processDefinition.findMany({
				where: { parentId: id },
				select: { id: true },
			});

			for (const child of children) {
				await deleteWithChildren(child.id);
			}

			await db.processDefinition.delete({
				where: { id },
			});
		}

		await deleteWithChildren(processId);

		return { success: true };
	});
