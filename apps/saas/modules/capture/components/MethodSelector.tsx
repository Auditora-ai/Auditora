"use client";

import { useState } from "react";
import { MessageSquareTextIcon, FileTextIcon, VideoIcon, CrownIcon } from "lucide-react";
import { cn } from "@repo/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CaptureMethod = "chat" | "document" | "recording";

interface MethodSelectorProps {
	onSelect: (method: CaptureMethod) => void;
}

// ─── Method cards config ─────────────────────────────────────────────────────

const METHODS: Array<{
	id: CaptureMethod;
	icon: typeof MessageSquareTextIcon;
	title: string;
	description: string;
	isPrimary?: boolean;
	isPremium?: boolean;
}> = [
	{
		id: "chat",
		icon: MessageSquareTextIcon,
		title: "Quiero platicarlo",
		description: "La IA te guía con preguntas SIPOC",
		isPrimary: true,
	},
	{
		id: "document",
		icon: FileTextIcon,
		title: "Tengo un documento",
		description: "Sube PDF o Word del procedimiento",
	},
	{
		id: "recording",
		icon: VideoIcon,
		title: "Grabarlo en junta",
		description: "El bot escucha y documenta",
		isPremium: true,
	},
];

// ─── Component ───────────────────────────────────────────────────────────────

export function MethodSelector({ onSelect }: MethodSelectorProps) {
	const [selected, setSelected] = useState<CaptureMethod | null>(null);

	function handleSelect(method: CaptureMethod) {
		if (method === "recording") return; // Premium locked
		setSelected(method);
		// Small delay for visual feedback before transitioning
		setTimeout(() => onSelect(method), 200);
	}

	return (
		<div className="flex flex-col gap-3">
			<h2
				className="text-base font-semibold mb-1"
				style={{ color: "#0A1428" }}
			>
				¿Cómo quieres capturar este proceso?
			</h2>

			{METHODS.map((method) => {
				const Icon = method.icon;
				const isSelected = selected === method.id;
				const isLocked = method.isPremium;

				return (
					<button
						key={method.id}
						onClick={() => handleSelect(method.id)}
						disabled={isLocked}
						className={cn(
							"relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all active:scale-[0.98]",
							isLocked && "opacity-60 cursor-not-allowed",
							isSelected && "ring-2",
						)}
						style={{
							minHeight: "80px",
							backgroundColor: isSelected
								? "#EFF6FF"
								: method.isPrimary
									? "#FFFFFF"
									: "#FFFFFF",
							borderColor: isSelected
								? "#3B8FE8"
								: method.isPrimary
									? "#3B8FE8"
									: "#E2E8F0",
							...(isSelected ? { ringColor: "#3B8FE8" } : {}),
							boxShadow: method.isPrimary
								? "0 2px 8px rgba(59,143,232,0.12)"
								: "0 1px 3px rgba(0,0,0,0.04)",
						}}
					>
						<div
							className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
							style={{
								backgroundColor: method.isPrimary ? "#EFF6FF" : "#F8FAFC",
							}}
						>
							<Icon
								className="size-5"
								style={{ color: method.isPrimary ? "#3B8FE8" : "#64748B" }}
							/>
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<span
									className="text-sm font-semibold"
									style={{ color: "#0A1428" }}
								>
									{method.title}
								</span>
								{method.isPremium && (
									<span
										className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
										style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
									>
										<CrownIcon className="size-2.5" />
										Premium
									</span>
								)}
							</div>
							<p
								className="mt-0.5 text-xs"
								style={{ color: "#64748B" }}
							>
								{method.description}
							</p>
						</div>
						{method.isPrimary && (
							<div
								className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
								style={{ backgroundColor: "#3B8FE8" }}
							>
								<span className="text-[10px] font-bold">★</span>
							</div>
						)}
					</button>
				);
			})}
		</div>
	);
}
