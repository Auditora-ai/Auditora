"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatMessage, ChatResponse, GhostNode } from "@ai-interview/lib/interview-types";
import type { SipocCoverage } from "@repo/ai";

interface UseInterviewChatOptions {
	initialMessages?: ChatMessage[];
}

interface UseInterviewChatReturn {
	messages: ChatMessage[];
	completenessScore: number;
	sipocCoverage: SipocCoverage | null;
	readyForReveal: boolean;
	ghostNodes: GhostNode[];
	sending: boolean;
	error: string | null;
	sendMessage: (content: string) => Promise<void>;
}

export function useInterviewChat(
	sessionId: string,
	options?: UseInterviewChatOptions,
): UseInterviewChatReturn {
	const [messages, setMessages] = useState<ChatMessage[]>(
		options?.initialMessages || [],
	);
	const [completenessScore, setCompletenessScore] = useState(0);
	const [sipocCoverage, setSipocCoverage] = useState<SipocCoverage | null>(null);
	const [readyForReveal, setReadyForReveal] = useState(false);
	const [ghostNodes, setGhostNodes] = useState<GhostNode[]>([]);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Hydrate initial messages when they arrive after mount (e.g., from API response)
	useEffect(() => {
		if (options?.initialMessages && options.initialMessages.length > 0 && messages.length === 0) {
			setMessages(options.initialMessages);
		}
	}, [options?.initialMessages]); // eslint-disable-line react-hooks/exhaustive-deps

	const sendMessage = useCallback(async (content: string) => {
		if (!content.trim() || sending) return;

		const userMsg: ChatMessage = {
			role: "user",
			content: content.trim(),
			timestamp: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMsg]);
		setSending(true);
		setError(null);

		try {
			const res = await fetch(`/api/sessions/interview/${sessionId}/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: content.trim() }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Error sending message");
				if (data.readyForReveal) setReadyForReveal(true);
				return;
			}

			const response = data as ChatResponse;

			const aiMsg: ChatMessage = {
				role: "assistant",
				content: response.question,
				timestamp: new Date().toISOString(),
				metadata: {
					gapType: response.gapType,
					completenessScore: response.completenessScore,
					sipocCoverage: response.sipocCoverage,
					reasoning: response.reasoning,
				},
			};

			setMessages((prev) => [...prev, aiMsg]);
			setCompletenessScore(response.completenessScore);
			setSipocCoverage(response.sipocCoverage);
			setReadyForReveal(response.readyForReveal);

			if (response.ghostNodes && response.ghostNodes.length > 0) {
				setGhostNodes((prev) => [...prev, ...response.ghostNodes!]);
			}
		} catch {
			setError("Error de conexión. Intenta de nuevo.");
		} finally {
			setSending(false);
		}
	}, [sessionId, sending]);

	return {
		messages,
		completenessScore,
		sipocCoverage,
		readyForReveal,
		ghostNodes,
		sending,
		error,
		sendMessage,
	};
}
