"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { AIInterviewPage } from "@ai-interview/components/AIInterviewPage";
import { Loader2Icon } from "lucide-react";

/**
 * /capture/[processId] — starts or resumes a SIPOC interview for a specific process.
 * Reuses the same AI interview flow as /descubrir/interview but pre-scoped to a process.
 */
export default function CaptureProcessPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();
	const organizationSlug = params.organizationSlug as string;
	const processId = params.processId as string;

	const [sessionId, setSessionId] = useState<string | null>(null);
	const [processName, setProcessName] = useState("Nuevo proceso");
	const [shareToken, setShareToken] = useState<string | undefined>();
	const [initialMessages, setInitialMessages] = useState<
		Array<{ role: "user" | "assistant"; content: string; timestamp: string }>
	>([]);
	const [error, setError] = useState<string | null>(null);
	const [creating, setCreating] = useState(true);

	useEffect(() => {
		async function createSession() {
			try {
				const res = await fetch("/api/sessions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						type: "DEEP_DIVE",
						processDefinitionId: processId,
					}),
				});
				if (!res.ok) throw new Error("Failed to create session");
				const data = await res.json();
				setSessionId(data.id);
				setProcessName(data.processName ?? "Proceso");
				setShareToken(data.shareToken ?? undefined);
				setInitialMessages(data.initialMessages ?? []);
			} catch (err) {
				setError("Error creating interview session");
			} finally {
				setCreating(false);
			}
		}
		createSession();
	}, [processId]);

	if (creating) {
		return (
			<div className="flex h-[60vh] items-center justify-center">
				<Loader2Icon className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !sessionId) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center gap-4">
				<p className="text-sm text-destructive">{error ?? "Session not found"}</p>
				<button
					type="button"
					onClick={() => router.push(`/${organizationSlug}/discovery`)}
					className="text-sm text-primary underline"
				>
					Back to Discover
				</button>
			</div>
		);
	}

	return (
		<AIInterviewPage
			sessionId={sessionId}
			processName={processName}
			organizationSlug={organizationSlug}
			shareToken={shareToken}
			initialMessages={initialMessages}
		/>
	);
}
