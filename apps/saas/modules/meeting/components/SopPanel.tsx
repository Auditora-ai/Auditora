"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
	SparklesIcon,
	RefreshCwIcon,
	ClipboardListIcon,
	Loader2Icon,
	SendIcon,
} from "lucide-react";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import type { ProcedureResult } from "@repo/ai";

interface SopPanelProps {
	collapsed: boolean;
}

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	updatedFields?: string[];
}

// Per-node cache so chat history survives tab switches
interface NodeCache {
	messages: ChatMessage[];
	procedure: ProcedureResult | null;
	completeness: number;
	activeTab: "chat" | "preview";
}

export function SopPanel({ collapsed }: SopPanelProps) {
	const t = useTranslations("meeting");
	const { sessionId, selectedNodeId, nodes } = useLiveSessionContext();
	const cacheRef = useRef<Map<string, NodeCache>>(new Map());

	// Get or create cache entry for current node
	const getCache = (nodeId: string): NodeCache => {
		if (!cacheRef.current.has(nodeId)) {
			cacheRef.current.set(nodeId, { messages: [], procedure: null, completeness: 0, activeTab: "chat" });
		}
		return cacheRef.current.get(nodeId)!;
	};

	const cached = selectedNodeId ? getCache(selectedNodeId) : null;

	const [messages, setMessages] = useState<ChatMessage[]>(cached?.messages || []);
	const [procedure, setProcedure] = useState<ProcedureResult | null>(cached?.procedure || null);
	const [completeness, setCompleteness] = useState(cached?.completeness || 0);
	const [activeTab, setActiveTab] = useState<"chat" | "preview">(cached?.activeTab || "chat");
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const prevNodeRef = useRef<string | null>(null);

	const node = nodes.find((n) => n.id === selectedNodeId);

	// Save to cache whenever state changes
	useEffect(() => {
		if (!selectedNodeId) return;
		cacheRef.current.set(selectedNodeId, { messages, procedure, completeness, activeTab });
	}, [selectedNodeId, messages, procedure, completeness, activeTab]);

	// Restore from cache on node change + fetch procedure if needed
	useEffect(() => {
		if (!selectedNodeId || selectedNodeId === prevNodeRef.current) return;
		prevNodeRef.current = selectedNodeId;
		const nodeId = selectedNodeId;
		const existing = getCache(nodeId);

		// Restore cached state
		setMessages(existing.messages);
		setProcedure(existing.procedure);
		setCompleteness(existing.completeness);
		setActiveTab(existing.activeTab);
		setInput("");
		setError(null);

		// Fetch procedure from DB if we don't have it cached
		if (!existing.procedure) {
			fetch(`/api/sessions/${sessionId}/nodes/${nodeId}/procedure`)
				.then((r) => r.json())
				.then((data) => {
					if (data.procedure) {
						setProcedure(data.procedure as ProcedureResult);
						setCompleteness(data.procedure.overallConfidence || 0);
					}
				})
				.catch(() => {});
		}
	}, [selectedNodeId, sessionId]);

	// Auto-scroll chat
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages, loading]);

	const sendMessage = useCallback(async (text: string) => {
		if (!selectedNodeId || loading) return;

		setMessages((prev) => [...prev, { role: "user", content: text }]);
		setInput("");
		setLoading(true);
		setError(null);

		try {
			const res = await fetch(`/api/sessions/${sessionId}/nodes/${selectedNodeId}/procedure-chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: text,
					history: messages.slice(-10),
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Error");
			}

			const data = await res.json();

			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: data.message,
					updatedFields: data.updatedFields,
				},
			]);

			if (data.completeness) setCompleteness(data.completeness);

			// Refresh procedure if fields were updated
			if (data.updatedFields?.length > 0) {
				const procRes = await fetch(`/api/sessions/${sessionId}/nodes/${selectedNodeId}/procedure`);
				const procData = await procRes.json();
				if (procData.procedure) setProcedure(procData.procedure as ProcedureResult);
			}
		} catch (err: any) {
			setError(err.message);
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: t("sopPanel.errorMessage") },
			]);
		} finally {
			setLoading(false);
			inputRef.current?.focus();
		}
	}, [selectedNodeId, sessionId, messages, loading]);

	const handleSubmit = useCallback(() => {
		const text = input.trim();
		if (!text) return;
		sendMessage(text);
	}, [input, sendMessage]);

	const handleNewConversation = useCallback(() => {
		setMessages([]);
		setError(null);
		if (selectedNodeId) {
			cacheRef.current.set(selectedNodeId, { messages: [], procedure, completeness, activeTab });
		}
	}, [selectedNodeId, procedure, completeness, activeTab]);

	const handleGenerateFull = useCallback(async () => {
		if (!selectedNodeId) return;
		setGenerating(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/nodes/${selectedNodeId}/procedure`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			if (data.procedure) {
				setProcedure(data.procedure as ProcedureResult);
				setCompleteness(data.procedure.overallConfidence || 0);
				setActiveTab("preview");
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setGenerating(false);
		}
	}, [selectedNodeId, sessionId]);

	if (collapsed) return <div style={{ gridArea: "right" }} />;

	if (!selectedNodeId || !node) {
		return (
			<div
				className="flex flex-col items-center justify-center overflow-hidden border-l border-chrome-border bg-chrome-base"
				style={{ gridArea: "right" }}
			>
				<ClipboardListIcon className="mb-2 h-6 w-6 text-chrome-subtle" />
				<p className="px-4 text-center text-xs text-chrome-text-muted">
					{t("sopPanel.selectTask")}
				</p>
			</div>
		);
	}

	return (
		<div
			className="flex flex-col overflow-hidden border-l border-chrome-border bg-chrome-base"
			style={{ gridArea: "right" }}
		>
			{/* Header */}
			<div className="shrink-0 border-b border-chrome-border px-3 py-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ClipboardListIcon className="h-3.5 w-3.5 text-primary" />
						<span className="text-xs font-medium text-chrome-text">{t("sopPanel.headerSop")}</span>
					</div>
					<div className="flex items-center gap-2">
						{completeness > 0 && (
							<span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
								completeness >= 0.7 ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
							}`}>
								{Math.round(completeness * 100)}%
							</span>
						)}
						{messages.length > 0 && (
							<button
								type="button"
								onClick={handleNewConversation}
								className="rounded p-0.5 text-chrome-subtle transition-colors hover:bg-chrome-raised hover:text-chrome-text-secondary"
								title={t("sopPanel.newConversation")}
							>
								<RefreshCwIcon className="h-3.5 w-3.5" />
							</button>
						)}
					</div>
				</div>
				<p className="mt-0.5 truncate text-[10px] text-chrome-text-muted">{node.label}</p>
			</div>

			{/* Chat content */}
			<>
					{/* Chat messages */}
					<div ref={scrollRef} className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-3">
						{messages.length === 0 && !loading && (
							<div className="flex items-start gap-2 rounded-lg bg-chrome-raised p-3">
								<SparklesIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
								<p className="text-[11px] leading-relaxed text-chrome-text-secondary">
									{t("sopPanel.aiIntro")}
								</p>
							</div>
						)}

						{messages.map((msg, i) => (
							<div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
								<div className={`max-w-[85%] rounded-lg px-3 py-2 ${
									msg.role === "user"
										? "bg-primary text-white"
										: "bg-chrome-raised text-chrome-text-secondary"
								}`}>
									<p className="text-[11px] leading-relaxed">{msg.content}</p>
									{msg.updatedFields && msg.updatedFields.length > 0 && (
										<div className="mt-1.5 flex flex-wrap gap-1">
											{msg.updatedFields.map((f) => (
												<span key={f} className="rounded bg-green-500/20 px-1.5 py-0.5 text-[9px] text-green-400">
													✓ {f}
												</span>
											))}
										</div>
									)}
								</div>
							</div>
						))}

						{loading && (
							<div className="flex justify-start">
								<div className="flex items-center gap-2 rounded-lg bg-chrome-raised px-3 py-2">
									<Loader2Icon className="h-3.5 w-3.5 animate-spin text-primary" />
									<span className="text-[11px] text-chrome-text-muted">{t("sopPanel.thinking")}</span>
								</div>
							</div>
						)}
					</div>

					{/* Chat input */}
					<div className="shrink-0 border-t border-chrome-border p-2">
						{/* Quick action */}
						{messages.length > 2 && !procedure && (
							<button
								type="button"
								onClick={handleGenerateFull}
								disabled={generating}
								className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-1.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
							>
								{generating ? (
									<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
								) : (
									<SparklesIcon className="h-3.5 w-3.5" />
								)}
								{generating ? t("sopPanel.generatingFull") : t("sopPanel.generateFull")}
							</button>
						)}

						<div className="flex gap-1.5">
							<input
								ref={inputRef}
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSubmit();
									}
								}}
								placeholder={t("sopPanel.inputPlaceholder")}
								disabled={loading}
								className="flex-1 rounded-lg bg-chrome-raised px-3 py-2 text-xs text-white placeholder-chrome-subtle outline-none ring-1 ring-chrome-border transition-colors focus:ring-primary"
							/>
							<button
								type="button"
								onClick={handleSubmit}
								disabled={!input.trim() || loading}
								className="rounded-lg bg-primary px-2.5 py-2 text-white transition-colors hover:bg-action-hover disabled:opacity-40"
							>
								<SendIcon className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				</>
		</div>
	);
}

