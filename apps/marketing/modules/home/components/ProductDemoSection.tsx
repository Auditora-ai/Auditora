"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { Button } from "@repo/ui/components/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

/* ── SVG Avatar illustrations (simple silhouettes with distinguishing features) ── */

function AvatarConsultant() {
	return (
		<svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
			<circle cx="40" cy="30" r="14" fill="#CBD5E1" />
			{/* Short hair */}
			<path d="M26 28c0-10 6-16 14-16s14 6 14 16" fill="#334155" />
			{/* Glasses */}
			<rect x="30" y="27" width="9" height="7" rx="2" stroke="#334155" strokeWidth="1.5" fill="none" />
			<rect x="41" y="27" width="9" height="7" rx="2" stroke="#334155" strokeWidth="1.5" fill="none" />
			<line x1="39" y1="30" x2="41" y2="30" stroke="#334155" strokeWidth="1.5" />
			{/* Body */}
			<path d="M18 72c0-14 10-22 22-22s22 8 22 22" fill="#2563EB" />
			{/* Collar */}
			<path d="M34 50l6 8 6-8" fill="#1E40AF" />
		</svg>
	);
}

function AvatarClient1() {
	return (
		<svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
			<circle cx="40" cy="30" r="14" fill="#CBD5E1" />
			{/* Long hair */}
			<path d="M24 32c0-12 7-20 16-20s16 8 16 20c0 2-1 4-2 5 1-8-5-17-14-17S25 29 26 37c-1-1-2-3-2-5z" fill="#1E293B" />
			{/* Body */}
			<path d="M18 72c0-14 10-22 22-22s22 8 22 22" fill="#7C3AED" />
			{/* Necklace */}
			<circle cx="40" cy="53" r="2" fill="#A78BFA" />
		</svg>
	);
}

function AvatarClient2() {
	return (
		<svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
			<circle cx="40" cy="30" r="14" fill="#CBD5E1" />
			{/* Short hair + beard */}
			<path d="M27 26c0-9 6-14 13-14s13 5 13 14" fill="#44403C" />
			<path d="M32 38c0 4 4 6 8 6s8-2 8-6" fill="#44403C" opacity="0.6" />
			{/* Body */}
			<path d="M18 72c0-14 10-22 22-22s22 8 22 22" fill="#0F766E" />
		</svg>
	);
}

function AvatarClient3() {
	return (
		<svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
			<circle cx="40" cy="30" r="14" fill="#CBD5E1" />
			{/* Curly/short hair */}
			<path d="M26 28c0-10 6-16 14-16s14 6 14 16" fill="#92400E" />
			<circle cx="30" cy="22" r="3" fill="#92400E" />
			<circle cx="40" cy="19" r="3" fill="#92400E" />
			<circle cx="50" cy="22" r="3" fill="#92400E" />
			{/* Body */}
			<path d="M18 72c0-14 10-22 22-22s22 8 22 22" fill="#D97706" />
		</svg>
	);
}

function ProzeLogo() {
	return (
		<svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
			{/* Background circle */}
			<circle cx="40" cy="40" r="36" fill="#0F172A" />
			{/* Prozea logo mark */}
			<circle cx="28" cy="40" r="5" fill="#2563EB" />
			<circle cx="52" cy="30" r="5" fill="#2563EB" />
			<circle cx="52" cy="50" r="5" fill="#2563EB" />
			<path d="M33 40L47 30" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
			<path d="M33 40L47 50" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
			<rect x="38" y="37" width="5" height="5" rx="1" fill="#2563EB" opacity="0.5" transform="rotate(45 40.5 39.5)" />
		</svg>
	);
}

/* ── Waveform bars component ── */
function WaveformBars({ className, barCount = 5 }: { className?: string; barCount?: number }) {
	return (
		<div className={`flex items-center gap-[2px] ${className ?? ""}`}>
			{Array.from({ length: barCount }).map((_, i) => (
				<div
					key={i}
					className="w-[3px] rounded-full bg-current animate-waveform"
					style={{
						height: "12px",
						animationDelay: `${i * 0.15}s`,
						animationDuration: `${0.6 + Math.random() * 0.4}s`,
					}}
				/>
			))}
		</div>
	);
}

/* ── Main Component ── */
export function ProductDemoSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	const transcriptLines = [
		{ speakerKey: "consultantLabel", color: "#2563EB", textKey: "t1" },
		{ speakerKey: "clientLabel", color: "#7C3AED", textKey: "t2" },
		{ speakerKey: "clientLabel", color: "#7C3AED", textKey: "t3" },
		{ speakerKey: "consultantLabel", color: "#2563EB", textKey: "t4" },
		{ speakerKey: "clientLabel", color: "#7C3AED", textKey: "t5" },
	] as const;

	const questionKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			ScrollTrigger.matchMedia({
				// ═══════════════════════════════════════
				// DESKTOP TIMELINE (768px+)
				// ═══════════════════════════════════════
				"(min-width: 768px)": () => {
					const tl = gsap.timeline({
						scrollTrigger: {
							trigger: sectionRef.current,
							start: "top top",
							end: "+=600%",
							pin: true,
							scrub: 1,
							anticipatePin: 1,
						},
					});

					// ━━━ SCENE 1: Prozea Joins Your Call (0-20%) ━━━
					tl.addLabel("scene1", 0);

					// Scene title fades in
					tl.from(".scene1-title", {
						opacity: 0,
						y: 30,
						duration: 1,
						ease: "power2.out",
					}, "scene1");

					// Call window appears
					tl.from(".call-window", {
						opacity: 0,
						y: 50,
						scale: 0.92,
						duration: 2,
						ease: "power2.out",
					}, "scene1+=0.3");

					// Participant tiles stagger in
					tl.from(".participant-tile", {
						opacity: 0,
						scale: 0.8,
						duration: 1,
						stagger: 0.3,
						ease: "back.out(1.4)",
					}, "scene1+=1");

					// Notification toast slides in
					tl.from(".join-toast", {
						opacity: 0,
						y: -20,
						duration: 0.8,
						ease: "power2.out",
					}, "scene1+=2.5");

					// Prozea bot tile appears
					tl.from(".prozea-tile", {
						opacity: 0,
						scale: 0,
						duration: 1,
						ease: "back.out(2)",
					}, "scene1+=3");

					// Hold scene 1
					tl.to({}, { duration: 1 });

					// ━━━ TRANSITION 1→2: Call shrinks to PiP ━━━
					tl.addLabel("trans12", 5);

					// Fade out scene 1 title
					tl.to(".scene1-title", {
						opacity: 0,
						y: -20,
						duration: 0.8,
					}, "trans12");

					// Call window shrinks to PiP
					tl.to(".call-window", {
						scale: 0.35,
						x: "-120%",
						y: "-100%",
						duration: 2,
						ease: "power2.inOut",
					}, "trans12+=0.3");

					// Hide toast
					tl.to(".join-toast", {
						opacity: 0,
						duration: 0.4,
					}, "trans12");

					// ━━━ SCENE 2: Every Word, Captured (20-40%) ━━━
					tl.addLabel("scene2", 7);

					// Scene 2 title
					tl.from(".scene2-title", {
						opacity: 0,
						y: 20,
						duration: 1,
					}, "scene2");

					// Transcript panel expands
					tl.from(".transcript-panel", {
						clipPath: "inset(0 100% 0 0)",
						duration: 2,
						ease: "power2.inOut",
					}, "scene2+=0.3");

					// Waveform label
					tl.from(".waveform-header", {
						opacity: 0,
						duration: 0.6,
					}, "scene2+=1");

					// Transcript lines appear sequentially
					tl.from(".transcript-panel .t-line", {
						opacity: 0,
						x: 30,
						duration: 0.8,
						stagger: 0.5,
						ease: "power2.out",
					}, "scene2+=1.5");

					// Keywords highlight
					tl.from(".keyword-highlight", {
						backgroundColor: "transparent",
						duration: 0.3,
						stagger: 0.4,
					}, "scene2+=2.5");

					// Hold scene 2
					tl.to({}, { duration: 1 });

					// Fade scene 2 title
					tl.to(".scene2-title", {
						opacity: 0,
						y: -15,
						duration: 0.6,
					}, "+=0");

					// ━━━ TRANSITION 2→3: Split layout ━━━
					tl.addLabel("trans23", 12);

					// Transcript slides right
					tl.to(".transcript-panel", {
						x: "25%",
						width: "50%",
						duration: 2,
						ease: "power2.inOut",
					}, "trans23");

					// ━━━ SCENE 3: AI Guides Your Questions (40-55%) ━━━
					tl.addLabel("scene3", 14);

					// Scene 3 title
					tl.from(".scene3-title", {
						opacity: 0,
						y: 20,
						duration: 1,
					}, "scene3");

					// Teleprompter panel slides in
					tl.from(".teleprompter-panel", {
						clipPath: "inset(0 0 0 100%)",
						duration: 1.5,
						ease: "power2.inOut",
					}, "scene3+=0.3");

					// Questions appear
					tl.from(".teleprompter-panel .tq", {
						opacity: 0,
						y: 15,
						duration: 0.6,
						stagger: 0.4,
					}, "scene3+=1");

					// AI suggestion connector
					tl.from(".ai-connector", {
						scaleX: 0,
						duration: 1,
						ease: "power2.inOut",
					}, "scene3+=1.5");

					// "Ask Now" badge
					tl.from(".ask-now-badge", {
						opacity: 0,
						scale: 0.5,
						duration: 0.6,
						ease: "back.out(2)",
					}, "scene3+=2");

					// Hold
					tl.to({}, { duration: 1 });

					// Fade scene 3 title
					tl.to(".scene3-title", {
						opacity: 0,
						y: -15,
						duration: 0.6,
					}, "+=0");

					// ━━━ TRANSITION 3→4: Morph to 3-panel ━━━
					tl.addLabel("trans34", 19);

					// Shrink PiP call completely
					tl.to(".call-window", {
						opacity: 0,
						scale: 0.1,
						duration: 1,
					}, "trans34");

					// Transcript becomes narrow sidebar
					tl.to(".transcript-panel", {
						x: "0%",
						width: "100%",
						duration: 1.5,
						ease: "power2.inOut",
					}, "trans34");

					// Teleprompter becomes narrow sidebar
					tl.to(".teleprompter-panel", {
						width: "100%",
						duration: 1.5,
						ease: "power2.inOut",
					}, "trans34");

					// ━━━ SCENE 4: The Diagram Builds Itself (55-80%) ━━━
					tl.addLabel("scene4", 21);

					// Scene 4 title
					tl.from(".scene4-title", {
						opacity: 0,
						y: 20,
						duration: 1,
					}, "scene4");

					// 3-panel demo window appears
					tl.from(".demo-window", {
						opacity: 0,
						y: 30,
						scale: 0.96,
						duration: 1.5,
						ease: "power2.out",
					}, "scene4+=0.3");

					// Window chrome
					tl.from(".window-chrome", {
						opacity: 0,
						duration: 0.5,
					}, "scene4+=1");

					// BPMN nodes with forming → confirmed
					// Start Event
					tl.from(".node-start .node-forming", {
						opacity: 0,
						scale: 0,
						transformOrigin: "center center",
						duration: 0.6,
						ease: "back.out(1.7)",
					}, "scene4+=1.5");
					tl.to(".node-start .node-forming", { opacity: 0, duration: 0.4 }, "scene4+=2.3");
					tl.to(".node-start .node-confirmed", { opacity: 1, duration: 0.4 }, "scene4+=2.3");

					// Connection: Start → Submit
					tl.from(".conn-start-submit", {
						strokeDashoffset: 100,
						duration: 0.8,
					}, "scene4+=2.5");

					// Submit PO
					tl.from(".node-submit .node-forming", {
						opacity: 0,
						scale: 0.5,
						transformOrigin: "center center",
						duration: 0.6,
						ease: "back.out(1.7)",
					}, "scene4+=2.8");
					tl.to(".node-submit .node-forming", { opacity: 0, duration: 0.4 }, "scene4+=3.6");
					tl.to(".node-submit .node-confirmed", { opacity: 1, duration: 0.4 }, "scene4+=3.6");

					// Connection: Submit → Gateway
					tl.from(".conn-submit-gw", {
						strokeDashoffset: 100,
						duration: 0.8,
					}, "scene4+=3.8");

					// Gateway
					tl.from(".node-gateway .node-forming", {
						opacity: 0,
						scale: 0.5,
						transformOrigin: "center center",
						duration: 0.6,
						ease: "back.out(1.7)",
					}, "scene4+=4");
					tl.to(".node-gateway .node-forming", { opacity: 0, duration: 0.4 }, "scene4+=4.8");
					tl.to(".node-gateway .node-confirmed", { opacity: 1, duration: 0.4 }, "scene4+=4.8");

					// Branch connections
					tl.from(".conn-gw-mgr", { strokeDashoffset: 150, duration: 1 }, "scene4+=5");
					tl.from(".conn-gw-vp", { strokeDashoffset: 150, duration: 1 }, "scene4+=5.3");

					// Labels
					tl.from(".label-lt", { opacity: 0, duration: 0.4 }, "scene4+=5.5");
					tl.from(".label-gte", { opacity: 0, duration: 0.4 }, "scene4+=5.8");

					// Mgr Approval
					tl.from(".node-mgr .node-forming", {
						opacity: 0, scale: 0.5, transformOrigin: "center center",
						duration: 0.6, ease: "back.out(1.7)",
					}, "scene4+=5.5");
					tl.to(".node-mgr .node-forming", { opacity: 0, duration: 0.4 }, "scene4+=6.3");
					tl.to(".node-mgr .node-confirmed", { opacity: 1, duration: 0.4 }, "scene4+=6.3");

					// VP Approval
					tl.from(".node-vp .node-forming", {
						opacity: 0, scale: 0.5, transformOrigin: "center center",
						duration: 0.6, ease: "back.out(1.7)",
					}, "scene4+=5.8");
					tl.to(".node-vp .node-forming", { opacity: 0, duration: 0.4 }, "scene4+=6.6");
					tl.to(".node-vp .node-confirmed", { opacity: 1, duration: 0.4 }, "scene4+=6.6");

					// End Event
					tl.from(".conn-mgr-end", { strokeDashoffset: 100, duration: 0.8 }, "scene4+=6.8");
					tl.from(".node-end .node-forming", {
						opacity: 0, scale: 0, transformOrigin: "center center",
						duration: 0.6, ease: "back.out(1.7)",
					}, "scene4+=7");
					tl.to(".node-end .node-forming", { opacity: 0, duration: 0.4 }, "scene4+=7.8");
					tl.to(".node-end .node-confirmed", { opacity: 1, duration: 0.4 }, "scene4+=7.8");

					// Fade scene 4 title
					tl.to(".scene4-title", {
						opacity: 0,
						y: -15,
						duration: 0.6,
					}, "scene4+=7");

					// ━━━ SCENE 5: Walk Out With a Deliverable (80-100%) ━━━
					tl.addLabel("scene5", 29);

					// Scene 5 title
					tl.from(".scene5-title", {
						opacity: 0,
						y: 20,
						duration: 1,
					}, "scene5");

					// Stats bar
					tl.from(".stats-bar", {
						opacity: 0,
						y: 20,
						duration: 1,
						ease: "power2.out",
					}, "scene5+=0.5");

					// Before/After comparison
					tl.from(".comparison-before", {
						opacity: 0,
						x: -20,
						duration: 0.8,
					}, "scene5+=1");
					tl.from(".comparison-after", {
						opacity: 0,
						x: 20,
						duration: 0.8,
					}, "scene5+=1.3");

					// CTA button
					tl.from(".demo-cta", {
						opacity: 0,
						y: 15,
						scale: 0.9,
						duration: 0.8,
						ease: "back.out(2)",
					}, "scene5+=2");

					// Window glow
					tl.to(".demo-window", {
						boxShadow: "0 25px 80px -12px rgba(37, 99, 235, 0.2)",
						duration: 1.5,
					}, "scene5+=1");

					// Hold at end
					tl.to({}, { duration: 2 });
				},

				// ═══════════════════════════════════════
				// MOBILE TIMELINE (<768px)
				// ═══════════════════════════════════════
				"(max-width: 767px)": () => {
					const tl = gsap.timeline({
						scrollTrigger: {
							trigger: sectionRef.current,
							start: "top top",
							end: "+=400%",
							pin: true,
							scrub: 1,
							anticipatePin: 1,
						},
					});

					// Scene 1: Call
					tl.from(".scene1-title", { opacity: 0, y: 20, duration: 1 });
					tl.from(".call-window", { opacity: 0, y: 30, scale: 0.95, duration: 1.5 }, "<+0.2");
					tl.from(".participant-tile", { opacity: 0, scale: 0.8, stagger: 0.2, duration: 0.6 }, "<+0.5");
					tl.from(".join-toast", { opacity: 0, y: -15, duration: 0.6 }, "+=0.2");
					tl.from(".prozea-tile", { opacity: 0, scale: 0, duration: 0.8, ease: "back.out(2)" }, "+=0.2");
					tl.to({}, { duration: 0.5 });

					// Transition: fade call, show transcript
					tl.to(".call-window", { opacity: 0, scale: 0.8, duration: 1 });
					tl.to(".scene1-title", { opacity: 0, duration: 0.5 }, "<");
					tl.from(".scene2-title", { opacity: 0, y: 15, duration: 0.8 }, "<+0.3");
					tl.from(".transcript-panel", { clipPath: "inset(0 100% 0 0)", duration: 1.5 }, "<+0.2");
					tl.from(".transcript-panel .t-line", { opacity: 0, x: 20, stagger: 0.3, duration: 0.6 }, "<+0.5");
					tl.to({}, { duration: 0.5 });

					// Transition to diagram
					tl.to(".transcript-panel", { opacity: 0, duration: 0.8 });
					tl.to(".scene2-title", { opacity: 0, duration: 0.5 }, "<");
					tl.from(".scene4-title", { opacity: 0, y: 15, duration: 0.8 }, "<+0.3");
					tl.from(".demo-window", { opacity: 0, y: 20, scale: 0.96, duration: 1.5 }, "<+0.2");

					// BPMN nodes batch
					tl.from(".bpmn-node .node-forming", {
						opacity: 0, scale: 0.5, transformOrigin: "center center",
						stagger: 0.2, duration: 0.4, ease: "back.out(1.7)",
					}, "+=0.3");
					tl.to(".bpmn-node .node-forming", { opacity: 0, stagger: 0.1, duration: 0.3 }, "+=0.2");
					tl.to(".bpmn-node .node-confirmed", { opacity: 1, stagger: 0.1, duration: 0.3 }, "<");
					tl.from(".bpmn-connection", { strokeDashoffset: 200, stagger: 0.1, duration: 0.3 }, "<+0.1");
					tl.from(".bpmn-label", { opacity: 0, stagger: 0.1, duration: 0.2 }, "<+0.1");

					// Scene 5
					tl.to(".scene4-title", { opacity: 0, duration: 0.5 }, "+=0.3");
					tl.from(".scene5-title", { opacity: 0, y: 15, duration: 0.8 }, "<+0.2");
					tl.from(".stats-bar", { opacity: 0, y: 15, duration: 0.8 }, "+=0.2");
					tl.from(".demo-cta", { opacity: 0, y: 10, scale: 0.9, duration: 0.6 }, "+=0.2");
					tl.to({}, { duration: 1 });
				},
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} id="demo" className="relative bg-background overflow-hidden">
			{/* Ambient background glow */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.05),transparent_70%)] pointer-events-none" />

			<div className="container max-w-6xl relative min-h-screen flex flex-col items-center justify-center py-12">

				{/* ══════════ SCENE TITLES (positioned absolutely, fade in/out) ══════════ */}
				<div className="absolute top-8 md:top-12 left-0 right-0 text-center z-20 pointer-events-none">
					<h2 className="scene1-title font-display text-2xl md:text-3xl lg:text-4xl text-foreground absolute inset-x-0">
						{t("home.demo.scene1.title")}
					</h2>
					<h2 className="scene2-title font-display text-2xl md:text-3xl lg:text-4xl text-foreground absolute inset-x-0 opacity-0">
						{t("home.demo.scene2.title")}
					</h2>
					<h2 className="scene3-title font-display text-2xl md:text-3xl lg:text-4xl text-foreground absolute inset-x-0 opacity-0">
						{t("home.demo.scene3.title")}
					</h2>
					<h2 className="scene4-title font-display text-2xl md:text-3xl lg:text-4xl text-foreground absolute inset-x-0 opacity-0">
						{t("home.demo.scene4.title")}
					</h2>
					<h2 className="scene5-title font-display text-2xl md:text-3xl lg:text-4xl text-foreground absolute inset-x-0 opacity-0">
						{t("home.demo.scene5.title")}
					</h2>
				</div>

				{/* ══════════ SCENE 1: Video Call ══════════ */}
				<div className="call-window w-full max-w-3xl rounded-2xl border border-border overflow-hidden shadow-2xl shadow-primary/5 bg-[#1E293B]">
					{/* Call chrome */}
					<div className="flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-[#334155]">
						<div className="flex gap-1.5">
							<div className="w-3 h-3 rounded-full bg-[#DC2626]/80" />
							<div className="w-3 h-3 rounded-full bg-[#D97706]/80" />
							<div className="w-3 h-3 rounded-full bg-[#16A34A]/80" />
						</div>
						<span className="text-xs text-[#94A3B8] font-medium">Meeting — Process Review</span>
						<span className="flex items-center gap-1.5 text-xs text-[#DC2626]">
							<span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
							{t("home.demo.rec")}
						</span>
					</div>

					{/* Participant grid */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-6">
						{/* You (Consultant) */}
						<div className="participant-tile rounded-xl bg-[#0F172A] border-2 border-[#2563EB]/50 p-3 flex flex-col items-center gap-2">
							<div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-[#334155]">
								<AvatarConsultant />
							</div>
							<span className="text-[11px] text-[#94A3B8] font-medium truncate w-full text-center">
								{t("home.demo.scene1.you")}
							</span>
							<WaveformBars className="text-[#2563EB]/60 h-3" barCount={4} />
						</div>

						{/* Client 1 */}
						<div className="participant-tile rounded-xl bg-[#0F172A] border-2 border-[#7C3AED]/30 p-3 flex flex-col items-center gap-2">
							<div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-[#334155]">
								<AvatarClient1 />
							</div>
							<span className="text-[11px] text-[#94A3B8] font-medium truncate w-full text-center">
								{t("home.demo.scene1.participant1")}
							</span>
							<WaveformBars className="text-[#7C3AED]/60 h-3" barCount={4} />
						</div>

						{/* Client 2 */}
						<div className="participant-tile rounded-xl bg-[#0F172A] border-2 border-[#0F766E]/30 p-3 flex flex-col items-center gap-2 hidden md:flex">
							<div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-[#334155]">
								<AvatarClient2 />
							</div>
							<span className="text-[11px] text-[#94A3B8] font-medium truncate w-full text-center">
								{t("home.demo.scene1.participant2")}
							</span>
							<WaveformBars className="text-[#0F766E]/60 h-3" barCount={4} />
						</div>

						{/* Client 3 */}
						<div className="participant-tile rounded-xl bg-[#0F172A] border-2 border-[#D97706]/30 p-3 flex flex-col items-center gap-2 hidden md:flex">
							<div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-[#334155]">
								<AvatarClient3 />
							</div>
							<span className="text-[11px] text-[#94A3B8] font-medium truncate w-full text-center">
								{t("home.demo.scene1.participant3")}
							</span>
							<WaveformBars className="text-[#D97706]/60 h-3" barCount={4} />
						</div>
					</div>

					{/* Notification toast */}
					<div className="join-toast mx-4 md:mx-6 mb-4 md:mb-6 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 px-4 py-2.5 flex items-center gap-3">
						<div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
							<ProzeLogo />
						</div>
						<span className="text-sm text-[#93C5FD] font-medium">
							{t("home.demo.scene1.joining")}
						</span>
						<div className="ml-auto">
							<div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
						</div>
					</div>

					{/* Prozea bot tile (appears after toast) */}
					<div className="prozea-tile mx-4 md:mx-6 mb-4 md:mb-6 rounded-xl bg-[#0F172A] border-2 border-[#2563EB] p-3 flex items-center gap-3 shadow-lg shadow-[#2563EB]/10">
						<div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
							<ProzeLogo />
						</div>
						<div>
							<span className="text-sm text-[#E2E8F0] font-medium block">
								{t("home.demo.scene1.prozea")}
							</span>
							<span className="text-[11px] text-[#16A34A] flex items-center gap-1">
								<span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
								Connected
							</span>
						</div>
						<WaveformBars className="text-[#2563EB] h-4 ml-auto" barCount={6} />
					</div>
				</div>

				{/* ══════════ SCENE 2: Transcript Panel ══════════ */}
				<div className="transcript-panel absolute inset-x-0 top-20 md:top-24 bottom-0 mx-auto w-full max-w-3xl rounded-2xl border border-border overflow-hidden bg-[#0F172A] shadow-2xl z-10" style={{ clipPath: "inset(0 0% 0 0)" }}>
					{/* Waveform header */}
					<div className="waveform-header flex items-center gap-3 px-5 py-3 border-b border-[#334155]">
						<div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
						<span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
							{t("home.demo.scene2.waveformLabel")}
						</span>
						<WaveformBars className="text-[#16A34A]/60 h-4 ml-auto" barCount={12} />
					</div>

					{/* Transcript lines */}
					<div className="p-5 space-y-4 overflow-hidden">
						{transcriptLines.map((line, i) => (
							<div key={line.textKey} className="t-line">
								<span
									className="text-[11px] font-medium block mb-1"
									style={{ color: line.color }}
								>
									{t(`home.demo.${line.speakerKey}`)}
								</span>
								<p className="text-[#E2E8F0] text-sm leading-relaxed">
									{i === 0 ? (
										<>
											Walk me through what happens after a{" "}
											<span className="keyword-highlight rounded px-1 py-0.5 bg-[#2563EB]/20 text-[#93C5FD]">
												purchase order
											</span>{" "}
											is submitted.
										</>
									) : i === 1 ? (
										<>
											It goes to the{" "}
											<span className="keyword-highlight rounded px-1 py-0.5 bg-[#7C3AED]/20 text-[#C4B5FD]">
												department manager
											</span>{" "}
											for approval first.
										</>
									) : i === 2 ? (
										<>
											If it&apos;s over{" "}
											<span className="keyword-highlight rounded px-1 py-0.5 bg-[#D97706]/20 text-[#FCD34D]">
												$5,000
											</span>
											, it also needs{" "}
											<span className="keyword-highlight rounded px-1 py-0.5 bg-[#7C3AED]/20 text-[#C4B5FD]">
												VP sign-off
											</span>.
										</>
									) : (
										t(`home.demo.${line.textKey}`)
									)}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* ══════════ SCENE 3: Teleprompter Panel ══════════ */}
				<div className="teleprompter-panel hidden md:block absolute left-0 top-20 md:top-24 bottom-0 w-[45%] max-w-md ml-[calc(50%-24rem)] rounded-2xl border border-border overflow-hidden bg-[#0F172A] shadow-2xl z-10" style={{ clipPath: "inset(0 0 0 0%)" }}>
					<div className="flex items-center gap-2 px-5 py-3 border-b border-[#334155]">
						<div className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
						<span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
							{t("home.demo.teleprompterLabel")}
						</span>
					</div>

					<div className="p-4 space-y-3">
						{/* AI suggestion connector */}
						<div className="ai-connector h-px bg-gradient-to-r from-[#7C3AED]/40 via-[#2563EB]/40 to-transparent mb-2 origin-left" />

						<div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2">
							{t("home.demo.scene3.aiSuggestion")}
						</div>

						{questionKeys.map((key, i) => (
							<div
								key={key}
								className={`tq rounded-lg px-3 py-2.5 text-[13px] leading-snug border ${
									i === 0
										? "bg-[#2563EB]/20 text-[#93C5FD] border-[#2563EB]/30"
										: "text-[#64748B] border-transparent"
								}`}
							>
								{i === 0 && (
									<span className="ask-now-badge inline-block text-[10px] uppercase tracking-wider text-[#2563EB] font-medium mb-1">
										{t("home.demo.askNow")}
									</span>
								)}
								<span className="block">{t(`home.demo.${key}`)}</span>
							</div>
						))}
					</div>
				</div>

				{/* ══════════ SCENE 4: Demo Window (3-panel BPMN) ══════════ */}
				<div className="demo-window absolute inset-x-0 top-16 md:top-20 mx-auto w-full max-w-5xl rounded-2xl border border-border overflow-hidden shadow-2xl shadow-primary/5 z-10 opacity-0">
					{/* Window chrome */}
					<div className="window-chrome flex items-center gap-2 px-4 py-3 bg-[#0F172A] border-b border-[#334155]">
						<div className="flex gap-1.5">
							<div className="w-3 h-3 rounded-full bg-[#DC2626]/80" />
							<div className="w-3 h-3 rounded-full bg-[#D97706]/80" />
							<div className="w-3 h-3 rounded-full bg-[#16A34A]/80" />
						</div>
						<div className="flex-1 text-center">
							<span className="text-xs text-[#94A3B8] font-medium">
								{t("home.demo.windowTitle")}
							</span>
						</div>
						<span className="flex items-center gap-1.5 text-xs text-[#DC2626]">
							<span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
							{t("home.demo.rec")}
						</span>
					</div>

					{/* 3-panel layout */}
					<div className="grid grid-cols-1 md:grid-cols-[20%_55%_25%] min-h-[350px] md:min-h-[420px]">
						{/* Left: Teleprompter mini */}
						<div className="hidden md:block bg-[#0F172A] p-4 border-r border-[#334155]">
							<div className="flex items-center gap-2 mb-3">
								<div className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
								<span className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider">
									{t("home.demo.teleprompterLabel")}
								</span>
							</div>
							<div className="space-y-2">
								{questionKeys.slice(0, 4).map((key, i) => (
									<div
										key={key}
										className={`rounded px-2 py-1.5 text-[11px] leading-snug ${
											i === 2
												? "bg-[#2563EB]/20 text-[#93C5FD] border border-[#2563EB]/30"
												: "text-[#64748B]"
										}`}
									>
										{t(`home.demo.${key}`)}
									</div>
								))}
							</div>
						</div>

						{/* Center: BPMN Canvas */}
						<div className="bg-white p-4 md:p-5 relative min-h-[280px]">
							<svg viewBox="0 0 560 300" className="w-full h-full" fill="none">
								<defs>
									<marker id="demo-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
										<path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
									</marker>
								</defs>

								{/* Start Event */}
								<g className="bpmn-node node-start">
									<g className="node-forming">
										<circle cx="40" cy="150" r="16" stroke="#D97706" strokeWidth="2" strokeDasharray="6 3" fill="#FFFBEB" />
										<circle cx="40" cy="150" r="5" fill="#D97706" />
									</g>
									<g className="node-confirmed" opacity="0">
										<circle cx="40" cy="150" r="16" stroke="#16A34A" strokeWidth="2" fill="#F0FDF4" />
										<circle cx="40" cy="150" r="5" fill="#16A34A" />
									</g>
								</g>

								{/* Connection: Start → Submit */}
								<line className="bpmn-connection conn-start-submit"
									x1="56" y1="150" x2="100" y2="150"
									stroke="#64748B" strokeWidth="1.5"
									strokeDasharray="100" strokeDashoffset="0"
									markerEnd="url(#demo-arrow)" />

								{/* Submit PO */}
								<g className="bpmn-node node-submit">
									<g className="node-forming">
										<rect x="100" y="130" width="110" height="40" rx="6" stroke="#D97706" strokeWidth="2" strokeDasharray="6 3" fill="#FFFBEB" />
									</g>
									<g className="node-confirmed" opacity="0">
										<rect x="100" y="130" width="110" height="40" rx="6" stroke="#2563EB" strokeWidth="2" fill="#EFF6FF" />
									</g>
									<text x="155" y="154" textAnchor="middle" className="text-[11px] fill-[#0F172A]" fontFamily="system-ui">
										{t("home.demo.nodeSubmit")}
									</text>
								</g>

								{/* Connection: Submit → Gateway */}
								<line className="bpmn-connection conn-submit-gw"
									x1="210" y1="150" x2="248" y2="150"
									stroke="#64748B" strokeWidth="1.5"
									strokeDasharray="100" strokeDashoffset="0"
									markerEnd="url(#demo-arrow)" />

								{/* Gateway */}
								<g className="bpmn-node node-gateway">
									<g className="node-forming">
										<rect x="248" y="128" width="44" height="44" rx="2" stroke="#D97706" strokeWidth="2" strokeDasharray="6 3" fill="#FFFBEB" transform="rotate(45 270 150)" />
									</g>
									<g className="node-confirmed" opacity="0">
										<rect x="248" y="128" width="44" height="44" rx="2" stroke="#D97706" strokeWidth="2" fill="#FFFBEB" transform="rotate(45 270 150)" />
									</g>
									<text x="270" y="154" textAnchor="middle" className="text-[10px] fill-[#0F172A]" fontFamily="system-ui">
										{t("home.demo.nodeGateway")}
									</text>
								</g>

								{/* Connection: Gateway → Mgr */}
								<polyline className="bpmn-connection conn-gw-mgr"
									points="270,128 270,80 360,80"
									stroke="#64748B" strokeWidth="1.5" fill="none"
									strokeDasharray="150" strokeDashoffset="0"
									markerEnd="url(#demo-arrow)" />

								{/* Label < $5k */}
								<text className="bpmn-label label-lt text-[9px] fill-[#64748B]" x="260" y="105" textAnchor="middle" fontFamily="system-ui">
									{t("home.demo.labelLt")}
								</text>

								{/* Connection: Gateway → VP */}
								<polyline className="bpmn-connection conn-gw-vp"
									points="270,172 270,220 360,220"
									stroke="#64748B" strokeWidth="1.5" fill="none"
									strokeDasharray="150" strokeDashoffset="0"
									markerEnd="url(#demo-arrow)" />

								{/* Label ≥ $5k */}
								<text className="bpmn-label label-gte text-[9px] fill-[#64748B]" x="260" y="198" textAnchor="middle" fontFamily="system-ui">
									{t("home.demo.labelGte")}
								</text>

								{/* Mgr Approval */}
								<g className="bpmn-node node-mgr">
									<g className="node-forming">
										<rect x="360" y="60" width="100" height="40" rx="6" stroke="#D97706" strokeWidth="2" strokeDasharray="6 3" fill="#FFFBEB" />
									</g>
									<g className="node-confirmed" opacity="0">
										<rect x="360" y="60" width="100" height="40" rx="6" stroke="#2563EB" strokeWidth="2" fill="#EFF6FF" />
									</g>
									<text x="410" y="84" textAnchor="middle" className="text-[10px] fill-[#0F172A]" fontFamily="system-ui">
										{t("home.demo.nodeMgr")}
									</text>
								</g>

								{/* VP Approval */}
								<g className="bpmn-node node-vp">
									<g className="node-forming">
										<rect x="360" y="200" width="100" height="40" rx="6" stroke="#D97706" strokeWidth="2" strokeDasharray="6 3" fill="#FFFBEB" />
									</g>
									<g className="node-confirmed" opacity="0">
										<rect x="360" y="200" width="100" height="40" rx="6" stroke="#2563EB" strokeWidth="2" fill="#EFF6FF" />
									</g>
									<text x="410" y="224" textAnchor="middle" className="text-[10px] fill-[#0F172A]" fontFamily="system-ui">
										{t("home.demo.nodeVp")}
									</text>
								</g>

								{/* Connection: Mgr → End */}
								<line className="bpmn-connection conn-mgr-end"
									x1="460" y1="80" x2="510" y2="80"
									stroke="#64748B" strokeWidth="1.5"
									strokeDasharray="100" strokeDashoffset="0"
									markerEnd="url(#demo-arrow)" />

								{/* End Event */}
								<g className="bpmn-node node-end">
									<g className="node-forming">
										<circle cx="530" cy="80" r="14" stroke="#D97706" strokeWidth="2" strokeDasharray="6 3" fill="#FFFBEB" />
										<circle cx="530" cy="80" r="9" stroke="#D97706" strokeWidth="2" strokeDasharray="4 2" fill="#FFFBEB" />
									</g>
									<g className="node-confirmed" opacity="0">
										<circle cx="530" cy="80" r="14" stroke="#DC2626" strokeWidth="2.5" fill="#FEF2F2" />
										<circle cx="530" cy="80" r="9" stroke="#DC2626" strokeWidth="2" fill="#FEF2F2" />
									</g>
								</g>
							</svg>
						</div>

						{/* Right: Transcript mini */}
						<div className="bg-[#0F172A] p-4 border-t md:border-t-0 md:border-l border-[#334155]">
							<div className="flex items-center gap-2 mb-3">
								<div className="w-2 h-2 rounded-full bg-[#16A34A]" />
								<span className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider">
									{t("home.demo.transcriptLabel")}
								</span>
							</div>
							<div className="space-y-2">
								{transcriptLines.slice(0, 4).map((line) => (
									<div key={line.textKey}>
										<span className="text-[10px] font-medium block mb-0.5" style={{ color: line.color }}>
											{t(`home.demo.${line.speakerKey}`)}
										</span>
										<p className="text-[#E2E8F0] text-[11px] leading-relaxed">
											{t(`home.demo.${line.textKey}`)}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Stats bar */}
					<div className="stats-bar flex items-center justify-center gap-4 md:gap-6 px-4 py-2.5 bg-[#0F172A] border-t border-[#334155]">
						<div className="flex items-center gap-2">
							<span className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
								{t("home.demo.stats.durationLabel")}
							</span>
							<span className="text-xs text-[#E2E8F0] font-medium tabular-nums">
								{t("home.demo.stats.duration")}
							</span>
						</div>
						<div className="w-px h-3 bg-[#334155]" />
						<div className="flex items-center gap-2">
							<span className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
								{t("home.demo.stats.stepsLabel")}
							</span>
							<span className="text-xs text-[#E2E8F0] font-medium tabular-nums">
								{t("home.demo.stats.steps")}
							</span>
						</div>
						<div className="w-px h-3 bg-[#334155]" />
						<div className="flex items-center gap-2">
							<span className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
								{t("home.demo.stats.confidenceLabel")}
							</span>
							<span className="text-xs text-[#E2E8F0] font-medium tabular-nums">
								{t("home.demo.stats.confidence")}
							</span>
						</div>
						<div className="w-px h-3 bg-[#334155] hidden md:block" />
						<div className="hidden md:flex items-center gap-1.5">
							<svg className="w-3.5 h-3.5 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span className="text-xs text-[#16A34A] font-medium">
								{t("home.demo.stats.export")}
							</span>
						</div>
					</div>
				</div>

				{/* ══════════ SCENE 5: Comparison + CTA ══════════ */}
				<div className="absolute bottom-12 md:bottom-16 inset-x-0 z-20 pointer-events-none">
					<div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6">
						<div className="comparison-before text-center md:text-right opacity-0">
							<span className="text-xs font-medium text-[#DC2626]/80 uppercase tracking-wider block mb-1">Before</span>
							<p className="text-sm text-muted-foreground">{t("home.demo.scene5.before")}</p>
						</div>
						<div className="hidden md:block w-px h-10 bg-border" />
						<div className="comparison-after text-center md:text-left opacity-0">
							<span className="text-xs font-medium text-[#16A34A] uppercase tracking-wider block mb-1">Now</span>
							<p className="text-sm text-foreground font-medium">{t("home.demo.scene5.after")}</p>
						</div>
					</div>

					<div className="demo-cta flex justify-center opacity-0 pointer-events-auto">
						<Button size="lg" variant="primary" asChild>
							<a href={config.saasUrl}>
								{t("home.demo.scene5.cta")}
								<ArrowRightIcon className="ml-2 size-4" />
							</a>
						</Button>
					</div>
				</div>
			</div>

			{/* Waveform animation keyframes */}
			<style jsx>{`
				@keyframes waveform {
					0%, 100% { transform: scaleY(0.3); }
					50% { transform: scaleY(1); }
				}
				:global(.animate-waveform) {
					animation: waveform 0.8s ease-in-out infinite;
					transform-origin: center;
				}
			`}</style>
		</section>
	);
}
