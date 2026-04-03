"use client";

import { config } from "@config";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import {
	ArrowRightIcon,
	BookOpenIcon,
	CalculatorIcon,
	FileTextIcon,
	GaugeIcon,
	GitBranchIcon,
	Grid3X3Icon,
	ShieldCheckIcon,
	SparklesIcon,
	TableIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { ToolConfig } from "@tools/tools-config";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
	GitBranch: GitBranchIcon,
	Table: TableIcon,
	Grid3X3: Grid3X3Icon,
	ShieldCheck: ShieldCheckIcon,
	FileText: FileTextIcon,
	Gauge: GaugeIcon,
	BookOpen: BookOpenIcon,
	Calculator: CalculatorIcon,
};

const cardVariants = {
	hidden: { opacity: 0, y: 24, scale: 0.97 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: 0.6,
			delay: i * 0.07,
			ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
		},
	}),
};

interface ToolsHubClientProps {
	tools: ToolConfig[];
	locale: string;
}

export function ToolsHubClient({ tools, locale }: ToolsHubClientProps) {
	const t = useTranslations("tools");

	return (
		<div className="dark bg-[#0A1428] text-slate-50 min-h-screen">
			{/* Hero */}
			<section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
				{/* Background orbs */}
				<div className="pointer-events-none absolute inset-0" aria-hidden="true">
					<motion.div
						animate={{
							x: [0, 15, -10, 0],
							y: [0, -20, -15, 0],
							scale: [1, 1.05, 0.98, 1],
						}}
						transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
						className="absolute -top-40 right-1/4 h-[400px] w-[400px] rounded-full bg-[#3B8FE8]/10 blur-[100px]"
					/>
				</div>

				<div className="container relative max-w-5xl">
					<motion.div
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.6,
							delay: 0.1,
							ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
						}}
						className="mb-6 flex justify-center"
					>
						<div
							className={cn(
								"badge-pulse inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium",
								"border-[#3B8FE8]/20 bg-[#3B8FE8]/10 text-[#3B8FE8]",
							)}
						>
							<SparklesIcon className="size-3.5" strokeWidth={2} />
							{t("badge")}
						</div>
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.8,
							delay: 0.2,
							ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
						}}
						className="font-display text-3xl sm:text-4xl lg:text-5xl text-white text-center max-w-3xl mx-auto leading-tight"
					>
						{t("title")}
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.7,
							delay: 0.35,
							ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
						}}
						className="mt-6 text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto text-center leading-relaxed"
					>
						{t("subtitle")}
					</motion.p>
				</div>
			</section>

			{/* Tool Grid */}
			<section className="pb-16 sm:pb-20 lg:pb-28">
				<div className="container max-w-5xl">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-40px" }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
					>
						{tools.map((tool, i) => {
							const Icon = ICON_MAP[tool.icon] || SparklesIcon;
							return (
								<motion.div
									key={tool.slug}
									custom={i}
									variants={cardVariants}
									whileHover={{
										y: -6,
										borderColor: "rgba(59,143,232,0.3)",
										transition: {
											type: "spring",
											stiffness: 300,
											damping: 20,
										},
									}}
								>
									<Link
										href={`/${locale}/tools/${tool.slug}`}
										className={cn(
											"group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-6 transition-colors duration-300",
											"hover:bg-white/[0.07]",
										)}
									>
										<div
											className={cn(
												"flex size-10 shrink-0 items-center justify-center rounded-xl",
												"bg-[#3B8FE8]/15 border border-[#3B8FE8]/20",
											)}
										>
											<Icon
												className="size-5 text-[#3B8FE8]"
												strokeWidth={1.5}
											/>
										</div>
										<div className="min-w-0 flex-1">
											<h3 className="text-base font-semibold text-white group-hover:text-[#3B8FE8] transition-colors duration-200">
												{locale === "es" ? tool.nameEs : tool.name}
											</h3>
											<p className="mt-1.5 text-sm text-[#94A3B8] leading-relaxed line-clamp-2">
												{locale === "es"
													? tool.descriptionEs
													: tool.description}
											</p>
											<span
												className={cn(
													"mt-3 inline-flex items-center gap-1.5 text-sm font-medium",
													"text-[#3B8FE8]/70 group-hover:text-[#3B8FE8] transition-colors duration-200",
												)}
											>
												{t("useFree")}
												<ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-1" />
											</span>
										</div>
									</Link>
								</motion.div>
							);
						})}
					</motion.div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative overflow-hidden border-t border-white/[0.06] py-16 sm:py-20 lg:py-28">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_60%,rgba(59,143,232,0.06),transparent_70%)]" />
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{
						duration: 0.7,
						ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
					}}
					className="container relative max-w-2xl text-center"
				>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white mb-4">
						{t("ctaTitle")}
					</h2>
					<p className="text-[#94A3B8] text-base sm:text-lg leading-relaxed mb-8">
						{t("ctaDescription")}
					</p>
					<Button
						size="lg"
						className="gap-2 bg-[#3B8FE8] hover:bg-[#2E7FD6] text-[#0A1428] font-semibold"
						asChild
					>
						<a href={`${config.saasUrl}/signup?ref=tools`}>
							{t("ctaButton")}
							<ArrowRightIcon className="size-4" />
						</a>
					</Button>
				</motion.div>
			</section>
		</div>
	);
}
