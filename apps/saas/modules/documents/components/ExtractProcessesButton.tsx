"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Sparkles, CheckCircle, AlertCircle } from "lucide-react";

interface ExtractProcessesButtonProps {
	documentId: string;
	hasExtractedText: boolean;
	onExtracted?: (count: number) => void;
}

export function ExtractProcessesButton({
	documentId,
	hasExtractedText,
	onExtracted,
}: ExtractProcessesButtonProps) {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const handleExtract = async () => {
		setLoading(true);
		setResult(null);

		try {
			const res = await fetch("/api/discovery/extract-documents", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ documentId }),
			});

			const data = await res.json();

			if (!res.ok) {
				setResult({ type: "error", message: data.error });
				return;
			}

			const count = data.processes?.length || 0;
			setResult({
				type: "success",
				message:
					count > 0
						? `Extracted ${count} processes`
						: "No processes found in this document",
			});
			onExtracted?.(count);
		} catch {
			setResult({ type: "error", message: "Network error" });
		} finally {
			setLoading(false);
		}
	};

	if (!hasExtractedText) {
		return (
			<p className="text-xs text-muted-foreground italic">
				Document not yet processed
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<Button
				variant="outline"
				size="sm"
				onClick={handleExtract}
				loading={loading}
				disabled={loading}
			>
				<Sparkles className="mr-1.5 h-3.5 w-3.5" />
				Extract Processes
			</Button>

			{result && (
				<div
					className={`flex items-center gap-1.5 text-xs ${
						result.type === "success"
							? "text-emerald-600"
							: "text-destructive"
					}`}
				>
					{result.type === "success" ? (
						<CheckCircle className="h-3.5 w-3.5" />
					) : (
						<AlertCircle className="h-3.5 w-3.5" />
					)}
					{result.message}
				</div>
			)}
		</div>
	);
}
