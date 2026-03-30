"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { SipocResult } from "@repo/ai";
import type { IndustryInferenceResult } from "@radiografia/lib/industry-inference";
import type { DiagramNode } from "@radiografia/lib/sipoc-to-nodes";
import type { RiskData } from "@radiografia/lib/types";
import { ScanHeader } from "./ScanHeader";
import { InputPhase } from "./InputPhase";
import { TheatricalCrawlingLoader } from "./TheatricalCrawlingLoader";
import { InvestigationBoard } from "./InvestigationBoard";
import { InstantReport } from "./InstantReport";
import { DeepConversation } from "./DeepConversation";
import { DiagramReveal } from "./DiagramReveal";
import { DeepRiskReport } from "./DeepRiskReport";
import { ConversionGate } from "./ConversionGate";
import { RevealLoader } from "./RevealLoader";

type Phase = "input" | "crawling" | "researching" | "streaming" | "instant" | "deepen" | "sipoc" | "reveal" | "risks" | "convert";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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

	// Track user input URL for theatrical loader
	const [inputUrl, setInputUrl] = useState<string>("");
	const crawlStartTime = useRef<number>(0);

	// Auto-start from URL parameter (hero → /scan?url=X handoff)
	const searchParams = useSearchParams();
	const autoStarted = useRef(false);

	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const turnstileRef = useRef<TurnstileInstance | null>(null);

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
			crawlStartTime.current = Date.now();
			if (input.type === "url") setInputUrl(input.url);

			const MIN_LOADER_TIME = 3000;

			// Helper: ensure theatrical loader shows for at least 3s before any phase transition
			const delayedTransition = (callback: () => void) => {
				const elapsed = Date.now() - crawlStartTime.current;
				if (elapsed < MIN_LOADER_TIME) {
					setTimeout(callback, MIN_LOADER_TIME - elapsed);
				} else {
					callback();
				}
			};

			// Create anonymous session (with Turnstile token)
			const sessionOk = await createSession(captchaToken);
			if (!sessionOk) {
				delayedTransition(() => {
					setStatusMessage(t("errorCreatingSession"));
					setPhase("input");
					setLoading(false);
				});
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
					delayedTransition(() => {
						setStatusMessage(t("couldNotReadWebsite"));
						setPhase("input");
						setLoading(false);
					});
					return;
				}
				delayedTransition(() => {
					setStatusMessage(t("errorProcessing"));
					setPhase("input");
					setLoading(false);
				});
				return;
			}

			delayedTransition(() => {
				setPhase("researching");
				setStatusMessage("Investigando tu industria...");
			});
		},
		[createSession, t],
	);

	useEffect(() => {
		const urlParam = searchParams.get("url");
		if (!urlParam || autoStarted.current) return;

		// If Turnstile is configured but token isn't ready yet, wait
		if (TURNSTILE_SITE_KEY && !turnstileToken) return;

		autoStarted.current = true;
		try {
			const decoded = decodeURIComponent(urlParam);
			// Normalize: strip duplicate protocols, ensure single https://
			let normalized = decoded.trim().replace(/^(https?:\/\/)+/i, "");
			normalized = normalized.replace(/^[.\s/]+|[.\s/]+$/g, "");
			if (normalized.length > 3) {
				const finalUrl = `https://${normalized}`;
				const token = turnstileToken === "__skip__" ? undefined : turnstileToken || undefined;
				handleInput({ type: "url", url: finalUrl }, token);
			}
		} catch {
			// Malformed URL param — fall through to InputPhase
		}
	}, [searchParams, handleInput, turnstileToken]);

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
			setStatusMessage(t("connectionError"));
			// Stay on instant phase with error status instead of losing all progress
			setPhase("instant");
			setLoading(false);
		}
	}, [t]);

	const router = useRouter();

	async function handleDeepen() {
		// Gate: guided conversation requires authentication
		try {
			const res = await fetch("/api/auth/get-session");
			const session = await res.json();
			if (!session?.user) {
				// Redirect to signup, preserving scan context via URL
				const returnUrl = encodeURIComponent(`/scan?deepen=true`);
				router.push(`/login?redirect=${returnUrl}`);
				return;
			}
		} catch {
			// If auth check fails, allow through (fail-open for UX)
		}
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

	// Hidden Turnstile widget for auto-start flow (hero → /scan?url=X)
	// Renders when URL param exists so the token is ready before handleInput fires
	const hiddenTurnstile = TURNSTILE_SITE_KEY && searchParams.get("url") && !turnstileToken ? (
		<div className="fixed -left-[9999px]" aria-hidden>
			<Turnstile
				ref={turnstileRef}
				siteKey={TURNSTILE_SITE_KEY}
				onSuccess={(token) => setTurnstileToken(token)}
				onError={() => {
					// Turnstile failed (e.g. localhost) — proceed without token
					setTurnstileToken("__skip__");
				}}
				onExpire={() => {
					setTurnstileToken(null);
					turnstileRef.current?.reset();
				}}
				options={{ size: "invisible", theme: "auto" }}
			/>
		</div>
	) : null;

	// Phase-to-progress mapping for journey indicator
	const PHASE_PROGRESS: Record<Phase, number> = {
		input: 0, crawling: 10, researching: 25, streaming: 45,
		instant: 60, deepen: 65, sipoc: 70, reveal: 85, risks: 95, convert: 100,
	};

	// Wrapper with header for all phases
	const withHeader = (content: React.ReactNode) => (
		<>
			<ScanHeader progress={PHASE_PROGRESS[phase]} />
			<div className="pt-12">{content}</div>
		</>
	);

	// Render based on phase
	if (phase === "input") {
		const initialMode = searchParams.get("mode") === "text" ? "text" : "url";
		return (
			<>
				{hiddenTurnstile}
				{withHeader(<InputPhase onSubmit={handleInput} loading={false} initialMode={initialMode} />)}
			</>
		);
	}

	if (phase === "crawling") {
		return <TheatricalCrawlingLoader url={inputUrl || undefined} />;
	}

	if (phase === "researching") {
		return (
			<>
				{/* Fade-from-dark overlay for smooth transition from theatrical loader */}
				<div
					className="pointer-events-none fixed inset-0 z-50 animate-fade-from-dark"
					style={{ backgroundColor: "#0A1428" }}
				/>
				{withHeader(
					<div className="relative min-h-screen bg-background px-4 py-12">
						{/* Gradient bridge: dark→transparent dissolve from top */}
						<div
							className="pointer-events-none absolute inset-x-0 top-0 h-[200px]"
							style={{ background: "linear-gradient(to bottom, #0A1428, transparent)" }}
						/>
						{/* Ambient teal glow for depth */}
						<div
							className="pointer-events-none absolute inset-0"
							style={{ background: "radial-gradient(ellipse at top right, rgba(0,229,192,0.04), transparent 60%)" }}
						/>
						<div className="relative">
							<InvestigationBoard
								companyName={crawledCompanyName || "tu empresa"}
								industry={industry?.industry || "Analizando..."}
								sessionToken=""
								onComplete={() => handleResearchComplete()}
							/>
						</div>
					</div>,
				)}
			</>
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
			return <RevealLoader />;
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
