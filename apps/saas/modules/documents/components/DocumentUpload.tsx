"use client";

import { Spinner } from "@repo/ui";
import { UploadIcon } from "lucide-react";
import { type HTMLAttributes, useState } from "react";
import { useDropzone } from "react-dropzone";

export function DocumentUpload({
	onUpload,
}: {
	onUpload: (file: File) => Promise<void>;
}) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: async (acceptedFiles) => {
			const file = acceptedFiles[0];
			if (!file) return;

			setUploading(true);
			setError(null);
			try {
				await onUpload(file);
			} catch {
				setError("Failed to upload file. Please try again.");
			} finally {
				setUploading(false);
			}
		},
		multiple: false,
	});

	return (
		<div
			{...(getRootProps() as HTMLAttributes<HTMLDivElement>)}
			className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 transition-colors ${
				isDragActive
					? "border-primary bg-primary/5"
					: "border-border hover:border-primary/50"
			}`}
		>
			<input {...getInputProps()} />

			{uploading ? (
				<div className="flex items-center gap-2">
					<Spinner className="size-5" />
					<span className="text-sm text-muted-foreground">
						Uploading...
					</span>
				</div>
			) : (
				<>
					<UploadIcon className="mb-2 h-8 w-8 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						{isDragActive
							? "Drop the file here..."
							: "Drag and drop a file here, or click to select"}
					</p>
				</>
			)}

			{error && (
				<p className="mt-2 text-sm text-destructive">{error}</p>
			)}
		</div>
	);
}
