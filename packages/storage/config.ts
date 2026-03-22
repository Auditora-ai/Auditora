import type { StorageConfig } from "./types";

export const config = {
	bucketNames: {
		avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		documents:
			process.env.NEXT_PUBLIC_DOCUMENTS_BUCKET_NAME ?? "documents",
	},
} as const satisfies StorageConfig;
