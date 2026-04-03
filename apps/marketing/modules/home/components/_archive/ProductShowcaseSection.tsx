"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { Button } from "@repo/ui/components/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	ArrowRightIcon,
	BarChart3,
	Brain,
	FileText,
	Globe,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const TABS = [
	{ id: "discover", icon: Globe, labelKey: "showcase.discover" },
	{ id: "analyze", icon: Brain, labelKey: "showcase.analyze" },
	{ id: "document", icon: FileText, labelKey: "showcase.document" },
	{ id: "monitor", icon: BarChart3, labelKey: "showcase.monitor" },
] as const;

function DiscoverMockup() {
	return (
		<div className="flex flex-col items-center justify-center gap-4 py-8">
			<div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
				<Globe className="size-4 text-[#94A3B8]" />
				<span className="text-sm text-[#64748B]">https://acme-corp.com</span>
				<div className="ml-auto rounded bg-[#3B8FE8] px-2 py-0.5 text-xs font-medium text-[#0A1428]">
					Scanning...
				</div>
			</div>
			<div className="flex flex-wrap justify-center gap-3">
				{["Order Management", "Customer Onboarding", "Invoice Processing", "Delivery Logistics"].map(
					(proc) => (
						<div
							key={proc}
							className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm"
						>
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-[#3B8FE8]" />
								<span className="text-xs font-medium text-[#0A1428]">{proc}</span>
							</div>
							<p className="mt-1 text-[10px] text-[#94A3B8]">5 activities · 3 risks</p>
						</div>
					),
				)}
			</div>
		</div>
	);
}

function AnalyzeMockup() {
	return (
		<div className="flex flex-col items-center gap-3 py-6">
			<svg viewBox="0 0 320 160" className="w-full max-w-md" fill="none">
				<circle cx="20" cy="80" r="10" stroke="#3B8FE8" strokeWidth="2" fill="rgba(59,143,232,0.15)" />
				<line x1="30" y1="80" x2="60" y2="80" stroke="#3B8FE8" strokeWidth="1.5" />
				<rect x="60" y="65" width="55" height="30" rx="5" stroke="#3B8FE8" strokeWidth="1.5" fill="rgba(59,143,232,0.08)" />
				<line x1="115" y1="80" x2="140" y2="80" stroke="#3B8FE8" strokeWidth="1.5" />
				<rect x="135" y="70" width="14" height="14" rx="2" transform="rotate(45 142 77)" stroke="#3B8FE8" strokeWidth="1.5" fill="rgba(59,143,232,0.08)" />
				<line x1="154" y1="70" x2="185" y2="45" stroke="#3B8FE8" strokeWidth="1.5" />
				<line x1="154" y1="88" x2="185" y2="115" stroke="#3B8FE8" strokeWidth="1.5" />
				<rect x="185" y="30" width="55" height="30" rx="5" stroke="#EAB308" strokeWidth="2" fill="rgba(234,179,8,0.12)" />
				<text x="212" y="50" textAnchor="middle" fill="#EAB308" fontSize="8" fontFamily="sans-serif">⚠ Risk</text>
				<rect x="185" y="100" width="55" height="30" rx="5" stroke="#3B8FE8" strokeWidth="1.5" fill="rgba(59,143,232,0.08)" />
				<line x1="240" y1="45" x2="270" y2="80" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="4" />
				<line x1="240" y1="115" x2="270" y2="80" stroke="#3B8FE8" strokeWidth="1.5" />
				<circle cx="285" cy="80" r="10" stroke="#3B8FE8" strokeWidth="3" fill="rgba(59,143,232,0.15)" />
			</svg>
			<div className="flex gap-4 text-xs">
				<span className="flex items-center gap-1 text-[#EAB308]"><span className="inline-block h-2 w-2 rounded-full bg-[#EAB308]" /> High risk</span>
				<span className="flex items-center gap-1 text-[#3B8FE8]"><span className="inline-block h-2 w-2 rounded-full bg-[#3B8FE8]" /> Normal</span>
			</div>
		</div>
	);
}

function DocumentMockup() {
	return (
		<div className="flex flex-col gap-4 py-6">
			<div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
				<div className="bg-[#3B8FE8]/10 px-4 py-2 text-xs font-semibold text-[#0A1428]">SIPOC — Order Management</div>
				<div className="grid grid-cols-5 text-[10px]">
					{[
						{ header: "Suppliers", items: ["Vendor DB", "Customer Portal", "ERP System"] },
						{ header: "Inputs", items: ["Order Data", "Payment Info", "Shipping Address"] },
						{ header: "Process", items: ["Validate", "Process", "Fulfill", "Deliver"] },
						{ header: "Outputs", items: ["Invoice", "Shipment", "Notification"] },
						{ header: "Customers", items: ["End User", "Finance Dept", "Logistics"] },
					].map((col) => (
						<div key={col.header} className="border-r border-[#E2E8F0] last:border-r-0 p-2">
							<div className="font-semibold text-[#0A1428] mb-1">{col.header}</div>
							{col.items.map((item) => (
								<div key={item} className="text-[#64748B] py-0.5">{item}</div>
							))}
						</div>
					))}
				</div>
			</div>
			<div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
				<div className="bg-[#EAB308]/10 px-4 py-2 text-xs font-semibold text-[#0A1428]">FMEA — Top Risks</div>
				<div className="text-[10px]">
					<div className="grid grid-cols-6 border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 font-semibold text-[#0A1428]">
						<span>Activity</span><span>Failure Mode</span><span>S</span><span>O</span><span>D</span><span>RPN</span>
					</div>
					{[
						["Validation", "Missing data", "7", "6", "4", "168"],
						["Processing", "Timeout", "9", "3", "8", "216"],
					].map((row) => (
						<div key={row[0]} className="grid grid-cols-6 px-3 py-1.5 text-[#64748B]">
							{row.map((cell) => <span key={cell}>{cell}</span>)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function MonitorMockup() {
	return (
		<div className="flex flex-col gap-4 py-6">
			<div className="grid grid-cols-3 gap-3">
				{[
					{ label: "Total Risks", value: "24", change: "+3", color: "#EF4444" },
					{ label: "Mitigated", value: "18", change: "+5", color: "#22C55E" },
					{ label: "Coverage", value: "92%", change: "+7%", color: "#3B8FE8" },
				].map((stat) => (
					<div key={stat.label} className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-center">
						<p className="text-[10px] text-[#94A3B8]">{stat.label}</p>
						<p className="text-xl font-bold text-[#0A1428]">{stat.value}</p>
						<p className="text-[10px] font-medium" style={{ color: stat.color }}>{stat.change}</p>
					</div>
				))}
			</div>
			<div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
				<p className="text-[10px] font-semibold text-[#0A1428] mb-2">Risk Trend (Last 6 months)</p>
				<svg viewBox="0 0 280 60" className="w-full">
					<polyline points="0,50 47,42 94,38 141,30 188,22 235,18 280,12" stroke="#3B8FE8" strokeWidth="2" fill="none" />
					<polyline points="0,55 47,48 94,45 141,40 188,35 235,30 280,25" stroke="#EAB308" strokeWidth="1.5" fill="none" strokeDasharray="4" />
					<polyline points="0,10 47,15 94,12 141,18 188,14 235,10 280,8" stroke="#94A3B8" strokeWidth="1" fill="none" strokeDasharray="2" />
				</svg>
			</div>
		</div>
	);
}

const MOCKUPS: Record<string, () => React.JSX.Element> = {
	discover: DiscoverMockup,
	analyze: AnalyzeMockup,
	document: DocumentMockup,
	monitor: MonitorMockup,
};

export function ProductShowcaseSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const [activeTab, setActiveTab] = useState<string>("discover");
	const mockupRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;
			gsap.from(".showcase-header > *", {
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

	function handleTabChange(tabId: string) {
		if (tabId === activeTab || !mockupRef.current) return;
		setActiveTab(tabId);
		gsap.to(mockupRef.current, {
			opacity: 0,
			y: 10,
			duration: 0.2,
			onComplete: () => {
				gsap.fromTo(
					mockupRef.current,
					{ opacity: 0, y: -10 },
					{ opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
				);
			},
		});
	}

	return (
		<section ref={sectionRef} className="py-16 sm:py-20 lg:py-28 bg-white">
			<div className="container max-w-5xl">
				<div className="showcase-header mb-10 sm:mb-14 text-center">
					<small className="font-medium text-xs uppercase tracking-widest text-[#3B8FE8] mb-4 block">
						{t("home.showcase.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-[#0A1428]">
						{t("home.showcase.title")}
					</h2>
					<p className="mt-4 text-[#64748B] text-base sm:text-lg max-w-2xl mx-auto">
						{t("home.showcase.subtitle")}
					</p>
				</div>

				{/* Tabs */}
				<div className="flex justify-center mb-8">
					<div className="inline-flex rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
						{TABS.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									onClick={() => handleTabChange(tab.id)}
									className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
										isActive
											? "bg-white text-[#0A1428] shadow-sm"
											: "text-[#64748B] hover:text-[#0A1428]"
									}`}
								>
									<Icon className="size-4" strokeWidth={isActive ? 2 : 1.5} />
									{t(`home.${tab.labelKey}`)}
								</button>
							);
						})}
					</div>
				</div>

				{/* Browser mockup */}
				<div className="mx-auto max-w-3xl rounded-2xl border border-[#E2E8F0] bg-white shadow-xl shadow-[#0A1428]/5 overflow-hidden">
					{/* Browser chrome */}
					<div className="flex items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
						<div className="flex gap-1.5">
							<div className="size-3 rounded-full bg-[#FF5F57]" />
							<div className="size-3 rounded-full bg-[#FEBC2E]" />
							<div className="size-3 rounded-full bg-[#28C840]" />
						</div>
						<div className="flex-1 mx-8">
							<div className="h-6 rounded-lg bg-white border border-[#E2E8F0] max-w-[280px] mx-auto flex items-center justify-center text-[10px] text-[#94A3B8]">
								app.auditora.ai
							</div>
						</div>
					</div>
					{/* Content */}
					<div ref={mockupRef} className="min-h-[280px] px-4 sm:px-8">
						{Object.entries(MOCKUPS).map(([id, Comp]) => (
							<div key={id} className={activeTab === id ? "block" : "hidden"}>
								<Comp />
							</div>
						))}
					</div>
				</div>

				{/* CTA */}
				<div className="mt-10 text-center">
					<Button size="lg" variant="primary" asChild className="bg-[#3B8FE8] hover:bg-[#2E7FD6] text-[#0A1428]">
						<a href={`${config.saasUrl}/scan`}>
							{t("home.showcase.cta")}
							<ArrowRightIcon className="ml-2 size-4" />
						</a>
					</Button>
				</div>
			</div>
		</section>
	);
}
