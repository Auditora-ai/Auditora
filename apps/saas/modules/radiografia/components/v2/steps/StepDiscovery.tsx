"use client";

import { useState, useCallback } from "react";
import { DiscoveryChat } from "../DiscoveryChat";
import { DiscoverySidebar } from "../DiscoverySidebar";

interface StepDiscoveryProps {
	organizationId: string;
	initialMessage?: string;
	onGenerateDeliverables: (types: string[]) => void;
	generating: boolean;
}

export function StepDiscovery({
	organizationId,
	initialMessage,
	onGenerateDeliverables,
	generating,
}: StepDiscoveryProps) {
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>(["value_chain", "landscape"]);

	const handleProcessAccepted = useCallback(() => {
		setRefreshTrigger((n) => n + 1);
	}, []);

	const handleProcessRejected = useCallback(() => {
		setRefreshTrigger((n) => n + 1);
	}, []);

	const handleToggleDeliverable = useCallback((type: string) => {
		setSelectedDeliverables((prev) =>
			prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
		);
	}, []);

	const handleGenerate = useCallback(() => {
		onGenerateDeliverables(selectedDeliverables);
	}, [selectedDeliverables, onGenerateDeliverables]);

	return (
		<div className="flex flex-1 overflow-hidden">
			<DiscoveryChat
				organizationId={organizationId}
				initialMessage={initialMessage}
				onProcessAccepted={handleProcessAccepted}
				onProcessRejected={handleProcessRejected}
			/>
			<DiscoverySidebar
				organizationId={organizationId}
				refreshTrigger={refreshTrigger}
				selectedDeliverables={selectedDeliverables}
				onToggleDeliverable={handleToggleDeliverable}
				onGenerateDeliverables={handleGenerate}
				generating={generating}
			/>
		</div>
	);
}
