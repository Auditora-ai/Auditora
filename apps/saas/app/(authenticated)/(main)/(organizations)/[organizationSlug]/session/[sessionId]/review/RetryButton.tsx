"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetryButton({
	sessionId,
	type,
}: {
	sessionId: string;
	type: string;
}) {
	const router = useRouter();
	const [isRetrying, setIsRetrying] = useState(false);

	const handleRetry = async () => {
		setIsRetrying(true);
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
			setIsRetrying(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleRetry}
			disabled={isRetrying}
			className="inline-flex h-8 items-center gap-1.5 rounded border border-red-200 bg-white px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
		>
			{isRetrying ? (
				<>
					<svg
						className="h-3.5 w-3.5 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					Reintentando...
				</>
			) : (
				<>
					<svg
						className="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
						/>
					</svg>
					Reintentar
				</>
			)}
		</button>
	);
}
