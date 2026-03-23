"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { FileText, Download } from "lucide-react";

interface ExportReportButtonProps {
	/** Map of processId → SVG string (pre-rendered on client) */
	getSvgMap?: () => Promise<Record<string, string>>;
}

export function ExportReportButton({ getSvgMap }: ExportReportButtonProps) {
	const [loading, setLoading] = useState(false);

	const handleExport = async () => {
		setLoading(true);

		try {
			const svgMap = getSvgMap ? await getSvgMap() : {};

			const res = await fetch("/api/processes/export-report", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ svgMap }),
			});

			if (!res.ok) {
				console.error("Export failed");
				return;
			}

			const html = await res.text();

			// Open in new tab for print-to-PDF
			const blob = new Blob([html], { type: "text/html" });
			const url = URL.createObjectURL(blob);
			window.open(url, "_blank");

			// Clean up after a delay
			setTimeout(() => URL.revokeObjectURL(url), 5000);
		} catch (err) {
			console.error("Export error:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleExport}
			loading={loading}
		>
			<FileText className="mr-1.5 h-3.5 w-3.5" />
			Export Report
		</Button>
	);
}
