"use client";

import { useState, useRef } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Upload, FileCheck, AlertCircle } from "lucide-react";

interface ImportBpmnDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	architectureId: string;
	onImported?: () => void;
}

export function ImportBpmnDialog({
	open,
	onOpenChange,
	architectureId,
	onImported,
}: ImportBpmnDialogProps) {
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0];
		setError(null);
		setSuccess(false);

		if (!selected) return;

		if (!selected.name.endsWith(".bpmn") && !selected.name.endsWith(".xml")) {
			setError("Please select a .bpmn or .xml file");
			return;
		}

		if (selected.size > 10 * 1024 * 1024) {
			setError("File too large (max 10MB)");
			return;
		}

		setFile(selected);
	};

	const handleImport = async () => {
		if (!file) return;

		setLoading(true);
		setError(null);

		try {
			const text = await file.text();

			if (!text.includes("definitions")) {
				setError("Invalid BPMN file — missing definitions element");
				setLoading(false);
				return;
			}

			const res = await fetch("/api/processes/import", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bpmnXml: text,
					architectureId,
					name: file.name.replace(/\.(bpmn|xml)$/, ""),
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "Import failed");
				setLoading(false);
				return;
			}

			setSuccess(true);
			setTimeout(() => {
				onOpenChange(false);
				setFile(null);
				setSuccess(false);
				onImported?.();
			}, 1000);
		} catch {
			setError("Network error — please try again");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Import BPMN</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div
						role="button"
						tabIndex={0}
						aria-label="Select a BPMN file to import"
						className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						onClick={() => inputRef.current?.click()}
						onKeyDown={(e) =>
							(e.key === "Enter" || e.key === " ") && inputRef.current?.click()
						}
					>
						<input
							ref={inputRef}
							type="file"
							accept=".bpmn,.xml"
							className="hidden"
							onChange={handleFileChange}
						/>
						{success ? (
							<>
								<FileCheck className="mb-2 h-8 w-8 text-emerald-500" />
								<p className="text-sm font-medium text-emerald-500">
									Imported successfully
								</p>
							</>
						) : file ? (
							<>
								<FileCheck className="mb-2 h-8 w-8 text-primary" />
								<p className="text-sm font-medium">{file.name}</p>
								<p className="text-xs text-muted-foreground">
									{(file.size / 1024).toFixed(1)} KB
								</p>
							</>
						) : (
							<>
								<Upload className="mb-2 h-8 w-8 text-muted-foreground" />
								<p className="text-sm font-medium">
									Click to select a .bpmn file
								</p>
								<p className="text-xs text-muted-foreground">
									or drag and drop
								</p>
							</>
						)}
					</div>

					{error && (
						<div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
							<AlertCircle className="h-4 w-4 shrink-0" />
							{error}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleImport}
						disabled={!file || loading || success}
						loading={loading}
					>
						Import
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
