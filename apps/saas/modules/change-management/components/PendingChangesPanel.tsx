"use client";

import { ClipboardCheckIcon } from "lucide-react";
import { usePendingChanges } from "@change-management/hooks/use-pending-changes";
import { ChangeConfirmationCard } from "./ChangeConfirmationCard";

interface PendingChangesPanelProps {
	organizationId: string | undefined;
}

export function PendingChangesPanel({
	organizationId,
}: PendingChangesPanelProps) {
	const { pendingChanges, isLoading, confirm, isConfirming } =
		usePendingChanges(organizationId);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="size-5 animate-spin rounded-full border-2 border-slate-600 border-t-[#00E5C0]" />
			</div>
		);
	}

	if (pendingChanges.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-sm font-medium text-amber-400">
				<ClipboardCheckIcon className="size-4" />
				<span>
					{pendingChanges.length} cambio{pendingChanges.length !== 1 ? "s" : ""}{" "}
					pendiente{pendingChanges.length !== 1 ? "s" : ""} de confirmación
				</span>
			</div>

			<div className="space-y-2">
				{pendingChanges.map((change) => (
					<ChangeConfirmationCard
						key={change.responseId}
						change={change}
						onConfirm={(id, comment) =>
							confirm({ changeConfirmationId: id, comment })
						}
						isConfirming={isConfirming}
					/>
				))}
			</div>
		</div>
	);
}
