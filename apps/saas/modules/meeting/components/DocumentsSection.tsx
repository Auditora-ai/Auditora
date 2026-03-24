"use client";

import { SessionDocumentsPanel } from "./SessionDocumentsPanel";

interface DocumentsSectionProps {
	organizationId: string;
	processId?: string;
}

export function DocumentsSection({ organizationId, processId }: DocumentsSectionProps) {
	return (
		<div className="flex h-full flex-col overflow-y-auto [&_button]:text-xs [&_button]:py-1.5 [&_.text-muted-foreground]:text-[#64748B]">
			<SessionDocumentsPanel
				organizationId={organizationId}
				processId={processId}
			/>
		</div>
	);
}
