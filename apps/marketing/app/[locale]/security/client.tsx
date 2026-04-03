"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
	Lock,
	Server,
	ShieldCheck,
	KeyRound,
	FileCheck2,
	Globe,
	AlertTriangle,
	Bug,
	Code2,
	Mail,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const cardVariants = {
	hidden: { opacity: 0, y: 28 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.08, ease },
	}),
};

function SecuritySection({
	icon: Icon,
	titleKey,
	textKey,
	items,
	index,
	t,
}: {
	icon: React.ComponentType<{ className?: string }>;
	titleKey: string;
	textKey: string;
	items: string[];
	index: number;
	t: (key: string) => string;
}) {
	return (
		<motion.div
			custom={index}
			variants={cardVariants}
			className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8 hover:border-[#00E5C0]/30 transition-colors"
		>
			<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#00E5C0]/10 text-[#00E5C0] mb-5">
				<Icon className="w-6 h-6" />
			</div>
			<h3 className="font-display text-xl font-semibold mb-3">
				{t(titleKey)}
			</h3>
			<p className="text-white/60 text-sm leading-relaxed mb-5">
				{t(textKey)}
			</p>
			<ul className="space-y-2.5">
				{items.map((item) => (
					<li key={item} className="flex items-start gap-2.5 text-sm">
						<span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#00E5C0]" />
						<span className="text-white/50">{t(item)}</span>
					</li>
				))}
			</ul>
		</motion.div>
	);
}

const sections = [
	{
		icon: Lock,
		titleKey: "encryptionTitle",
		textKey: "encryptionText",
		items: ["encryptionInTransit", "encryptionAtRest", "encryptionKeys"],
	},
	{
		icon: Server,
		titleKey: "infrastructureTitle",
		textKey: "infrastructureText",
		items: [
			"infraRailway",
			"infraSupabase",
			"infraBackups",
			"infraMonitoring",
		],
	},
	{
		icon: ShieldCheck,
		titleKey: "accessTitle",
		textKey: "accessText",
		items: ["accessRbac", "accessOrg", "accessAudit", "accessLeast"],
	},
	{
		icon: KeyRound,
		titleKey: "authTitle",
		textKey: "authText",
		items: ["authPasskeys", "authMagic", "authOauth", "authSession"],
	},
	{
		icon: FileCheck2,
		titleKey: "complianceTitle",
		textKey: "complianceText",
		items: [
			"complianceSoc2",
			"complianceGdpr",
			"complianceCcpa",
			"complianceReview",
		],
	},
	{
		icon: Globe,
		titleKey: "residencyTitle",
		textKey: "residencyText",
		items: ["residencyRegion", "residencyProvider", "residencyIsolation"],
	},
	{
		icon: AlertTriangle,
		titleKey: "incidentTitle",
		textKey: "incidentText",
		items: [
			"incidentPlan",
			"incidentNotify",
			"incidentPostmortem",
			"incidentDrills",
		],
	},
	{
		icon: Bug,
		titleKey: "disclosureTitle",
		textKey: "disclosureText",
		items: [
			"disclosureEmail",
			"disclosureResponse",
			"disclosureCredit",
			"disclosureNoLegal",
		],
	},
	{
		icon: Code2,
		titleKey: "practicesTitle",
		textKey: "practicesText",
		items: [
			"practicesDeps",
			"practicesReview",
			"practicesCi",
			"practicesPen",
			"practicesTraining",
		],
	},
];

export function SecurityClient() {
	const t = useTranslations("security");

	return (
		<div data-landing className="dark bg-[#0A1428] text-slate-50">
			{/* Hero */}
			<section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
				<div className="absolute inset-0 bg-gradient-to-b from-[#00E5C0]/5 to-transparent" />
				<div className="container relative max-w-4xl text-center">
					<motion.span
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease }}
						className="inline-flex items-center rounded-full bg-[#00E5C0]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00E5C0] mb-6"
					>
						{t("heroLabel")}
					</motion.span>
					<motion.h1
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.1, ease }}
						className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
					>
						{t("title")}
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2, ease }}
						className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
					>
						{t("subtitle")}
					</motion.p>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5, delay: 0.3, ease }}
						className="mt-4 text-sm text-white/40"
					>
						{t("lastUpdated")}
					</motion.p>
				</div>
			</section>

			{/* Security sections grid */}
			<section className="py-16 sm:py-24">
				<div className="container max-w-6xl">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-40px" }}
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
					>
						{sections.map((section, i) => (
							<SecuritySection
								key={section.titleKey}
								icon={section.icon}
								titleKey={section.titleKey}
								textKey={section.textKey}
								items={section.items}
								index={i}
								t={t}
							/>
						))}
					</motion.div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-16 sm:py-24 bg-[#111827]">
				<div className="container max-w-3xl text-center">
					<motion.div
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.6, ease }}
						className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 sm:p-12"
					>
						<div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00E5C0]/10 text-[#00E5C0] mx-auto mb-6">
							<Mail className="w-7 h-7" />
						</div>
						<h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
							{t("contactTitle")}
						</h2>
						<p className="text-white/60 text-base leading-relaxed mb-8 max-w-lg mx-auto">
							{t("contactText")}
						</p>
						<a
							href={`mailto:${t("contactEmail")}`}
							className="inline-flex items-center justify-center rounded-full bg-[#00E5C0] px-8 py-3.5 text-sm font-semibold text-[#0A1428] hover:bg-[#00E5C0]/90 transition-colors"
						>
							{t("contactButton")}
						</a>
					</motion.div>
				</div>
			</section>
		</div>
	);
}
