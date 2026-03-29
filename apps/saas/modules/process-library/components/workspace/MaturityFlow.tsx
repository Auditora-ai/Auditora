"use client";

import { CheckIcon } from "lucide-react";

const MATURITY_STEPS = [
	{ key: "DRAFT", label: "Draft" },
	{ key: "MAPPED", label: "Mapped" },
	{ key: "VALIDATED", label: "Validated" },
	{ key: "APPROVED", label: "Approved" },
] as const;

interface MaturityFlowProps {
	currentStatus: string;
	onStatusChange: (status: string) => void;
	hasBpmn: boolean;
	hasRaci: boolean;
}

export function MaturityFlow({ currentStatus, onStatusChange, hasBpmn, hasRaci }: MaturityFlowProps) {
	const currentIndex = MATURITY_STEPS.findIndex((s) => s.key === currentStatus);

	const canTransitionTo = (key: string): boolean => {
		switch (key) {
			case "DRAFT": return true;
			case "MAPPED": return hasBpmn;
			case "VALIDATED": return hasBpmn && hasRaci;
			case "APPROVED": return hasBpmn && hasRaci;
			default: return false;
		}
	};

	return (
		<div className="flex items-center gap-0.5">
			{MATURITY_STEPS.map((step, i) => {
				const isActive = step.key === currentStatus;
				const isPast = i < currentIndex;
				const canClick = canTransitionTo(step.key) && step.key !== currentStatus;

				return (
					<button
						key={step.key}
						type="button"
						onClick={() => canClick && onStatusChange(step.key)}
						disabled={!canClick}
						className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
							isActive
								? "bg-primary text-white"
								: isPast
									? "bg-blue-100 text-blue-800"
									: canClick
										? "bg-muted text-muted-foreground hover:bg-border cursor-pointer"
										: "bg-secondary text-muted-foreground/50 cursor-not-allowed"
						}`}
						title={
							!canClick && step.key === "MAPPED" ? "Requiere diagrama BPMN" :
							!canClick && step.key === "VALIDATED" ? "Requiere RACI" :
							undefined
						}
					>
						{isPast && <CheckIcon className="h-3.5 w-3.5" />}
						{step.label}
					</button>
				);
			})}
		</div>
	);
}
