"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { Button } from "@repo/ui/components/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRightIcon, CheckIcon, MicIcon, MicOffIcon, SendIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { BpmnViewerPanel } from "./BpmnViewerPanel";

// Web Speech API — use any for cross-browser compat
type SpeechRecognitionInstance = {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	maxAlternatives: number;
	onresult: ((event: { resultIndex: number; results: { length: number; [key: number]: { isFinal: boolean; [key: number]: { transcript: string } } } }) => void) | null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
	start: () => void;
	stop: () => void;
};

gsap.registerPlugin(ScrollTrigger);

interface ExtractedProcess {
	name: string;
	description: string;
	category: string;
}

type VoiceState = "idle" | "listening" | "unsupported";

export function TryItSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
	const [processes, setProcesses] = useState<ExtractedProcess[]>([]);
	const [bpmnXml, setBpmnXml] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [requiresSignup, setRequiresSignup] = useState(false);
	const [messagesRemaining, setMessagesRemaining] = useState(3);
	const [voiceState, setVoiceState] = useState<VoiceState>("idle");
	const [interimText, setInterimText] = useState("");
	const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

	// Check Web Speech API support
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) {
			setVoiceState("unsupported");
		}
	}, []);

	useGSAP(
		() => {
			if (!sectionRef.current) return;
			gsap.from(sectionRef.current.querySelectorAll(".tryit-reveal"), {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});
		},
		{ scope: sectionRef },
	);

	const handleSubmit = useCallback(async (textOverride?: string) => {
		const text = textOverride || input.trim();
		if (!text || text.length < 10 || isLoading || requiresSignup) return;

		const newMessages = [...messages, { role: "user", content: text }];
		setMessages(newMessages);
		setInput("");
		setInterimText("");
		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch(`${config.saasUrl}/api/public/try-extraction`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: newMessages }),
			});

			if (res.status === 429) {
				setError(t("home.tryIt.rateLimited"));
				return;
			}

			const data = await res.json();

			if (data.requiresSignup) {
				setRequiresSignup(true);
				return;
			}

			if (data.error) {
				setError(data.error);
				return;
			}

			if (data.processes?.length > 0) {
				setProcesses((prev) => [...prev, ...data.processes]);
			}

			if (data.bpmnXml) {
				setBpmnXml(data.bpmnXml);
			}

			if (data.response) {
				setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
			}

			if (data.messagesRemaining !== undefined) {
				setMessagesRemaining(data.messagesRemaining);
			}
		} catch {
			setError(t("home.tryIt.error"));
		} finally {
			setIsLoading(false);
		}
	}, [input, messages, isLoading, requiresSignup, t]);

	const toggleVoice = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) return;

		if (voiceState === "listening" && recognitionRef.current) {
			recognitionRef.current.stop();
			setVoiceState("idle");
			return;
		}

		const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
		recognition.continuous = false;
		recognition.interimResults = true;
		recognition.lang = navigator.language || "es";
		recognition.maxAlternatives = 1;

		recognition.onresult = (event) => {
			let finalTranscript = "";
			let interimTranscript = "";

			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcript = event.results[i][0].transcript;
				if (event.results[i].isFinal) {
					finalTranscript += transcript;
				} else {
					interimTranscript += transcript;
				}
			}

			if (finalTranscript) {
				setInput(finalTranscript);
				setInterimText("");
				setVoiceState("idle");
				// Auto-submit after voice capture
				handleSubmit(finalTranscript);
			} else {
				setInterimText(interimTranscript);
			}
		};

		recognition.onend = () => {
			setVoiceState("idle");
			recognitionRef.current = null;
		};

		recognition.onerror = () => {
			setVoiceState("idle");
			recognitionRef.current = null;
		};

		// Auto-stop after 30 seconds
		setTimeout(() => {
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		}, 30000);

		recognitionRef.current = recognition;
		recognition.start();
		setVoiceState("listening");
	}, [voiceState, handleSubmit]);

	return (
		<section ref={sectionRef} id="try-it" className="py-20 lg:py-28 bg-[#0F172A]">
			<div className="container max-w-6xl">
				<div className="text-center mb-12">
					<small className="tryit-reveal font-medium text-xs uppercase tracking-wider text-primary mb-4 block">
						{t("home.tryIt.badge")}
					</small>
					<h2 className="tryit-reveal font-display text-3xl lg:text-4xl xl:text-5xl text-[#F1F5F9]">
						{t("home.tryIt.title")}
					</h2>
					<p className="tryit-reveal mt-4 text-base lg:text-lg text-[#94A3B8] text-balance max-w-2xl mx-auto">
						{t("home.tryIt.description")}
					</p>
				</div>

				<div className="tryit-reveal grid grid-cols-1 lg:grid-cols-5 gap-6">
					{/* Left panel: Chat + extraction cards (2 cols) */}
					<div className="lg:col-span-2 bg-[#1E293B] rounded-2xl border border-[#334155] p-6 flex flex-col">
						{/* Messages */}
						<div className="flex-1 min-h-[200px] max-h-[350px] overflow-y-auto space-y-3 mb-4">
							{messages.length === 0 && (
								<div className="text-[#64748B] text-sm text-center py-8">
									<SparklesIcon className="size-5 mx-auto mb-2 text-primary" />
									{t("home.tryIt.description")}
								</div>
							)}
							{messages.map((msg, i) => (
								<div
									key={`msg-${i}`}
									className={`text-sm rounded-xl px-4 py-2.5 max-w-[90%] ${
										msg.role === "user"
											? "bg-primary/20 text-[#F1F5F9] ml-auto"
											: "bg-[#334155] text-[#94A3B8]"
									}`}
								>
									{msg.content}
								</div>
							))}
							{isLoading && (
								<div className="bg-[#334155] text-[#94A3B8] text-sm rounded-xl px-4 py-2.5 max-w-[85%] animate-pulse">
									{t("home.tryIt.analyzing")}
								</div>
							)}
						</div>

						{/* Extraction cards */}
						{processes.length > 0 && (
							<div className="mb-4 space-y-2">
								<p className="text-xs text-[#64748B] uppercase tracking-wider">
									{t("home.tryIt.extractedTitle")}
								</p>
								{processes.map((p, i) => (
									<div key={`p-${i}`} className="flex items-center gap-2 bg-[#0F172A] rounded-lg px-3 py-2 border border-primary/20">
										<CheckIcon className="size-3.5 text-green-400 flex-shrink-0" />
										<span className="text-sm text-[#F1F5F9] flex-1 truncate">{p.name}</span>
										<span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.category}</span>
									</div>
								))}
							</div>
						)}

						{/* Input with voice */}
						{requiresSignup ? (
							<div className="text-center py-4">
								<p className="text-[#94A3B8] text-sm mb-3">{t("home.tryIt.signupCta")}</p>
								<Button size="sm" variant="primary" asChild>
									<a href={config.saasUrl}>
										{t("home.tryIt.signupButton")}
										<ArrowRightIcon className="ml-2 size-3" />
									</a>
								</Button>
							</div>
						) : (
							<div className="flex gap-2">
								{/* Voice button */}
								{voiceState !== "unsupported" && (
									<button
										type="button"
										onClick={toggleVoice}
										className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors flex-shrink-0 ${
											voiceState === "listening"
												? "bg-red-500 text-white animate-pulse"
												: "bg-[#334155] text-[#94A3B8] hover:text-[#F1F5F9]"
										}`}
										title={voiceState === "listening" ? t("home.tryIt.voiceListening") : t("home.tryIt.voiceButton")}
									>
										{voiceState === "listening" ? (
											<MicOffIcon className="size-4" />
										) : (
											<MicIcon className="size-4" />
										)}
									</button>
								)}

								<input
									type="text"
									value={interimText || input}
									onChange={(e) => { setInput(e.target.value); setInterimText(""); }}
									onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
									placeholder={t("home.tryIt.placeholder")}
									className={`flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-primary ${
										interimText ? "italic text-[#64748B]" : ""
									}`}
									disabled={isLoading || voiceState === "listening"}
									maxLength={500}
								/>

								<button
									type="button"
									onClick={() => handleSubmit()}
									disabled={isLoading || (input.length < 10 && !interimText)}
									className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors flex-shrink-0"
								>
									<SendIcon className="size-4" />
								</button>
							</div>
						)}

						{error && <p className="text-red-400 text-xs mt-2">{error}</p>}

						{!requiresSignup && messagesRemaining > 0 && messages.length > 0 && (
							<p className="text-[#64748B] text-xs mt-2 text-center">
								{t("home.tryIt.messagesRemaining", { count: messagesRemaining })}
							</p>
						)}
					</div>

					{/* Right panel: BPMN Diagram Viewer (3 cols) */}
					<div className="lg:col-span-3 rounded-2xl border border-[#334155] overflow-hidden">
						<BpmnViewerPanel bpmnXml={bpmnXml} />
					</div>
				</div>
			</div>
		</section>
	);
}
