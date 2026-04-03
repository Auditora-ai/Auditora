"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	Activity,
	Braces,
	FileDown,
	Flame,
	MessageSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
	{
		id: "process",
		span: "md:col-span-2",
		icon: Activity,
		titleKey: "bento.process.title",
		descKey: "bento.process.description",
		visual: "sipoc",
	},
	{
		id: "bpmn",
		span: "md:col-span-2",
		icon: Braces,
		titleKey: "bento.bpmn.title",
		descKey: "bento.bpmn.description",
		visual: "bpmn",
	},
	{
		id: "fmea",
		span: "md:col-span-1",
		icon: Flame,
		titleKey: "bento.fmea.title",
		descKey: "bento.fmea.description",
		visual: "heatmap",
	},
	{
		id: "elicitation",
		span: "md:col-span-1",
		icon: MessageSquare,
		titleKey: "bento.elicitation.title",
		descKey: "bento.elicitation.description",
		visual: "chat",
	},
	{
		id: "export",
		span: "md:col-span-2",
		icon: FileDown,
		titleKey: "bento.export.title",
		descKey: "bento.export.description",
		visual: "formats",
	},
] as const;

function SipocVisual() {
	return (
		<div className="mt-4 flex flex-col gap-1.5">
			{[
				{ label: "S", color: "#3B8FE8", items: ["Supplier A", "Supplier B"] },
				{ label: "I", color: "#38BDF8", items: ["Data", "Materials"] },
				{ label: "P", color: "#A78BFA", items: ["Process A", "Process B", "Process C"] },
				{ label: "O", color: "#FB923C", items: ["Reports", "Products"] },
				{ label: "C", color: "#F472B6", items: ["Customer", "Regulator"] },
			].map((row) => (
				<div key={row.label} className="flex items-center gap-2">
					<span
						className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
						style={{ backgroundColor: row.color }}
					>
						{row.label}
					</span>
					<div className="flex flex-wrap gap-1">
						{row.items.map((item) => (
							<span
								key={item}
								className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70"
							>
								{item}
							</span>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function BpmnVisual() {
	return (
		<svg viewBox="0 0 400 120" className="mt-4 w-full" fill="none">
			<circle cx="20" cy="60" r="12" stroke="#3B8FE8" strokeWidth="2" fill="rgba(59,143,232,0.15)" />
			<line x1="32" y1="60" x2="70" y2="60" stroke="#3B8FE8" strokeWidth="1.5" />
			<rect x="70" y="42" width="70" height="36" rx="6" stroke="#3B8FE8" strokeWidth="1.5" fill="rgba(59,143,232,0.08)" />
			<text x="105" y="65" textAnchor="middle" fill="#3B8FE8" fontSize="10" fontFamily="monospace">Task</text>
			<line x1="140" y1="60" x2="165" y2="60" stroke="#3B8FE8" strokeWidth="1.5" />
			<rect x="160" y="48" width="18" height="18" rx="3" transform="rotate(45 169 57)" stroke="#3B8FE8" strokeWidth="1.5" fill="rgba(59,143,232,0.08)" />
			<line x1="182" y1="48" x2="220" y2="30" stroke="#3B8FE8" strokeWidth="1.5" />
			<line x1="182" y1="68" x2="220" y2="90" stroke="#3B8FE8" strokeWidth="1.5" />
			<rect x="220" y="14" width="70" height="32" rx="6" stroke="#38BDF8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)" />
			<text x="255" y="35" textAnchor="middle" fill="#38BDF8" fontSize="9" fontFamily="monospace">Path A</text>
			<rect x="220" y="74" width="70" height="32" rx="6" stroke="#A78BFA" strokeWidth="1.5" fill="rgba(167,139,250,0.08)" />
			<text x="255" y="95" textAnchor="middle" fill="#A78BFA" fontSize="9" fontFamily="monospace">Path B</text>
			<line x1="290" y1="30" x2="330" y2="60" stroke="#38BDF8" strokeWidth="1.5" />
			<line x1="290" y1="90" x2="330" y2="60" stroke="#A78BFA" strokeWidth="1.5" />
			<circle cx="345" cy="60" r="12" stroke="#3B8FE8" strokeWidth="3" fill="rgba(59,143,232,0.15)" />
			<line x1="357" y1="60" x2="380" y2="60" stroke="#3B8FE8" strokeWidth="1.5" />
			<rect x="360" y="42" width="35" height="36" rx="4" stroke="#FB923C" strokeWidth="1.5" fill="rgba(251,146,60,0.08)" />
			<text x="377" y="64" textAnchor="middle" fill="#FB923C" fontSize="7" fontFamily="monospace">End</text>
		</svg>
	);
}

function HeatmapVisual() {
	const cells = [
		[9, 3, 7, 4, 6],
		[8, 5, 9, 3, 2],
		[4, 7, 8, 6, 5],
		[3, 2, 5, 9, 7],
	];
	const getColor = (v: number) => {
		if (v >= 8) return "rgba(239,68,68,0.7)";
		if (v >= 6) return "rgba(251,146,60,0.6)";
		if (v >= 4) return "rgba(234,179,8,0.5)";
		return "rgba(34,197,94,0.4)";
	};
	return (
		<div className="mt-4 grid grid-cols-5 gap-1">
			{cells.flat().map((v, i) => (
				<div
					key={i}
					className="flex h-8 w-full items-center justify-center rounded text-xs font-bold text-white/80"
					style={{ backgroundColor: getColor(v) }}
				>
					{v}
				</div>
			))}
		</div>
	);
}

function ChatVisual() {
	return (
		<div className="mt-4 space-y-2">
			<div className="flex justify-end">
				<div className="rounded-xl rounded-tr-sm bg-[#3B8FE8]/20 px-3 py-1.5 text-xs text-[#3B8FE8]">
					"Analiza el proceso de onboarding"
				</div>
			</div>
			<div className="flex justify-start">
				<div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white/10 px-3 py-1.5 text-xs text-white/70">
					He identificado 5 actividades. Mencionaste 3 proveedores pero solo 1 input. ¿Quién más provee información a este paso?
				</div>
			</div>
			<div className="flex justify-end">
				<div className="rounded-xl rounded-tr-sm bg-[#3B8FE8]/20 px-3 py-1.5 text-xs text-[#3B8FE8]">
					"Recursos humanos y el sistema ERP"
				</div>
			</div>
			<div className="flex justify-start">
				<div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white/10 px-3 py-1.5 text-xs text-white/70">
					Actualizado. Ahora el diagrama muestra 7 nodos con 2 inputs correctos.
				</div>
			</div>
		</div>
	);
}

function FormatsVisual() {
	const formats = [
		{ label: "BPMN XML", color: "#3B8FE8" },
		{ label: "PDF", color: "#38BDF8" },
		{ label: "PNG", color: "#A78BFA" },
		{ label: "HTML Report", color: "#FB923C" },
		{ label: "SIPOC Table", color: "#F472B6" },
		{ label: "FMEA Matrix", color: "#EAB308" },
	];
	return (
		<div className="mt-4 flex flex-wrap gap-2">
			{formats.map((f) => (
				<span
					key={f.label}
					className="rounded-lg border px-3 py-1.5 text-xs font-medium"
					style={{
						borderColor: `${f.color}40`,
						color: f.color,
						backgroundColor: `${f.color}15`,
					}}
				>
					{f.label}
				</span>
			))}
		</div>
	);
}

const VISUALS: Record<string, () => React.JSX.Element> = {
	sipoc: SipocVisual,
	bpmn: BpmnVisual,
	heatmap: HeatmapVisual,
	chat: ChatVisual,
	formats: FormatsVisual,
};

export function BentoFeatureSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;
			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});
			tl.from(".bento-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});
			tl.from(
				".bento-card",
				{
					opacity: 0,
					y: 40,
					scale: 0.97,
					stagger: 0.12,
					duration: 0.7,
					ease: "power3.out",
				},
				"-=0.3",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="py-16 sm:py-20 lg:py-28 bg-[#0A1428]"
		>
			<div className="container max-w-6xl">
				<div className="bento-header mb-10 sm:mb-14 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-widest text-[#3B8FE8] mb-4 block">
						{t("home.bento.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white">
						{t("home.bento.title")}
					</h2>
					<p className="mt-4 text-[#94A3B8] text-base sm:text-lg max-w-2xl mx-auto">
						{t("home.bento.subtitle")}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5">
					{FEATURES.map((feature) => {
						const Icon = feature.icon;
						const Visual = VISUALS[feature.visual];
						return (
							<div
								key={feature.id}
								className={`bento-card rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-6 transition-all duration-300 hover:border-[#3B8FE8]/30 hover:bg-white/[0.07] ${feature.span}`}
							>
								<div className="flex items-center gap-3 mb-3">
									<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3B8FE8]/15">
										<Icon className="size-4.5 text-[#3B8FE8]" strokeWidth={1.5} />
									</div>
									<h3 className="font-display text-base sm:text-lg font-semibold text-white">
										{t(`home.${feature.titleKey}`)}
									</h3>
								</div>
								<p className="text-sm text-[#94A3B8] leading-relaxed mb-2">
									{t(`home.${feature.descKey}`)}
								</p>
								{Visual && <Visual />}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
