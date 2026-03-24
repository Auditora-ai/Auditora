"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DiagramNode, BotActivity, TranscriptEntry } from "../types";
import type { DiagramHealth } from "../context/LiveSessionContext";

interface LiveSessionData {
	sessionStatus: "ACTIVE" | "ENDED";
	transcript: TranscriptEntry[];
	nodes: DiagramNode[];
	teleprompterQuestion: string | null;
	questionQueue: string[];
	completenessScore: number | null;
	sipocCoverage: Record<string, number> | null;
	gapType: string | null;
	botActivity: BotActivity;
	diagramHealth: DiagramHealth;
}

const DEFAULT_BOT_ACTIVITY: BotActivity = {
	type: "listening",
	detail: null,
	updatedAt: null,
	stale: true,
};

const DEFAULT_HEALTH: DiagramHealth = {
	valid: true,
	needsRepair: false,
	warningCount: 0,
	warnings: [],
};

export function useLiveSession(
	sessionId: string,
	modelerApi: any | null,
	aiEnabled: boolean,
): LiveSessionData {
	const [data, setData] = useState<LiveSessionData>({
		sessionStatus: "ACTIVE",
		transcript: [],
		nodes: [],
		teleprompterQuestion: null,
		questionQueue: [],
		completenessScore: null,
		sipocCoverage: null,
		gapType: null,
		botActivity: DEFAULT_BOT_ACTIVITY,
		diagramHealth: DEFAULT_HEALTH,
	});

	const prevNodesRef = useRef<string>("");
	const failCountRef = useRef(0);
	const stoppedRef = useRef(false);

	const poll = useCallback(async () => {
		if (stoppedRef.current) return;

		try {
			const res = await fetch(`/api/sessions/${sessionId}/live-data`);

			if (res.status === 404) {
				stoppedRef.current = true;
				return;
			}

			if (!res.ok) {
				failCountRef.current++;
				return;
			}

			failCountRef.current = 0;
			const json = await res.json();

			const newNodes: DiagramNode[] = (json.nodes || []).map((n: any) => ({
				id: n.id,
				type: n.type,
				label: n.label,
				state: n.state,
				lane: n.lane || undefined,
				connections: n.connections || [],
				confidence: n.confidence ?? null,
			}));

			// Diff nodes to avoid unnecessary mergeAiNodes calls
			const nodesKey = JSON.stringify(newNodes.map((n) => `${n.id}:${n.state}:${n.label}`));
			const nodesChanged = nodesKey !== prevNodesRef.current;

			if (nodesChanged && modelerApi?.isReady && aiEnabled) {
				modelerApi.mergeAiNodes(newNodes);
				prevNodesRef.current = nodesKey;
			}

			setData({
				sessionStatus: json.status || "ACTIVE",
				transcript: json.transcript || [],
				nodes: newNodes,
				teleprompterQuestion: json.teleprompterQuestion || null,
				questionQueue: json.questionQueue || [],
				completenessScore: json.completenessScore ?? null,
				sipocCoverage: json.sipocCoverage ?? null,
				gapType: json.gapType ?? null,
				botActivity: json.botActivity || DEFAULT_BOT_ACTIVITY,
				diagramHealth: json.diagramHealth || DEFAULT_HEALTH,
			});

			if (json.status === "ENDED") {
				stoppedRef.current = true;
			}
		} catch {
			failCountRef.current++;
		}
	}, [sessionId, modelerApi, aiEnabled]);

	useEffect(() => {
		stoppedRef.current = false;
		failCountRef.current = 0;

		// Initial poll
		poll();

		// Poll interval with backoff on failures
		const id = setInterval(() => {
			if (stoppedRef.current) return;
			const backoff = Math.min(failCountRef.current, 3);
			if (backoff > 0) {
				// Skip this interval if in backoff (simple approach)
				failCountRef.current--;
				return;
			}
			poll();
		}, 3000);

		return () => {
			clearInterval(id);
			stoppedRef.current = true;
		};
	}, [poll]);

	return data;
}
