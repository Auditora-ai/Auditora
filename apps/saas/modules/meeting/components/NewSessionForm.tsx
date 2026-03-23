"use client";

import { Button } from "@repo/ui";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Badge } from "@repo/ui/components/badge";
import {
	ArrowLeftIcon,
	CheckIcon,
	PackageIcon,
	PlayIcon,
	VideoIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

interface ProcessDef {
	id: string;
	name: string;
	level: string;
	processStatus: string;
	parentId: string | null;
	children?: ProcessDef[];
}

interface PreviousSession {
	id: string;
	type: string;
	status: string;
	createdAt: string;
	processDefinition?: { name: string } | null;
	_count: { diagramNodes: number };
}

type SessionType = "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION";

export function NewSessionForm({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [step, setStep] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [sessionType, setSessionType] = useState<SessionType>(
		(searchParams.get("type") as SessionType) || "DISCOVERY",
	);
	const [processes, setProcesses] = useState<ProcessDef[]>([]);
	const [selectedProcessId, setSelectedProcessId] = useState<string>(
		searchParams.get("processId") || "",
	);
	const [previousSessions, setPreviousSessions] = useState<PreviousSession[]>([]);
	const [continuationOfId, setContinuationOfId] = useState<string>(
		searchParams.get("continuationOf") || "",
	);
	const [meetingUrl, setMeetingUrl] = useState("");

	// Pre-select from query params: skip to step 2 if process already selected
	const hasPreselection = !!(searchParams.get("processId") || searchParams.get("continuationOf"));

	// Fetch processes and sessions on mount
	useEffect(() => {
		fetch("/api/processes/tree")
			.then((r) => r.ok ? r.json() : null)
			.then((data) => {
				if (data?.definitions) setProcesses(data.definitions);
			})
			.catch(() => setProcesses([]));

		fetch("/api/sessions")
			.then((r) => r.ok ? r.json() : [])
			.then((sessions) => {
				setPreviousSessions(
					sessions.filter((s: any) => s.status === "ENDED"),
				);
			})
			.catch(() => setPreviousSessions([]));

		// If we have a preselection, skip directly to the meeting URL step
		if (hasPreselection) {
			setStep(2);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const totalSteps = 2;

	const canGoNext = useCallback(() => {
		switch (step) {
			case 1:
				if (sessionType === "DEEP_DIVE") return !!selectedProcessId;
				if (sessionType === "CONTINUATION") return !!continuationOfId;
				return true; // DISCOVERY doesn't need process selection
			case 2:
				return !!meetingUrl;
			default:
				return false;
		}
	}, [step, sessionType, selectedProcessId, continuationOfId, meetingUrl]);

	async function handleSubmit() {
		setIsSubmitting(true);
		setError(null);

		try {
			const res = await fetch("/api/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					meetingUrl,
					sessionType,
					processDefinitionId: selectedProcessId || undefined,
					continuationOf: continuationOfId || undefined,
				}),
			});

			const data = await res.json();

			if (res.ok) {
				router.push(
					`/${organizationSlug}/session/${data.sessionId}/live`,
				);
			} else {
				setError(data.error || "Something went wrong");
			}
		} catch {
			setError("Failed to connect. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Card className="p-6">
			{/* Progress indicator */}
			<div className="mb-6 flex items-center gap-2">
				{Array.from({ length: totalSteps }, (_, i) => (
					<div
						key={i}
						className={`h-1.5 flex-1 rounded-full transition-colors ${
							i + 1 <= step ? "bg-primary" : "bg-muted"
						}`}
					/>
				))}
			</div>

			{error && (
				<div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{/* Step 1: Session Type + Process Selection */}
			{step === 1 && (
				<div className="space-y-6">
					<div>
						<h3 className="text-lg font-semibold">{t("sessions.new.form.sessionType")}</h3>
						<div className="mt-3 space-y-2">
							{(["DISCOVERY", "DEEP_DIVE", "CONTINUATION"] as SessionType[]).map((type) => (
								<button
									type="button"
									key={type}
									onClick={() => {
										setSessionType(type);
										setSelectedProcessId("");
										setContinuationOfId("");
									}}
									className={`flex w-full flex-col rounded-md border p-4 text-left transition-colors ${
										sessionType === type
											? "border-primary bg-primary/5"
											: "border-border hover:bg-accent/50"
									}`}
								>
									<div className="flex items-center gap-2">
										<span className="font-medium">
											{type === "DISCOVERY" && t("sessions.new.form.typeDiscovery")}
											{type === "DEEP_DIVE" && t("sessions.new.form.typeDeepDive")}
											{type === "CONTINUATION" && "Continue Session"}
										</span>
										{sessionType === type && (
											<CheckIcon className="size-4 text-primary" />
										)}
									</div>
									<span className="mt-1 text-xs text-muted-foreground">
										{type === "DISCOVERY" && t("sessions.new.form.typeDiscoveryDesc")}
										{type === "DEEP_DIVE" && t("sessions.new.form.typeDeepDiveDesc")}
										{type === "CONTINUATION" && t("sessions.new.form.typeContinuationDesc")}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Process selection for DEEP_DIVE */}
					{sessionType === "DEEP_DIVE" && (
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<PackageIcon className="size-5 text-muted-foreground" />
								<h4 className="font-medium">Select Process</h4>
							</div>
							<div className="space-y-2">
								{processes.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No processes defined yet. Run a Discovery session first.
									</p>
								) : (
									processes.map((process) => (
										<button
											type="button"
											key={process.id}
											onClick={() => setSelectedProcessId(process.id)}
											className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
												selectedProcessId === process.id
													? "border-primary bg-primary/5"
													: "border-border hover:bg-accent/50"
											}`}
										>
											<div>
												<div className="font-medium">{process.name}</div>
												<div className="text-xs text-muted-foreground">
													{process.level} · {process.processStatus}
												</div>
											</div>
											{selectedProcessId === process.id && (
												<CheckIcon className="size-4 text-primary" />
											)}
										</button>
									))
								)}
							</div>
						</div>
					)}

					{/* Session selection for CONTINUATION */}
					{sessionType === "CONTINUATION" && (
						<div className="space-y-3">
							<h4 className="font-medium">Continue Which Session?</h4>
							<div className="space-y-2">
								{previousSessions.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No completed sessions to continue.
									</p>
								) : (
									previousSessions.map((session) => (
										<button
											type="button"
											key={session.id}
											onClick={() => setContinuationOfId(session.id)}
											className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
												continuationOfId === session.id
													? "border-primary bg-primary/5"
													: "border-border hover:bg-accent/50"
											}`}
										>
											<div>
												<div className="font-medium">
													{session.processDefinition?.name || session.type}
												</div>
												<div className="text-xs text-muted-foreground">
													{new Date(session.createdAt).toLocaleDateString()} · {session._count.diagramNodes} nodes
												</div>
											</div>
											{continuationOfId === session.id && (
												<CheckIcon className="size-4 text-primary" />
											)}
										</button>
									))
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Step 2: Meeting URL */}
			{step === 2 && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">{t("sessions.new.form.meetingUrl")}</h3>

					<div className="relative">
						<VideoIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={meetingUrl}
							onChange={(e) => setMeetingUrl(e.target.value)}
							placeholder={t("sessions.new.form.meetingUrlPlaceholder")}
							className="pl-10"
							autoFocus
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						{t("sessions.new.form.meetingUrlHint")}
					</p>

					{/* Summary */}
					<div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
						<div className="mb-2 font-semibold">Session Summary</div>
						<div className="space-y-1 text-muted-foreground">
							<div>Type: {sessionType}</div>
							{selectedProcessId && (
								<div>Process: {processes.find(p => p.id === selectedProcessId)?.name}</div>
							)}
							{continuationOfId && (
								<div>Continuing: {previousSessions.find(s => s.id === continuationOfId)?.processDefinition?.name || "Previous session"}</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Navigation */}
			<div className="mt-6 flex items-center justify-between">
				{step > 1 ? (
					<Button
						variant="outline"
						onClick={() => setStep(step - 1)}
						className="gap-1"
					>
						<ArrowLeftIcon className="size-4" />
						Back
					</Button>
				) : (
					<div />
				)}

				{step === 2 ? (
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || !meetingUrl}
						className="gap-1"
					>
						{isSubmitting ? "Starting..." : (
							<>
								<PlayIcon className="size-4" />
								Start Session
							</>
						)}
					</Button>
				) : (
					<Button
						onClick={() => setStep(step + 1)}
						disabled={!canGoNext()}
						className="gap-1"
					>
						Next
					</Button>
				)}
			</div>
		</Card>
	);
}
