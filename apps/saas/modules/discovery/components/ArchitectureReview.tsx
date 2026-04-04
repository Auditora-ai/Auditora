"use client";

import { Button } from "@repo/ui/components/button";
import { ProcessSuggestionCard } from "@discovery/components/ProcessSuggestionCard";
import type { SuggestedProcess, ProcessCategory } from "@discovery/hooks/use-discovery-chat";

// ────────────────────────────────────────────────────────────────────────────
// Category configuration
// ────────────────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: Array<{
	key: ProcessCategory;
	label: string;
	description: string;
	icon: React.ReactNode;
}> = [
	{
		key: "estrategico",
		label: "Procesos Estratégicos",
		description: "Definen la dirección y gobernanza de la organización",
		icon: (
			<svg
				className="h-5 w-5 text-blue-500"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<circle cx="12" cy="12" r="10" />
				<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
			</svg>
		),
	},
	{
		key: "operativo",
		label: "Procesos Operativos",
		description: "Generan valor directamente para el cliente",
		icon: (
			<svg
				className="h-5 w-5 text-emerald-500"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
			</svg>
		),
	},
	{
		key: "soporte",
		label: "Procesos de Soporte",
		description: "Proveen recursos y apoyo a los demás procesos",
		icon: (
			<svg
				className="h-5 w-5 text-amber-500"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
			</svg>
		),
	},
];

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

interface ArchitectureReviewProps {
	processes: SuggestedProcess[];
	onToggleConfirm: (id: string) => void;
	onToggleCritical: (id: string) => void;
	onRemove: (id: string) => void;
	onRestore: (id: string) => void;
	onConfirmArchitecture: () => void;
}

export function ArchitectureReview({
	processes,
	onToggleConfirm,
	onToggleCritical,
	onRemove,
	onRestore,
	onConfirmArchitecture,
}: ArchitectureReviewProps) {
	const activeProcesses = processes.filter((p) => p.confirmed && !p.removed);
	const criticalCount = processes.filter((p) => p.critical && !p.removed).length;

	return (
		<div className="flex min-h-full flex-col animate-[fadeSlideIn_0.5s_ease-out]">
			{/* Header */}
			<div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 px-4 pb-4 pt-4 backdrop-blur-sm">
				<h2 className="text-lg font-semibold text-foreground">
					Arquitectura de Procesos
				</h2>
				<p className="mt-1 text-xs text-muted-foreground">
					Revisa y personaliza los procesos sugeridos para tu
					organización
				</p>

				{/* Stats bar */}
				<div className="mt-3 flex items-center gap-3">
					<div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
						<svg
							className="h-3.5 w-3.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
						{activeProcesses.length} incluidos
					</div>
					{criticalCount > 0 && (
						<div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
							<svg
								className="h-3.5 w-3.5 fill-current"
								viewBox="0 0 24 24"
							>
								<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
							</svg>
							{criticalCount} críticos
						</div>
					)}
					<div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
						{processes.filter((p) => p.removed).length} removidos
					</div>
				</div>
			</div>

			{/* Process groups */}
			<div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
				{CATEGORY_ORDER.map((cat) => {
					const categoryProcesses = processes.filter(
						(p) => p.category === cat.key,
					);
					if (categoryProcesses.length === 0) return null;

					return (
						<div key={cat.key} className="mb-6">
							{/* Category header */}
							<div className="mb-3 flex items-center gap-2">
								{cat.icon}
								<div>
									<h3 className="text-sm font-semibold text-foreground">
										{cat.label}
									</h3>
									<p className="text-[11px] text-muted-foreground">
										{cat.description}
									</p>
								</div>
							</div>

							{/* Cards */}
							<div className="space-y-3">
								{categoryProcesses.map((process) => (
									<ProcessSuggestionCard
										key={process.id}
										process={process}
										onToggleConfirm={onToggleConfirm}
										onToggleCritical={onToggleCritical}
										onRemove={onRemove}
										onRestore={onRestore}
									/>
								))}
							</div>
						</div>
					);
				})}
			</div>

			{/* Sticky confirm button */}
			<div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/50 bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
				<Button
					variant="primary"
					size="lg"
					className="w-full text-base font-semibold"
					onClick={onConfirmArchitecture}
					disabled={activeProcesses.length === 0}
				>
					<svg
						className="mr-2 h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
					Confirmar arquitectura ({activeProcesses.length} procesos)
				</Button>
			</div>
		</div>
	);
}
