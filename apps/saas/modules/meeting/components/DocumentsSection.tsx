"use client";

import { FileUpIcon } from "lucide-react";
import { SessionDocumentsPanel } from "./SessionDocumentsPanel";

interface DocumentsSectionProps {
	organizationId: string;
	processId?: string;
}

export function DocumentsSection({ organizationId, processId }: DocumentsSectionProps) {
	return (
		<div className="flex flex-col overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-[#334155] px-3 py-2">
				<FileUpIcon className="h-3.5 w-3.5 text-[#64748B]" />
				<span className="text-xs font-medium text-[#94A3B8]">
					Documentos
				</span>
			</div>

			{/* Reuse existing SessionDocumentsPanel (has drag-drop + upload + file list) */}
			<div className="flex-1 overflow-y-auto [&_button]:text-xs [&_button]:py-1.5 [&_.text-muted-foreground]:text-[#64748B]">
				<SessionDocumentsPanel
					organizationId={organizationId}
					processId={processId}
				/>
			</div>
		</div>
	);
}
