"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui/components/input";
import { Card } from "@repo/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import {
	FileTextIcon,
	FileImageIcon,
	FileSpreadsheetIcon,
	DownloadIcon,
	TrashIcon,
	PencilIcon,
	CheckIcon,
	XIcon,
} from "lucide-react";
import { ExtractProcessesButton } from "./ExtractProcessesButton";

type Document = {
	id: string;
	name: string;
	mimeType: string;
	fileSize: number;
	createdAt: Date;
	isProcessed?: boolean;
	extractedText?: string | null;
};

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) return FileImageIcon;
	if (
		mimeType.includes("spreadsheet") ||
		mimeType.includes("csv") ||
		mimeType.includes("excel")
	)
		return FileSpreadsheetIcon;
	return FileTextIcon;
}

export function DocumentList({
	documents,
	onDownload,
	onDelete,
	onEdit,
	showExtract = false,
	onExtracted,
}: {
	documents: Document[];
	onDownload?: (id: string) => void;
	onDelete?: (id: string) => void;
	onEdit?: (id: string, data: { name: string }) => void;
	showExtract?: boolean;
	onExtracted?: () => void;
}) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");

	const startEdit = (doc: Document) => {
		setEditingId(doc.id);
		setEditName(doc.name);
	};

	const saveEdit = () => {
		if (editingId && editName.trim()) {
			onEdit?.(editingId, { name: editName.trim() });
		}
		setEditingId(null);
	};

	const cancelEdit = () => {
		setEditingId(null);
	};
	if (documents.length === 0) {
		return (
			<Card>
				<div className="flex flex-col items-center justify-center p-12 text-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<FileTextIcon className="h-6 w-6 text-primary" />
					</div>
					<p className="text-sm text-muted-foreground">
						No documents uploaded yet.
					</p>
				</div>
			</Card>
		);
	}

	return (
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Size</TableHead>
						<TableHead>Date</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{documents.map((doc) => {
						const Icon = getFileIcon(doc.mimeType);
						return (
							<TableRow key={doc.id}>
								<TableCell>
									<div className="flex items-center gap-2">
										<Icon className="h-4 w-4 text-muted-foreground" />
										{editingId === doc.id ? (
											<div className="flex items-center gap-1">
												<Input
													value={editName}
													onChange={(e) => setEditName(e.target.value)}
													className="h-7 w-48 text-sm"
													autoFocus
													onKeyDown={(e) => {
														if (e.key === "Enter") saveEdit();
														if (e.key === "Escape") cancelEdit();
													}}
												/>
												<Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEdit}>
													<CheckIcon className="h-3.5 w-3.5" />
												</Button>
												<Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
													<XIcon className="h-3.5 w-3.5" />
												</Button>
											</div>
										) : (
											<span className="font-medium text-foreground">
												{doc.name}
											</span>
										)}
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{doc.mimeType.split("/").pop()}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{formatFileSize(doc.fileSize)}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{new Date(
										doc.createdAt,
									).toLocaleDateString()}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-2">
										{showExtract && (
											<ExtractProcessesButton
												documentId={doc.id}
												hasExtractedText={!!doc.extractedText}
												onExtracted={() => onExtracted?.()}
											/>
										)}
										{onEdit && editingId !== doc.id && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() => startEdit(doc)}
											>
												<PencilIcon className="h-4 w-4" />
											</Button>
										)}
										{onDownload && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													onDownload(doc.id)
												}
											>
												<DownloadIcon className="h-4 w-4" />
											</Button>
										)}
										{onDelete && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													onDelete(doc.id)
												}
											>
												<TrashIcon className="h-4 w-4" />
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</Card>
	);
}
