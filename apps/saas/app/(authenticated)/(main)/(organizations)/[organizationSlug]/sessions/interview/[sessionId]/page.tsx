"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AIInterviewPage } from "@ai-interview/components/AIInterviewPage";
import { Loader2Icon } from "lucide-react";

export default function ResumeInterviewPage() {
	const params = useParams();
	const router = useRouter();
	const organizationSlug = params.organizationSlug as string;
	const sessionId = params.sessionId as string;

	const [loading, setLoading] = useState(true);
	const [processName, setProcessName] = useState("Proceso");
	const [shareToken, setShareToken] = useState<string | undefined>();
	const [initialMessages, setInitialMessages] = useState<
		Array<{ role: "user" | "assistant"; content: string; timestamp: string }>
	>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadSession() {
			try {
				// Fetch session data to get conversation log and process name
				const res = await fetch(`/api/sessions/interview/${sessionId}/status`);
				if (!res.ok) {
					setError("No se pudo cargar la sesión");
					setLoading(false);
					return;
				}

				// For now, just render the page — the chat hook will handle state
				setLoading(false);
			} catch {
				setError("Error de conexión");
				setLoading(false);
			}
		}

		loadSession();
	}, [sessionId]);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
				<Loader2Icon className="size-8 animate-spin" style={{ color: "#D97706" }} />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
				<div className="flex flex-col items-center gap-3">
					<span className="text-sm" style={{ color: "#DC2626" }}>{error}</span>
					<button
						onClick={() => router.push(`/${organizationSlug}/sessions`)}
						className="rounded-md px-4 py-2 text-sm text-white"
						style={{ backgroundColor: "#2563EB" }}
					>
						Volver
					</button>
				</div>
			</div>
		);
	}

	return (
		<AIInterviewPage
			sessionId={sessionId}
			processName={processName}
			organizationSlug={organizationSlug}
			shareToken={shareToken}
			initialMessages={initialMessages.length > 0 ? initialMessages : undefined}
		/>
	);
}
