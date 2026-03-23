import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const createUploadUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/documents/upload-url",
		tags: ["Documents"],
		summary: "Create document upload URL",
		description:
			"Create a signed upload URL and a Document record for uploading a file",
	})
	.input(
		z.object({
			fileName: z.string(),
			mimeType: z.string(),
		}),
	)
	.handler(
		async ({
			context: { session, user },
			input: { fileName, mimeType },
		}) => {
			const orgId = session.activeOrganizationId;
			if (!orgId) {
				throw new ORPCError("FORBIDDEN");
			}

			const document = await db.document.create({
				data: {
					name: fileName,
					mimeType,
					filePath: "",
					fileSize: 0,
					organizationId: orgId,
					createdBy: user.id,
				},
			});

			const path = `${orgId}/${document.id}/${fileName}`;

			const signedUploadUrl = await getSignedUploadUrl(path, {
				bucket: "documents",
			});

			await db.document.update({
				where: { id: document.id },
				data: { filePath: path },
			});

			return { signedUploadUrl, documentId: document.id };
		},
	);
