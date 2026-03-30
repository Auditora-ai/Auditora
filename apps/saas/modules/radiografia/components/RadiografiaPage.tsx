"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { SipocResult } from "@repo/ai";
import type { IndustryInferenceResult } from "@radiografia/lib/industry-inference";
import type { DiagramNode } from "@radiografia/lib/sipoc-to-nodes";
import type { RiskData } from "@radiografia/lib/types";
import { ScanHeader } from "./ScanHeader";
import { InputPhase } from "./InputPhase";
import { InvestigationBoard } from "./InvestigationBoard";
import { InstantReport } from "./InstantReport";
import { DeepConversation } from "./DeepConversation";
import { DiagramReveal } from "./DiagramReveal";
import { DeepRiskReport } from "./DeepRiskReport";
import { ConversionGate } from "./ConversionGate";

type Phase = "input" | "crawling" | "researching" | "streaming" | "instant" | "deepen" | "sipoc" | "reveal" | "risks" | "convert";

export function RadiografiaPage() {
	const t = useTranslations("scan");
	const [phase, setPhase] = useState<Phase>("input");
	const [loading, setLoading] = useState(false);
	const [statusMessage, setStatusMessage] = useState("");

	// Data accumulated during the pipeline
	const [crawledCompanyName, setCrawledCompanyName] = useState<string>("");
	const [industry, setIndustry] = useState<IndustryInferenceResult | null>(null);
	const [sipoc, setSipoc] = useState<SipocResult | null>(null);
	const [nodes, setNodes] = useState<DiagramNode[] | null>(null);
	const [risks, setRisks] = useState<RiskData | null>(null);

	// Deep phase data
	const [deepSipoc, setDeepSipoc] = useState<SipocResult | null>(null);
	const [deepNodes, setDeepNodes] = useState<DiagramNode[] | null>(null);
	const [deepRisks, setDeepRisks] = useState<RiskData | null>(null);
	const [bpmnXml, setBpmnXml] = useState<string | null>(null);

	// Auto-start from URL parameter (hero → /scan?url=X handoff)
	const searchParams = useSearchParams();
	const autoStarted = useRef(false);

	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

	const createSession = useCallback(async (captchaToken?: string): Promise<boolean> => {
		try {
			const res = await fetch("/api/public/scan/session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ turnstileToken: captchaToken || turnstileToken }),
			});
			return res.ok;
		} catch {
			return false;
		}
	}, [turnstileToken]);

	const handleInput = useCallback(
		async (input: { type: "url"; url: string } | { type: "text"; description: string }, captchaToken?: string) => {
			setLoading(true);
			setPhase("crawling");

			// Create anonymous session (with Turnstile token)
			const sessionOk = await createSession(captchaToken);
			if (!sessionOk) {
				setStatusMessage(t("errorCreatingSession"));
				setPhase("input");
				setLoading(false);
				return;
			}

			// Crawl or set description
			const crawlBody =
				input.type === "url"
					? { url: input.url }
					: { description: input.description };

			const crawlRes = await fetch("/api/public/scan/crawl", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(crawlBody),
			});

			const crawlData = await crawlRes.json();

			// Extract company name from URL or crawl data
			if (input.type === "url") {
				try {
					const hostname = new URL(input.url).hostname.replace("www.", "");
					setCrawledCompanyName(hostname);
				} catch { /* ignore */ }
			} else {
				setCrawledCompanyName(input.description.slice(0, 50));
			}

			if (!crawlData.success) {
				// If URL crawl failed, suggest manual fallback
				if (input.type === "url") {
					setStatusMessage(t("couldNotReadWebsite"));
					setPhase("input");
					setLoading(false);
					return;
				}
				setStatusMessage(t("errorProcessing"));
				setPhase("input");
				setLoading(false);
				return;
			}

			// Start the research phase (enriched context)
			// The InvestigationBoard component handles the research SSE stream.
			// When research completes (or is skipped), it calls handleResearchComplete()
			// which triggers the instant radiografia pipeline.
			setPhase("researching");
			setStatusMessage("Investigando tu industria...")
		},
		[createSession],
	);

	useEffect(() => {
		const urlParam = searchParams.get("url");
		if (urlParam && !autoStarted.current) {
			autoStarted.current = true;
			try {
				const decoded = decodeURIComponent(urlParam);
				if (decoded.length > 3) {
					handleInput({ type: "url", url: decoded });
				}
			} catch {
				// Malformed URL param — fall through to InputPhase
			}
		}
	}, [searchParams, handleInput]);

	function handleSSEEvent(event: { phase: string; data: unknown; message: string }) {
		setStatusMessage(event.message);

		switch (event.phase) {
			case "industry":
				if (event.data) setIndustry(event.data as IndustryInferenceResult);
				break;
			case "sipoc":
				if (event.data) setSipoc(event.data as SipocResult);
				break;
			case "diagram":
				if (event.data) {
					const d = event.data as { nodes: DiagramNode[] };
					setNodes(d.nodes);
				}
				break;
			case "risks":
				if (event.data) setRisks(event.data as RiskData);
				break;
			case "complete":
				setPhase("instant");
				setLoading(false);
				break;
			case "error":
				setStatusMessage(event.message);
				setPhase("instant");
				setLoading(false);
				break;
		}
	}

	// Called when InvestigationBoard finishes (or is skipped/errors)
	const handleResearchComplete = useCallback(async () => {
		setPhase("streaming");
		setStatusMessage(t("analyzingIndustry"));

		try {
			const res = await fetch("/api/public/scan/instant", {
				method: "POST",
			});

			if (!res.ok || !res.body) {
				setStatusMessage(t("errorGenerating"));
				setPhase("input");
				setLoading(false);
				return;
			}

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					try {
						const event = JSON.parse(line.slice(6));
						handleSSEEvent(event);
					} catch {
						// Skip malformed events
					}
				}
			}
		} catch (error) {
			console.error("SSE error:", error);
			setStatusMessage("Error de conexion. Intenta de nuevo.");
			setPhase("input");
			setLoading(false);
		}
	}, []);

	function handleDeepen() {
		setPhase("sipoc");
	}

	async function handleRevealReady() {
		setPhase("reveal");
		setLoading(true);

		try {
			// Generate deep risk report + enriched SIPOC + diagram
			const res = await fetch("/api/public/scan/risks", {
				method: "POST",
			});

			if (!res.ok) {
				setStatusMessage(t("errorGenerating"));
				setLoading(false);
				return;
			}

			const data = await res.json();
			setDeepSipoc(data.sipoc);
			setDeepNodes(data.nodes);
			setDeepRisks(data.risks);

			// Build BPMN XML from nodes
			try {
				const { buildBpmnXml } = await import("@meeting/lib/bpmn-builder");
				const xml = await buildBpmnXml(data.nodes);
				setBpmnXml(xml);
			} catch {
				// Diagram generation is optional — continue without it
			}

			setLoading(false);
		} catch {
			setStatusMessage(t("connectionError"));
			setLoading(false);
		}
	}

	function handleDiagramRevealed() {
		setPhase("risks");
	}

	function handleConvert() {
		setPhase("convert");
	}

	// Wrapper with header for all phases
	const withHeader = (content: React.ReactNode) => (
		<>
			<ScanHeader />
			<div className="pt-12">{content}</div>
		</>
	);

	// Render based on phase
	if (phase === "input") {
		return withHeader(<InputPhase onSubmit={handleInput} loading={false} />);
	}

	if (phase === "crawling") {
		return withHeader(
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="text-center">
					<div className="mb-4 mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#D97706] border-t-transparent" />
					<p className="text-sm text-muted-foreground">{t("readingWebsite")}</p>
				</div>
			</div>,
		);
	}

	if (phase === "researching") {
		return withHeader(
			<div className="min-h-screen bg-[#FFFBF5] px-4 py-12">
				<InvestigationBoard
					companyName={crawledCompanyName || "tu empresa"}
					industry={industry?.industry || "Analizando..."}
					sessionToken=""
					onComplete={() => handleResearchComplete()}
				/>
			</div>,
		);
	}

	if (phase === "streaming" || phase === "instant") {
		return withHeader(
			<InstantReport
				industry={industry}
				sipoc={sipoc}
				nodes={nodes}
				risks={risks}
				status={phase === "streaming" ? "streaming" : risks ? "complete" : "error"}
				statusMessage={statusMessage}
				onDeepen={handleDeepen}
			/>,
		);
	}

	if (phase === "sipoc") {
		return withHeader(
			<DeepConversation
				processName={industry?.selectedProcess.name || "Process"}
				industry={industry?.industry || ""}
				onRevealReady={handleRevealReady}
			/>,
		);
	}

	if (phase === "reveal") {
		if (loading || !bpmnXml) {
			return withHeader(
				<div className="flex min-h-screen items-center justify-center bg-background">
					<div className="text-center">
						<div className="mb-4 mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#D97706] border-t-transparent" />
						<p className="text-sm text-muted-foreground">{t("generatingDeepScan")}</p>
					</div>
				</div>,
			);
		}

		return withHeader(
			<div className="min-h-screen bg-background px-4 py-12">
				<div className="mx-auto max-w-4xl">
					<h2 className="mb-6 text-center text-3xl font-display text-foreground">
						{t("yourProcessMap")}
					</h2>
					<DiagramReveal bpmnXml={bpmnXml} onRevealed={handleDiagramRevealed} />
				</div>
			</div>,
		);
	}

	if (phase === "risks" && deepRisks && (deepSipoc || sipoc)) {
		return withHeader(
			<DeepRiskReport
				processName={industry?.selectedProcess.name || "Process"}
				industry={industry?.industry || ""}
				sipoc={deepSipoc || sipoc!}
				risks={deepRisks}
				instantRisksCount={risks?.newRisks.length || 0}
				onConvert={handleConvert}
			/>,
		);
	}

	if (phase === "convert") {
		const totalRisks = deepRisks?.newRisks.length || risks?.newRisks.length || 0;
		return withHeader(
			<ConversionGate
				processName={industry?.selectedProcess.name || "Process"}
				risksCount={totalRisks}
			/>,
		);
	}

	return null;
}
