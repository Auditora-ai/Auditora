"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegenerateButton({
	sessionId,
	type,
	label,
}: {
	sessionId: string;
	type: string;
	label?: string;
}) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const handleRegenerate = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				`/api/sessions/${sessionId}/deliverables/${type}/retry`,
				{ method: "POST" },
			);
			if (res.ok) {
				router.refresh();
			}
		} catch {
			// Silent fail
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleRegenerate}
			disabled={loading}
			className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
		>
			{loading ? (
				<svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
			) : (
				<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
				</svg>
			)}
			{label || "Regenerar"}
		</button>
	);
}
