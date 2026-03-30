"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	CheckCircle2Icon,
	Loader2Icon,
	ArrowRightIcon,
	DownloadIcon,
	SparklesIcon,
	NetworkIcon,
	LayersIcon,
	ArrowRightLeftIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface DeliverableResult {
	type: string;
	status: "pending" | "running" | "completed" | "failed";
	error?: string;
}

interface StepEntregablesProps {
	deliverables: DeliverableResult[];
	organizationSlug: string;
}

const DELIVERABLE_META: Record<string, { icon: React.ElementType; label: string; path: string }> = {
	value_chain: { icon: NetworkIcon, label: "Cadena de Valor", path: "deliverables/process-cards" },
	landscape: { icon: LayersIcon, label: "Mapa de Procesos", path: "deliverables/process-map" },
	horizontal_view: { icon: ArrowRightLeftIcon, label: "Vista Horizontal", path: "deliverables/horizontal-view" },
};

export function StepEntregables({ deliverables, organizationSlug }: StepEntregablesProps) {
	const tv = useTranslations("scan");
	const confettiFired = useRef(false);

	const allComplete = deliverables.every((d) => d.status === "completed" || d.status === "failed");
	const anyComplete = deliverables.some((d) => d.status === "completed");

	// Fire confetti when all complete
	useEffect(() => {
		if (allComplete && anyComplete && !confettiFired.current) {
			confettiFired.current = true;

			toast.success(tv("discovery.deliverablesReady"), {
				icon: <SparklesIcon className="size-4" />,
			});

			import("canvas-confetti").then((mod) => {
				mod.default({
					particleCount: 80,
					spread: 70,
					origin: { y: 0.6 },
					colors: ["#00E5C0", "#D97706", "#3B82F6", "#16A34A"],
				});
			}).catch(() => {});
		}
	}, [allComplete, anyComplete, tv]);

	return (
		<div className="mx-auto w-full max-w-lg space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
			<div className="space-y-1">
				<h2 className="text-2xl md:text-3xl font-display text-foreground tracking-tight">
					{allComplete ? tv("discovery.deliverablesTitle") : tv("discovery.generatingTitle")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{allComplete ? tv("discovery.deliverablesDesc") : tv("discovery.generatingDesc")}
				</p>
			</div>

			{/* Deliverable status cards */}
			<div className="space-y-3">
				{deliverables.map((d) => {
					const meta = DELIVERABLE_META[d.type];
					if (!meta) return null;
					const Icon = meta.icon;

					return (
						<div
							key={d.type}
							className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
								d.status === "completed"
									? "border-success/30 bg-success/5"
									: d.status === "failed"
										? "border-destructive/30 bg-destructive/5"
										: d.status === "running"
											? "border-orientation/30 bg-orientation-subtle/30"
											: "border-border bg-secondary"
							}`}
						>
							<div className={`flex size-10 items-center justify-center rounded-lg ${
								d.status === "completed" ? "bg-success/20" : "bg-secondary"
							}`}>
								{d.status === "running" ? (
									<Loader2Icon className="size-5 animate-spin text-orientation" />
								) : d.status === "completed" ? (
									<CheckCircle2Icon className="size-5 text-success" />
								) : d.status === "failed" ? (
									<Icon className="size-5 text-destructive" />
								) : (
									<Icon className="size-5 text-muted-foreground" />
								)}
							</div>

							<div className="flex-1">
								<p className="text-sm font-semibold text-foreground">{meta.label}</p>
								<p className="text-xs text-muted-foreground">
									{d.status === "completed" && tv("discovery.deliverableReady")}
									{d.status === "running" && tv("discovery.deliverableGenerating")}
									{d.status === "pending" && tv("discovery.deliverablePending")}
									{d.status === "failed" && (d.error || tv("discovery.deliverableFailed"))}
								</p>
							</div>

							{d.status === "completed" && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => (window.location.href = `/${organizationSlug}/${meta.path}`)}
									className="gap-1 text-xs"
								>
									Ver
									<ArrowRightIcon className="size-3" />
								</Button>
							)}
						</div>
					);
				})}
			</div>

			{/* Actions after completion */}
			{allComplete && anyComplete && (
				<div className="space-y-3 pt-4">
					<Button
						onClick={() => (window.location.href = `/${organizationSlug}`)}
						className="w-full gap-2"
					>
						{tv("discovery.goToDashboard")}
						<ArrowRightIcon className="size-4" />
					</Button>

					<Button
						variant="outline"
						onClick={() => window.open("/api/public/scan/report", "_blank")}
						className="w-full gap-2"
					>
						<DownloadIcon className="size-4" />
						{tv("discovery.downloadPdf")}
					</Button>
				</div>
			)}
		</div>
	);
}
