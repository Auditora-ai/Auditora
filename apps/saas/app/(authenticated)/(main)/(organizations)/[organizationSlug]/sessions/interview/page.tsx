"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { AIInterviewPage } from "@ai-interview/components/AIInterviewPage";
import { Loader2Icon } from "lucide-react";

export default function NewInterviewPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();
	const organizationSlug = params.organizationSlug as string;

	const [sessionId, setSessionId] = useState<string | null>(null);
	const [processName, setProcessName] = useState("Nuevo proceso");
	const [shareToken, setShareToken] = useState<string | undefined>();
	const [initialMessages, setInitialMessages] = useState<
		Array<{ role: "user" | "assistant"; content: string; timestamp: string }>
	>([]);
	const [error, setError] = useState<string | null>(null);
	const [creating, setCreating] = useState(true);

	const processDefinitionId = searchParams.get("processId");
	const processNameParam = searchParams.get("processName");

	useEffect(() => {
		async function createSession() {
			try {
				const res = await fetch("/api/sessions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						sessionType: "AI_INTERVIEW",
						processDefinitionId: processDefinitionId || undefined,
						sessionGoals: processNameParam
							? `Profundizar el proceso: ${processNameParam}`
							: undefined,
					}),
				});

				const data = await res.json();

				if (!res.ok) {
					setError(data.error || "Error creating session");
					setCreating(false);
					return;
				}

				setSessionId(data.sessionId);
				setShareToken(data.shareToken);
				if (data.processName) setProcessName(data.processName);
				else if (processNameParam) setProcessName(processNameParam);
				if (data.openingMessage) {
					setInitialMessages([{
						role: "assistant" as const,
						content: data.openingMessage,
						timestamp: new Date().toISOString(),
					}]);
				}
				setCreating(false);

				// Update URL to include sessionId for resumability
				router.replace(
					`/${organizationSlug}/sessions/interview/${data.sessionId}`,
				);
			} catch {
				setError("Error de conexión");
				setCreating(false);
			}
		}

		createSession();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	if (creating) {
		return (
			<div className="flex h-screen items-center justify-center" style={{ backgroundColor: "#FFFBF5" }}>
				<div className="flex flex-col items-center gap-3">
					<Loader2Icon className="size-8 animate-spin" style={{ color: "#D97706" }} />
					<span className="text-sm" style={{ color: "#78716C" }}>
						Iniciando entrevista...
					</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen items-center justify-center" style={{ backgroundColor: "#FFFBF5" }}>
				<div className="flex flex-col items-center gap-3">
					<span className="text-sm" style={{ color: "#DC2626" }}>{error}</span>
					<button
						onClick={() => router.push(`/${organizationSlug}/sessions`)}
						className="rounded-md px-4 py-2 text-sm text-white"
						style={{ backgroundColor: "#2563EB" }}
					>
						Volver a Sesiones
					</button>
				</div>
			</div>
		);
	}

	if (!sessionId) return null;

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
