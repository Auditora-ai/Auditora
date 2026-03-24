"use client";

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

	return (
		<div
			className="flex flex-col overflow-hidden border-l border-[#334155] bg-[#0F172A]"
			style={{ gridArea: "right", width: 280 }}
		>
			{/* Transcript: ~40% */}
			<div className="flex-[4] overflow-hidden border-b border-[#334155]">
				<TranscriptSection transcript={transcript} />
			</div>

			{/* Teleprompter/Suggestions: ~35% */}
			<div className="flex-[3.5] overflow-hidden border-b border-[#334155]">
				<TeleprompterSection
					currentQuestion={teleprompterQuestion}
					questionQueue={questionQueue}
					completenessScore={completenessScore}
					sipocCoverage={sipocCoverage}
					gapType={gapType}
				/>
			</div>

			{/* Documents: ~25% */}
			<div className="flex-[2.5] overflow-hidden">
				<DocumentsSection
					organizationId={organizationId}
					processId={processId}
				/>
			</div>
		</div>
	);
}
