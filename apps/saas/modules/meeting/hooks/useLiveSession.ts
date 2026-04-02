"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { DiagramNode } from "@repo/process-engine";
import type { BotActivity, TranscriptEntry } from "../types";
import type { DiagramHealth } from "../context/LiveSessionContext";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface LiveSessionData {
	sessionStatus: "ACTIVE" | "ENDED" | "FAILED" | "CONNECTING";
	connectionStatus: ConnectionStatus;
	transcript: TranscriptEntry[];
	nodes: DiagramNode[];
	teleprompterQuestion: string | null;
	questionQueue: string[];
	completenessScore: number | null;
	sipocCoverage: Record<string, number> | null;
	gapType: string | null;
	questionMode: string;
	botActivity: BotActivity;
	diagramHealth: DiagramHealth;
	/** True after the first successful poll completes (used to dismiss loading overlay) */
	firstPollDone: boolean;
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
		connectionStatus: "connected",
		transcript: [],
		nodes: [],
		teleprompterQuestion: null,
		questionQueue: [],
		completenessScore: null,
		sipocCoverage: null,
		gapType: null,
		questionMode: "explore",
		botActivity: DEFAULT_BOT_ACTIVITY,
		diagramHealth: DEFAULT_HEALTH,
		firstPollDone: false,
	});

	const prevNodesRef = useRef<string>("");
	const failCountRef = useRef(0);
	const stoppedRef = useRef(false);
	/** Track nodes with properties so we can warn if AI rejects them */
	const documentedNodesRef = useRef<Map<string, string>>(new Map()); // id -> label

	// Use refs for modelerApi and aiEnabled to avoid recreating the poll callback
	const modelerApiRef = useRef(modelerApi);
	const aiEnabledRef = useRef(aiEnabled);
	modelerApiRef.current = modelerApi;
	aiEnabledRef.current = aiEnabled;

	// Single stable effect — only depends on sessionId (never recreated)
	useEffect(() => {
		stoppedRef.current = false;
		failCountRef.current = 0;
		prevNodesRef.current = "";

		async function poll() {
			if (stoppedRef.current) return;

			try {
				const res = await fetch(`/api/sessions/${sessionId}/live-data`);

				if (res.status === 404) {
					stoppedRef.current = true;
					return;
				}

				if (!res.ok) {
					failCountRef.current++;
					if (failCountRef.current >= 3) {
						setData((prev) => ({ ...prev, connectionStatus: "disconnected" }));
					} else {
						setData((prev) => ({ ...prev, connectionStatus: "reconnecting" }));
					}
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
					connectionLabels: n.connectionLabels || [],
					confidence: n.confidence ?? null,
					properties: n.properties ?? null,
				}));

				// Diff nodes to avoid unnecessary mergeAiNodes calls
				const nodesKey = JSON.stringify(newNodes.map((n) => `${n.id}:${n.state}:${n.label}`));
				const nodesChanged = nodesKey !== prevNodesRef.current;

				// Check for documented nodes that disappeared (rejected by AI)
				const currentIds = new Set(newNodes.map((n) => n.id));
				for (const [id, label] of documentedNodesRef.current) {
					if (!currentIds.has(id)) {
						toast.warning(`La IA rechazó '${label}' que tiene propiedades documentadas. Puedes restaurarlo.`, {
							duration: 8000,
						});
						documentedNodesRef.current.delete(id);
					}
				}

				// Update documented nodes tracker
				for (const n of newNodes) {
					const props = n.properties as Record<string, unknown> | null;
					if (props && Object.keys(props).length > 0) {
						documentedNodesRef.current.set(n.id, n.label);
					}
				}

				const api = modelerApiRef.current;
				if (nodesChanged && api?.isReady && aiEnabledRef.current) {
					api.mergeAiNodes(newNodes);
					prevNodesRef.current = nodesKey;
				}

				setData({
					sessionStatus: json.status || "ACTIVE",
					connectionStatus: "connected",
					transcript: json.transcript || [],
					nodes: newNodes,
					teleprompterQuestion: json.teleprompterQuestion || null,
					questionQueue: json.questionQueue || [],
					completenessScore: json.completenessScore ?? null,
					sipocCoverage: json.sipocCoverage ?? null,
					gapType: json.gapType ?? null,
					questionMode: json.questionMode || "explore",
					botActivity: json.botActivity || DEFAULT_BOT_ACTIVITY,
					diagramHealth: json.diagramHealth || DEFAULT_HEALTH,
					firstPollDone: true,
				});

				if (json.status === "ENDED") {
					stoppedRef.current = true;
				}
			} catch {
				failCountRef.current++;
				if (failCountRef.current >= 3) {
					setData((prev) => ({ ...prev, connectionStatus: "disconnected" }));
				} else {
					setData((prev) => ({ ...prev, connectionStatus: "reconnecting" }));
				}
			}
		}

		// Initial poll
		poll();

		// Poll every 3 seconds with backoff on failures
		const id = setInterval(() => {
			if (stoppedRef.current) return;
			if (failCountRef.current > 0) {
				failCountRef.current--;
				return;
			}
			poll();
		}, 3000);

		return () => {
			clearInterval(id);
			stoppedRef.current = true;
		};
	}, [sessionId]);

	return data;
}
