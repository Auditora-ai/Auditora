"use client";

import { useTranslations } from "next-intl";

interface Risk {
	title: string;
	description: string;
	riskType: string;
	severity: number;
	probability: number;
	affectedStep?: string;
	suggestedMitigations: string[];
	isOpportunity: boolean;
}

interface RiskCardProps {
	risk: Risk;
	index: number;
}

function scoreColor(severity: number, probability: number): string {
	const score = severity * probability;
	if (score >= 20) return "bg-destructive";
	if (score >= 12) return "bg-[#D97706]";
	if (score >= 6) return "bg-primary";
	return "bg-success";
}

export function RiskCard({ risk, index }: RiskCardProps) {
	const t = useTranslations("scan");
	const score = risk.severity * risk.probability;
	const colorClass = scoreColor(risk.severity, risk.probability);
	const label = score >= 20 ? t("critical") : score >= 12 ? t("high") : score >= 6 ? t("medium") : t("low");
	const riskTypeLabel = t(`riskTypes.${risk.riskType}` as any) || risk.riskType;

	return (
		<div
			className="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-border bg-background p-5"
			style={{
				animationDelay: `${index * 150}ms`,
				animationFillMode: "backwards",
			}}
		>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div className="flex-1">
					<div className="mb-1 flex items-center gap-2">
						<span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${colorClass}`}>
							{label} ({score})
						</span>
						<span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
							{riskTypeLabel}
						</span>
						{risk.isOpportunity && (
							<span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
								{t("opportunity")}
							</span>
						)}
					</div>
					<h3 className="text-base font-semibold text-foreground">
						{risk.title}
					</h3>
				</div>
			</div>

			<p className="mb-3 text-sm leading-relaxed text-muted-foreground">
				{risk.description}
			</p>

			{risk.affectedStep && (
				<p className="mb-3 text-xs text-muted-foreground">
					{t("affectedStep", { step: risk.affectedStep })}
				</p>
			)}

			{risk.suggestedMitigations.length > 0 && (
				<div>
					<p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{t("suggestedMitigations")}
					</p>
					<ul className="space-y-1">
						{risk.suggestedMitigations.map((m, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
								<span className="text-[#D97706]">&#x2022;</span>
								{m}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
