"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import { TranscriptSection } from "./TranscriptSection";
import { TeleprompterSection } from "./TeleprompterSection";
import { DocumentsSection } from "./DocumentsSection";

const GAP_BADGE_KEYS: Record<string, string> = {
	missing_role: "rightPanel.gapRoles", missing_supplier: "rightPanel.gapSuppliers", missing_input: "rightPanel.gapInputs",
	missing_output: "rightPanel.gapOutputs", missing_customer: "rightPanel.gapCustomers", missing_trigger: "rightPanel.gapTriggers",
	missing_decision: "rightPanel.gapDecisions", missing_exception: "rightPanel.gapExceptions", missing_sla: "rightPanel.gapTimings",
	missing_system: "rightPanel.gapSystems", general_exploration: "rightPanel.gapExploration",
};

interface RightPanelProps {
	organizationId: string;
	processId?: string;
	collapsed: boolean;
}

export function RightPanel({ organizationId, processId, collapsed }: RightPanelProps) {
	const t = useTranslations("meeting");
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

	if (collapsed) return <div style={{ gridArea: "right" }} />;

	const gapBadge = gapType
		? (GAP_BADGE_KEYS[gapType] ? t(GAP_BADGE_KEYS[gapType]) : gapType)
		: "SIPOC";

	return (
		<div
			className="flex flex-col overflow-hidden border-l border-chrome-border bg-chrome-base"
			style={{ gridArea: "right" }}
		>
			{/* Transcript */}
			<AccordionHeader
				title={t("rightPanel.transcription")}
				open={transcriptOpen}
				onToggle={() => setTranscriptOpen(!transcriptOpen)}
				badge={transcript.length > 0 ? `${transcript.length}` : undefined}
			/>
			{transcriptOpen && (
				<div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar">
					<TranscriptSection transcript={transcript} />
				</div>
			)}

			{/* AI Suggestions */}
			<AccordionHeader
				title={t("rightPanel.aiSuggestions")}
				open={sipocOpen}
				onToggle={() => setSipocOpen(!sipocOpen)}
				badge={gapBadge}
			/>
			{sipocOpen && (
				<div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar">
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

			{/* Documents */}
			<AccordionHeader
				title={t("rightPanel.documents")}
				open={docsOpen}
				onToggle={() => setDocsOpen(!docsOpen)}
			/>
			{docsOpen && (
				<div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar">
					<DocumentsSection
						organizationId={organizationId}
						processId={processId}
					/>
				</div>
			)}
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
			className="flex w-full shrink-0 items-center gap-2 border-t border-chrome-border px-3 py-2 text-left transition-colors first:border-t-0 hover:bg-chrome-raised"
		>
			{open ? (
				<ChevronDownIcon className="h-3.5 w-3.5 text-chrome-text-muted" />
			) : (
				<ChevronRightIcon className="h-3.5 w-3.5 text-chrome-text-muted" />
			)}
			<span className="font-display text-sm text-chrome-text-secondary">{title}</span>
			{badge && (
				<span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
					{badge}
				</span>
			)}
		</button>
	);
}
