"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckIcon, DownloadIcon, LinkIcon, MicIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

export function ProductDemoSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const [activeScene, setActiveScene] = useState(0);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			const scenes = sectionRef.current.querySelectorAll(".demo-scene");

			scenes.forEach((scene, i) => {
				ScrollTrigger.create({
					trigger: scene,
					start: "top 60%",
					end: "bottom 40%",
					onEnter: () => {
						setActiveScene(i);
						const els = scene.querySelectorAll(".scene-animate");
						gsap.fromTo(
							els,
							{ opacity: 0, y: 20 },
							{ opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" },
						);
					},
				});
			});
		},
		{ scope: sectionRef },
	);

	const captionKeys = ["discover", "organize", "deepDive", "deliver"] as const;

	return (
		<section ref={sectionRef} id="demo" className="py-20 lg:py-28">
			<div className="container">
				{/* Scene navigation tabs */}
				<div className="flex justify-center gap-2 mb-12 flex-wrap">
					{captionKeys.map((key, i) => (
						<button
							type="button"
							key={key}
							className={`demo-tab px-4 py-2 rounded-full text-sm font-medium transition-colors ${
								activeScene === i
									? "bg-primary text-white"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							}`}
							onClick={() => {
								setActiveScene(i);
								const scene = sectionRef.current?.querySelectorAll(".demo-scene")[i];
								scene?.scrollIntoView({ behavior: "smooth", block: "center" });
							}}
						>
							{t(`home.demo.caption.${key}`)}
						</button>
					))}
				</div>

				<div className="space-y-24">
					{/* Scene 1: Discover */}
					<div className="demo-scene">
						<div className="max-w-4xl mx-auto">
							<h3 className="text-center text-2xl md:text-3xl font-display text-foreground mb-8">
								{t("home.demo.scene1.title")}
							</h3>
							<div className="bg-[#0F172A] rounded-2xl border border-[#334155] overflow-hidden">
								<div className="flex items-center gap-2 px-4 py-3 border-b border-[#334155]">
									<div className="flex gap-1.5">
										<div className="w-3 h-3 rounded-full bg-red-500/60" />
										<div className="w-3 h-3 rounded-full bg-yellow-500/60" />
										<div className="w-3 h-3 rounded-full bg-green-500/60" />
									</div>
									<span className="text-[#64748B] text-xs ml-2">{t("home.demo.windowTitle")}</span>
								</div>
								<div className="p-6 space-y-4">
									<div className="scene-animate flex gap-3">
										<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
											<span className="text-xs text-primary font-medium">You</span>
										</div>
										<div className="bg-[#1E293B] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] max-w-[80%]">
											{t("home.demo.scene1.chatMessage1")}
										</div>
									</div>
									<div className="scene-animate flex gap-3">
										<div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
											<span className="text-xs text-primary font-medium">AI</span>
										</div>
										<div className="bg-[#334155] rounded-xl px-4 py-3 text-sm text-[#94A3B8] max-w-[80%]">
											{t("home.demo.scene1.chatMessage2")}
										</div>
									</div>
									<div className="scene-animate flex gap-3">
										<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
											<span className="text-xs text-primary font-medium">You</span>
										</div>
										<div className="bg-[#1E293B] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] max-w-[80%]">
											{t("home.demo.scene1.chatMessage3")}
										</div>
									</div>

									<div className="scene-animate border-t border-[#334155] pt-4 mt-4">
										<p className="text-xs text-[#64748B] uppercase tracking-wider mb-3">
											{t("home.demo.scene1.extractionLabel")}
										</p>
										<div className="space-y-2">
											{(["process1", "process2", "process3"] as const).map((key) => (
												<div key={key} className="flex items-center gap-3 bg-[#1E293B] rounded-lg px-3 py-2 border border-primary/20">
													<span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
													<span className="text-sm text-[#F1F5F9] flex-1">{t(`home.demo.scene1.${key}`)}</span>
													<CheckIcon className="size-4 text-green-400" />
												</div>
											))}
										</div>
									</div>

									<div className="scene-animate flex items-center gap-2 text-[#64748B] text-xs">
										<MicIcon className="size-3.5" />
										{t("home.demo.scene1.audioLabel")}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Scene 2: Organize */}
					<div className="demo-scene">
						<div className="max-w-4xl mx-auto">
							<h3 className="text-center text-2xl md:text-3xl font-display text-foreground mb-8">
								{t("home.demo.scene2.title")}
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{(["strategic", "core", "support"] as const).map((cat) => (
									<div key={cat} className="scene-animate bg-card border rounded-2xl p-6">
										<h4 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider">
											{t(`home.demo.scene2.${cat}`)}
										</h4>
										<div className="space-y-2">
											{[1, 2].map((n) => (
												<div key={n} className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground border border-border">
													<div className="w-full h-3 bg-muted rounded" />
												</div>
											))}
										</div>
										<p className="text-xs text-muted-foreground mt-3">
											{t("home.demo.scene2.processCount", { count: 2 })}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Scene 3: Deep Dive */}
					<div className="demo-scene">
						<div className="max-w-4xl mx-auto">
							<h3 className="text-center text-2xl md:text-3xl font-display text-foreground mb-8">
								{t("home.demo.scene3.title")}
							</h3>
							<div className="bg-[#0F172A] rounded-2xl border border-[#334155] overflow-hidden">
								<div className="flex items-center gap-2 px-4 py-3 border-b border-[#334155]">
									<div className="flex gap-1.5">
										<div className="w-3 h-3 rounded-full bg-red-500/60" />
										<div className="w-3 h-3 rounded-full bg-yellow-500/60" />
										<div className="w-3 h-3 rounded-full bg-green-500/60" />
									</div>
									<span className="text-[#64748B] text-xs ml-2">{t("home.demo.windowTitle")}</span>
									<div className="ml-auto flex items-center gap-1.5">
										<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
										<span className="text-red-400 text-xs font-medium">{t("home.demo.scene3.rec")}</span>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-[#334155]">
									{/* Teleprompter */}
									<div className="p-4 border-b md:border-b-0 border-[#334155]">
										<p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-3">
											{t("home.demo.scene3.teleprompterLabel")}
										</p>
										<div className="scene-animate bg-primary/10 border border-primary/20 rounded-lg p-3 mb-2">
											<p className="text-xs text-primary font-medium mb-1">{t("home.demo.scene3.askNow")}</p>
											<p className="text-sm text-[#F1F5F9]">{t("home.demo.scene3.q1")}</p>
										</div>
										<div className="scene-animate bg-[#1E293B] rounded-lg p-3">
											<p className="text-xs text-[#94A3B8]">{t("home.demo.scene3.q2")}</p>
										</div>
									</div>

									{/* BPMN Canvas */}
									<div className="p-4 bg-white border-b md:border-b-0 border-[#334155]">
										<svg viewBox="0 0 300 150" className="w-full" fill="none">
											<line x1="40" y1="75" x2="80" y2="75" stroke="#64748B" strokeWidth="1" />
											<line x1="160" y1="75" x2="200" y2="75" stroke="#64748B" strokeWidth="1" />
											<circle cx="25" cy="75" r="12" stroke="#16A34A" strokeWidth="1.5" fill="#F0FDF4" />
											<rect x="80" y="55" width="80" height="40" rx="4" stroke="#3B8FE8" strokeWidth="1.5" fill="#ECFDF5" />
											<text x="120" y="79" textAnchor="middle" className="text-[8px]" fill="#3B8FE8" fontFamily="system-ui">{t("home.demo.scene4.nodeMgr")}</text>
											<rect x="200" y="55" width="80" height="40" rx="4" stroke="#3B8FE8" strokeWidth="1.5" fill="#ECFDF5" strokeDasharray="4 3" />
											<text x="240" y="79" textAnchor="middle" className="text-[8px]" fill="#3B8FE8" fontFamily="system-ui">{t("home.demo.scene4.nodeVp")}</text>
										</svg>
									</div>

									{/* Transcript */}
									<div className="p-4">
										<p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-3">
											{t("home.demo.scene3.transcriptLabel")}
										</p>
										<div className="space-y-2">
											<div className="scene-animate">
												<p className="text-[10px] text-[#3B8FE8] mb-0.5">{t("home.demo.scene3.consultantLabel")}</p>
												<p className="text-xs text-[#94A3B8]">{t("home.demo.scene3.t1")}</p>
											</div>
											<div className="scene-animate">
												<p className="text-[10px] text-[#7C3AED] mb-0.5">{t("home.demo.scene3.clientLabel")}</p>
												<p className="text-xs text-[#94A3B8]">{t("home.demo.scene3.t2")}</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Scene 4: Deliver */}
					<div className="demo-scene">
						<div className="max-w-4xl mx-auto">
							<h3 className="text-center text-2xl md:text-3xl font-display text-foreground mb-8">
								{t("home.demo.scene4.title")}
							</h3>
							<div className="bg-card border rounded-2xl overflow-hidden">
								<div className="scene-animate flex items-center justify-center gap-8 px-6 py-4 border-b bg-muted/30 flex-wrap">
									<div className="text-center">
										<p className="text-lg font-semibold text-foreground tabular-nums">{t("home.demo.scene4.stats.duration")}</p>
										<p className="text-xs text-muted-foreground">{t("home.demo.scene4.stats.durationLabel")}</p>
									</div>
									<div className="text-center">
										<p className="text-lg font-semibold text-foreground tabular-nums">{t("home.demo.scene4.stats.steps")}</p>
										<p className="text-xs text-muted-foreground">{t("home.demo.scene4.stats.stepsLabel")}</p>
									</div>
									<div className="text-center">
										<p className="text-lg font-semibold text-primary tabular-nums">{t("home.demo.scene4.stats.confidence")}</p>
										<p className="text-xs text-muted-foreground">{t("home.demo.scene4.stats.confidenceLabel")}</p>
									</div>
								</div>

								<div className="p-8">
									<svg viewBox="0 0 600 180" className="w-full" fill="none">
										<line x1="55" y1="90" x2="100" y2="90" stroke="#64748B" strokeWidth="1.5" />
										<line x1="220" y1="90" x2="260" y2="90" stroke="#64748B" strokeWidth="1.5" />
										<line x1="260" y1="90" x2="320" y2="50" stroke="#64748B" strokeWidth="1.5" />
										<line x1="260" y1="90" x2="320" y2="130" stroke="#64748B" strokeWidth="1.5" />
										<line x1="440" y1="50" x2="480" y2="90" stroke="#64748B" strokeWidth="1.5" />
										<line x1="440" y1="130" x2="480" y2="90" stroke="#64748B" strokeWidth="1.5" />
										<line x1="500" y1="90" x2="540" y2="90" stroke="#64748B" strokeWidth="1.5" />

										<circle cx="40" cy="90" r="14" stroke="#16A34A" strokeWidth="2" fill="#F0FDF4" />
										<rect x="100" y="65" width="120" height="50" rx="6" stroke="#3B8FE8" strokeWidth="1.5" fill="#ECFDF5" />
										<text x="160" y="94" textAnchor="middle" className="text-[10px]" fill="#3B8FE8" fontFamily="system-ui">{t("home.demo.scene4.nodeSubmit")}</text>
										<rect x="245" y="75" width="30" height="30" rx="3" transform="rotate(45 260 90)" stroke="#EF4444" strokeWidth="1.5" fill="#FEF2F2" />
										<rect x="320" y="25" width="120" height="50" rx="6" stroke="#3B8FE8" strokeWidth="1.5" fill="#ECFDF5" />
										<text x="380" y="54" textAnchor="middle" className="text-[10px]" fill="#3B8FE8" fontFamily="system-ui">{t("home.demo.scene4.nodeMgr")}</text>
										<rect x="320" y="105" width="120" height="50" rx="6" stroke="#3B8FE8" strokeWidth="1.5" fill="#ECFDF5" />
										<text x="380" y="134" textAnchor="middle" className="text-[10px]" fill="#3B8FE8" fontFamily="system-ui">{t("home.demo.scene4.nodeVp")}</text>
										<rect x="465" y="75" width="30" height="30" rx="3" transform="rotate(45 480 90)" stroke="#EF4444" strokeWidth="1.5" fill="#FEF2F2" />
										<circle cx="555" cy="90" r="14" stroke="#DC2626" strokeWidth="2.5" fill="#FEF2F2" />
										<text x="285" y="48" className="text-[8px]" fill="#64748B" fontFamily="system-ui">{t("home.demo.scene4.labelLt")}</text>
										<text x="285" y="128" className="text-[8px]" fill="#64748B" fontFamily="system-ui">{t("home.demo.scene4.labelGte")}</text>
									</svg>
								</div>

								<div className="scene-animate flex items-center justify-center gap-3 px-6 py-4 border-t bg-muted/30 flex-wrap">
									<button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">
										<DownloadIcon className="size-3.5" />
										{t("home.demo.scene4.exportBpmn")}
									</button>
									<button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium text-foreground">
										<LinkIcon className="size-3.5" />
										{t("home.demo.scene4.shareLink")}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
