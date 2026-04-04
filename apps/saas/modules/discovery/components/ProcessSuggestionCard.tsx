"use client";

import { cn } from "@repo/ui";
import { useRef, useState } from "react";
import type { SuggestedProcess, ProcessCategory } from "@discovery/hooks/use-discovery-chat";

// ────────────────────────────────────────────────────────────────────────────
// Category styling
// ────────────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
	ProcessCategory,
	{ label: string; bg: string; text: string; border: string }
> = {
	estrategico: {
		label: "Estratégico",
		bg: "bg-blue-500/10",
		text: "text-blue-600 dark:text-blue-400",
		border: "border-blue-500/20",
	},
	operativo: {
		label: "Operativo",
		bg: "bg-emerald-500/10",
		text: "text-emerald-600 dark:text-emerald-400",
		border: "border-emerald-500/20",
	},
	soporte: {
		label: "Soporte",
		bg: "bg-amber-500/10",
		text: "text-amber-600 dark:text-amber-400",
		border: "border-amber-500/20",
	},
};

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

interface ProcessSuggestionCardProps {
	process: SuggestedProcess;
	onToggleConfirm: (id: string) => void;
	onToggleCritical: (id: string) => void;
	onRemove: (id: string) => void;
	onRestore: (id: string) => void;
}

export function ProcessSuggestionCard({
	process,
	onToggleConfirm,
	onToggleCritical,
	onRemove,
	onRestore,
}: ProcessSuggestionCardProps) {
	const category = CATEGORY_CONFIG[process.category];
	const touchStartX = useRef(0);
	const [swipeOffset, setSwipeOffset] = useState(0);
	const [swiping, setSwiping] = useState(false);

	// Swipe to remove
	const handleTouchStart = (e: React.TouchEvent) => {
		const touch = e.touches[0];
		if (touch) {
			touchStartX.current = touch.clientX;
			setSwiping(true);
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!swiping) return;
		const touch = e.touches[0];
		if (!touch) return;
		const diff = touch.clientX - touchStartX.current;
		// Only allow left swipe
		if (diff < 0) {
			setSwipeOffset(Math.max(diff, -120));
		}
	};

	const handleTouchEnd = () => {
		setSwiping(false);
		if (swipeOffset < -80) {
			onRemove(process.id);
		}
		setSwipeOffset(0);
	};

	if (process.removed) {
		return (
			<div className="flex items-center justify-between rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 px-4 py-3 animate-[fadeSlideIn_0.3s_ease-out]">
				<span className="text-sm text-muted-foreground line-through">
					{process.name}
				</span>
				<button
					type="button"
					onClick={() => onRestore(process.id)}
					className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-xs font-medium text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors"
				>
					Restaurar
				</button>
			</div>
		);
	}

	return (
		<div className="relative overflow-hidden rounded-xl">
			{/* Swipe-behind delete indicator */}
			<div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center rounded-r-xl bg-destructive/10">
				<svg
					className="h-5 w-5 text-destructive"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M3 6h18" />
					<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
					<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
				</svg>
			</div>

			<div
				className={cn(
					"relative rounded-xl border bg-card shadow-sm transition-all duration-200",
					process.confirmed
						? "border-primary/20 shadow-primary/5"
						: "border-border",
					process.critical && "ring-2 ring-amber-500/30",
				)}
				style={{
					transform: swiping ? `translateX(${swipeOffset}px)` : "translateX(0)",
					transition: swiping ? "none" : "transform 0.3s ease-out",
				}}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<div className="p-4">
					{/* Top: category badge + critical star */}
					<div className="mb-2 flex items-center justify-between">
						<span
							className={cn(
								"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
								category.bg,
								category.text,
								category.border,
							)}
						>
							{category.label}
						</span>

						{process.critical && (
							<span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-500">
								<svg
									className="h-3.5 w-3.5 fill-amber-500"
									viewBox="0 0 24 24"
								>
									<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
								</svg>
								Crítico
							</span>
						)}
					</div>

					{/* Title */}
					<h4 className="text-sm font-semibold text-foreground">
						{process.name}
					</h4>
					<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
						{process.description}
					</p>

					{/* Action buttons */}
					<div className="mt-3 flex items-center gap-2">
						{/* Confirm toggle */}
						<button
							type="button"
							onClick={() => onToggleConfirm(process.id)}
							className={cn(
								"flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.97]",
								process.confirmed
									? "border-primary/30 bg-primary/10 text-primary"
									: "border-border bg-background text-muted-foreground hover:bg-muted",
							)}
						>
							{process.confirmed ? (
								<>
									<svg
										className="h-4 w-4"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
									Incluido
								</>
							) : (
								<>
									<svg
										className="h-4 w-4"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<line x1="12" y1="5" x2="12" y2="19" />
										<line x1="5" y1="12" x2="19" y2="12" />
									</svg>
									Incluir
								</>
							)}
						</button>

						{/* Critical toggle */}
						<button
							type="button"
							onClick={() => onToggleCritical(process.id)}
							className={cn(
								"flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition-all active:scale-[0.97]",
								process.critical
									? "border-amber-500/30 bg-amber-500/10"
									: "border-border bg-background hover:bg-muted",
							)}
							title="Marcar como crítico"
						>
							<svg
								className={cn(
									"h-4 w-4 transition-colors",
									process.critical
										? "fill-amber-500 text-amber-500"
										: "fill-none text-muted-foreground",
								)}
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
							</svg>
						</button>

						{/* Remove */}
						<button
							type="button"
							onClick={() => onRemove(process.id)}
							className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive active:scale-[0.97]"
							title="Eliminar proceso"
						>
							<svg
								className="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
