"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	FileUpIcon,
	FileTextIcon,
	FileImageIcon,
	Loader2Icon,
	TrashIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";

interface DocumentItem {
	id: string;
	name: string;
	mimeType: string;
	fileSize: number;
	createdAt: Date | string;
}

interface SessionDocumentsPanelProps {
	organizationId: string;
	processId?: string;
	onDocumentReady?: () => void;
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) return FileImageIcon;
	return FileTextIcon;
}

export function SessionDocumentsPanel({
	organizationId,
	processId,
	onDocumentReady,
}: SessionDocumentsPanelProps) {
	const t = useTranslations("meetingModule");
	const [documents, setDocuments] = useState<DocumentItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchDocs = useCallback(async () => {
		try {
			const { orpcClient } = await import("@shared/lib/orpc-client");
			const docs = await orpcClient.documents.list();
			setDocuments(docs || []);
		} catch {
			try {
				const res = await fetch("/api/rpc/documents.list", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});
				if (res.ok) {
					const data = await res.json();
					setDocuments(data || []);
				}
			} catch {
				// no documents endpoint available
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDocs();
	}, [fetchDocs]);

	const handleUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		// Client-side validation
		for (const file of Array.from(files)) {
			if (file.size > 50 * 1024 * 1024) {
				alert(`${file.name} excede 50MB`);
				return;
			}
		}

		setUploading(true);
		try {
			for (const file of Array.from(files)) {
				const { orpcClient } = await import("@shared/lib/orpc-client");
				const result = await orpcClient.documents.createUploadUrl({
					fileName: file.name,
					mimeType: file.type,
				});
				await fetch(result.signedUploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});
			}
			await fetchDocs();
			onDocumentReady?.();
		} catch (err) {
			console.error("[SessionDocuments] Upload error:", err);
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (documentId: string) => {
		try {
			const { orpcClient } = await import("@shared/lib/orpc-client");
			await orpcClient.documents.delete({ documentId });
			setDocuments((prev) => prev.filter((d) => d.id !== documentId));
		} catch (err) {
			console.error("[SessionDocuments] Delete error:", err);
		}
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				<Loader2Icon className="h-5 w-5 animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{/* Upload Zone */}
			<div className="border-b border-border p-3">
				<div
					className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
						dragOver
							? "border-primary bg-primary/5"
							: "border-border hover:border-primary/50"
					}`}
					onDragOver={(e) => {
						e.preventDefault();
						setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragOver(false);
						handleUpload(e.dataTransfer.files);
					}}
					onClick={() => fileInputRef.current?.click()}
				>
					<FileUpIcon className="mb-1.5 h-5 w-5 text-muted-foreground" />
					<p className="text-xs text-muted-foreground">
						{uploading
							? "Subiendo..."
							: "Arrastra archivos o haz click"}
					</p>
					<p className="mt-0.5 text-[10px] text-muted-foreground/60">
						PDF, DOCX, TXT, imagenes — max 50MB
					</p>
					<input
						ref={fileInputRef}
						type="file"
						className="hidden"
						multiple
						accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
						onChange={(e) => handleUpload(e.target.files)}
					/>
				</div>
			</div>

			{/* Document List */}
			<div>
				{documents.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-1 py-4 text-center text-sm text-muted-foreground">
						<FileTextIcon className="h-8 w-8 opacity-30" />
						<p className="text-xs">{t("noDocuments")}</p>
						<p className="max-w-[180px] text-[10px] text-muted-foreground/60">
							Sube manuales, diagramas o cualquier referencia para esta sesion
						</p>
					</div>
				) : (
					<div className="divide-y divide-border">
						{documents.map((doc) => {
							const Icon = getFileIcon(doc.mimeType);
							return (
								<div
									key={doc.id}
									className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30"
								>
									<Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
									<div className="min-w-0 flex-1">
										<p className="truncate text-xs font-medium">
											{doc.name}
										</p>
										<p className="text-[10px] text-muted-foreground">
											{formatFileSize(doc.fileSize)}
										</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
										onClick={() => handleDelete(doc.id)}
									>
										<TrashIcon className="h-3.5 w-3.5" />
									</Button>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
