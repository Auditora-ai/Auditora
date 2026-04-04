"use client";

import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import { TeleprompterSection } from "./TeleprompterSection";
import { TranscriptSection } from "./TranscriptSection";

export function ExpandedSipocChat() {
	const t = useTranslations("meeting");
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
			className="flex flex-col overflow-hidden border-r border-chrome-border bg-chrome-base"
			style={{ gridArea: "left" }}
		>
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-chrome-border px-4 py-3">
				<SparklesIcon className="h-4 w-4 text-primary" />
				<span className="text-sm font-medium text-chrome-text">
					{t("layout.sipocAnalysis")}
				</span>
			</div>

			{/* SIPOC Chat — full height, non-compact */}
			<div className="flex-1 overflow-y-auto thin-scrollbar">
				<TeleprompterSection
					currentQuestion={teleprompterQuestion}
					questionQueue={questionQueue}
					completenessScore={completenessScore}
					sipocCoverage={sipocCoverage}
					gapType={gapType}
					compact={false}
				/>
			</div>

			{/* Transcript mini-feed at bottom */}
			<div className="max-h-[200px] overflow-y-auto border-t border-chrome-border thin-scrollbar">
				<TranscriptSection transcript={transcript} />
			</div>
		</div>
	);
}
