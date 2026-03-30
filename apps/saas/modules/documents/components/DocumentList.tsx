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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	FileTextIcon,
	FileImageIcon,
	FileSpreadsheetIcon,
	DownloadIcon,
	TrashIcon,
	PencilIcon,
	CheckIcon,
	XIcon,
	MoreHorizontalIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@shared/components/EmptyState";
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
	const t = useTranslations("emptyStates.documents");
	const tc = useTranslations("common");
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
				<EmptyState
					icon={FileTextIcon}
					title={t("noDocuments")}
					description={t("noDocumentsDesc")}
				/>
			</Card>
		);
	}

	const hasMenuActions = onEdit || onDelete;

	return (
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{tc("name")}</TableHead>
						<TableHead>{tc("type")}</TableHead>
						<TableHead>{tc("size")}</TableHead>
						<TableHead>{tc("date")}</TableHead>
						<TableHead className="text-right">{tc("actions")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{documents.map((doc) => {
						const Icon = getFileIcon(doc.mimeType);
						return (
							<TableRow key={doc.id}>
								<TableCell>
									<div className="flex items-center gap-2">
										<Icon className="h-4 w-4 text-chrome-text-secondary" />
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
								<TableCell className="text-chrome-text-secondary">
									{doc.mimeType.split("/").pop()}
								</TableCell>
								<TableCell className="text-chrome-text-secondary">
									{formatFileSize(doc.fileSize)}
								</TableCell>
								<TableCell className="text-chrome-text-secondary">
									{new Date(
										doc.createdAt,
									).toLocaleDateString()}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-1">
										{showExtract && (
											<ExtractProcessesButton
												documentId={doc.id}
												hasExtractedText={!!doc.extractedText}
												onExtracted={() => onExtracted?.()}
											/>
										)}
										{onDownload && (
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => onDownload(doc.id)}
											>
												<DownloadIcon className="h-4 w-4" />
											</Button>
										)}
										{hasMenuActions && editingId !== doc.id && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon" className="h-8 w-8">
														<MoreHorizontalIcon className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													{onEdit && (
														<DropdownMenuItem onClick={() => startEdit(doc)}>
															<PencilIcon className="mr-2 h-4 w-4" />
															{tc("edit")}
														</DropdownMenuItem>
													)}
													{onDelete && (
														<>
															{onEdit && <DropdownMenuSeparator />}
															<DropdownMenuItem
																className="text-destructive focus:text-destructive"
																onClick={() => onDelete(doc.id)}
															>
																<TrashIcon className="mr-2 h-4 w-4" />
																{tc("delete")}
															</DropdownMenuItem>
														</>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
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
