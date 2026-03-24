"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import { TranscriptSection } from "./TranscriptSection";
import { TeleprompterSection } from "./TeleprompterSection";
import { DocumentsSection } from "./DocumentsSection";

interface RightPanelProps {
	organizationId: string;
	processId?: string;
}

export function RightPanel({ organizationId, processId }: RightPanelProps) {
	const {
		transcript,
		teleprompterQuestion,
		questionQueue,
		completenessScore,
		sipocCoverage,
		gapType,
	} = useLiveSessionContext();

	const [transcriptOpen, setTranscriptOpen] = useState(true);
	const [sipocOpen, setSipocOpen] = useState(true);
	const [docsOpen, setDocsOpen] = useState(false);

	return (
		<div
			className="flex flex-col overflow-hidden border-l border-[#334155] bg-[#0F172A]"
			style={{ gridArea: "right", width: 280 }}
		>
			{/* Transcript — collapsible, compact by default */}
			<div className={`flex flex-col border-b border-[#334155] ${transcriptOpen ? "max-h-[40%]" : ""}`}>
				<AccordionHeader
					title="Transcripcion"
					open={transcriptOpen}
					onToggle={() => setTranscriptOpen(!transcriptOpen)}
					badge={transcript.length > 0 ? `${transcript.length}` : undefined}
				/>
				{transcriptOpen && (
					<div className="min-h-0 flex-1 overflow-hidden">
						<TranscriptSection transcript={transcript} />
					</div>
				)}
			</div>

			{/* Sugerencias IA — main section, always expanded */}
			<div className="flex min-h-0 flex-1 flex-col border-t border-[#334155]">
				<AccordionHeader
					title="Sugerencias IA"
					open={sipocOpen}
					onToggle={() => setSipocOpen(!sipocOpen)}
					badge={gapType || "SIPOC"}
				/>
				{sipocOpen && (
					<div className="min-h-0 flex-1 overflow-hidden">
						<TeleprompterSection
							currentQuestion={teleprompterQuestion}
							questionQueue={questionQueue}
							completenessScore={completenessScore}
							sipocCoverage={sipocCoverage}
							gapType={gapType}
							compact
						/>
					</div>
				)}
			</div>

			{/* Documentos — accordion */}
			<div className={`flex flex-col border-t border-[#334155] ${docsOpen ? "max-h-[35%]" : ""}`}>
				<AccordionHeader
					title="Documentos"
					open={docsOpen}
					onToggle={() => setDocsOpen(!docsOpen)}
				/>
				{docsOpen && (
					<div className="min-h-0 flex-1 overflow-hidden">
						<DocumentsSection
							organizationId={organizationId}
							processId={processId}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

function AccordionHeader({
	title,
	open,
	onToggle,
	badge,
}: {
	title: string;
	open: boolean;
	onToggle: () => void;
	badge?: string;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#1E293B]"
		>
			{open ? (
				<ChevronDownIcon className="h-3 w-3 text-[#64748B]" />
			) : (
				<ChevronRightIcon className="h-3 w-3 text-[#64748B]" />
			)}
			<span className="text-xs font-medium text-[#94A3B8]">{title}</span>
			{badge && (
				<span className="ml-auto rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[9px] font-medium text-[#3B82F6]">
					{badge}
				</span>
			)}
		</button>
	);
}
