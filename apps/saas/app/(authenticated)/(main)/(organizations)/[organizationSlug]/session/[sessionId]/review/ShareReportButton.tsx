"use client";

/**
 * Share Report Button
 *
 * Generates a public share link using the session's shareToken.
 * Copies the link to clipboard.
 */

import { useState } from "react";

interface ShareReportButtonProps {
	sessionId: string;
	shareToken: string | null;
}

export function ShareReportButton({ sessionId, shareToken }: ShareReportButtonProps) {
	const [copied, setCopied] = useState(false);
	const [loading, setLoading] = useState(false);
	const [token, setToken] = useState(shareToken);

	const getShareUrl = (t: string) =>
		typeof window !== "undefined" ? `${window.location.origin}/share/report/${t}` : "";

	const handleShare = async () => {
		if (token) {
			await navigator.clipboard.writeText(getShareUrl(token));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			return;
		}

		// Generate token via existing share API
		setLoading(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/share`, {
				method: "POST",
			});
			if (res.ok) {
				const data = await res.json();
				setToken(data.shareToken);
				await navigator.clipboard.writeText(getShareUrl(data.shareToken));
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
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
			onClick={handleShare}
			disabled={loading}
			className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
		>
			{copied ? (
				<>
					<svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
					Copiado
				</>
			) : loading ? (
				<>
					<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					Generando...
				</>
			) : (
				<>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
					</svg>
					Compartir
				</>
			)}
		</button>
	);
}
