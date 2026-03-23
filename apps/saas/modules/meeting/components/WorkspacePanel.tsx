"use client";

import { useEffect, useRef } from "react";
import { useWorkspaceTabs } from "../hooks/useWorkspaceTabs";
import { WorkspaceTabBar } from "./WorkspaceTabBar";
import { TranscriptPanel } from "./TranscriptPanel";
import { LiveChatPanel } from "./LiveChatPanel";
import { SessionDocumentsPanel } from "./SessionDocumentsPanel";
import { ProcessEditPanel } from "./ProcessEditPanel";

interface TranscriptEntry {
	id: string;
	speaker: string;
	text: string;
	timestamp: number;
}

interface WorkspacePanelProps {
	transcript: TranscriptEntry[];
	sessionId: string;
	processId?: string;
	organizationId: string;
	sessionStatus: "ACTIVE" | "ENDED";
	sessionType: "DISCOVERY" | "DEEP_DIVE";
	compact?: boolean;
}

export function WorkspacePanel({
	transcript,
	sessionId,
	processId,
	organizationId,
	sessionStatus,
	sessionType,
	compact = false,
}: WorkspacePanelProps) {
	const { activeTab, setActiveTab, unreadCounts, incrementUnread } =
		useWorkspaceTabs();

	// Track transcript length for unread badge
	const prevTranscriptLenRef = useRef(transcript.length);
	useEffect(() => {
		const delta = transcript.length - prevTranscriptLenRef.current;
		if (delta > 0) {
			incrementUnread("transcript", delta);
		}
		prevTranscriptLenRef.current = transcript.length;
	}, [transcript.length, incrementUnread]);

	const handleChatNewMessage = () => {
		incrementUnread("chat");
	};

	const handleDocumentReady = () => {
		incrementUnread("documents");
	};

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<WorkspaceTabBar
				activeTab={activeTab}
				onTabChange={setActiveTab}
				unreadCounts={unreadCounts}
				compact={compact}
			/>

			<div className="relative flex-1 overflow-hidden">
				{/* All tabs mounted, visibility-toggled for instant switching */}
				<div className={`absolute inset-0 ${activeTab === "transcript" ? "" : "hidden"}`}>
					<TranscriptPanel entries={transcript} />
				</div>

				<div className={`absolute inset-0 ${activeTab === "chat" ? "" : "hidden"}`}>
					<LiveChatPanel
						organizationId={organizationId}
						sessionId={sessionId}
						transcript={transcript}
						sessionEnded={sessionStatus === "ENDED"}
						onNewMessage={handleChatNewMessage}
					/>
				</div>

				<div className={`absolute inset-0 ${activeTab === "documents" ? "" : "hidden"}`}>
					<SessionDocumentsPanel
						organizationId={organizationId}
						processId={processId}
						onDocumentReady={handleDocumentReady}
					/>
				</div>

				<div className={`absolute inset-0 ${activeTab === "process" ? "" : "hidden"}`}>
					<ProcessEditPanel
						processId={processId}
						organizationId={organizationId}
						sessionType={sessionType}
					/>
				</div>
			</div>
		</div>
	);
}
