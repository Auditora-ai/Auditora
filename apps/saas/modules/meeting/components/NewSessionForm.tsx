"use client";

import { Button } from "@repo/ui";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Badge } from "@repo/ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	Building2Icon,
	CheckIcon,
	FolderIcon,
	PackageIcon,
	PlayIcon,
	PlusIcon,
	VideoIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

interface Client {
	id: string;
	name: string;
	industry: string | null;
	_count: { projects: number };
}

interface Project {
	id: string;
	name: string;
	status: string;
	_count?: { sessions: number };
}

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
	const [step, setStep] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Step data
	const [clients, setClients] = useState<Client[]>([]);
	const [selectedClientId, setSelectedClientId] = useState<string>("");
	const [newClientName, setNewClientName] = useState("");
	const [isCreatingClient, setIsCreatingClient] = useState(false);

	const [projects, setProjects] = useState<Project[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState<string>("");
	const [newProjectName, setNewProjectName] = useState("");
	const [isCreatingProject, setIsCreatingProject] = useState(false);

	const [sessionType, setSessionType] = useState<SessionType>("DISCOVERY");

	const [processes, setProcesses] = useState<ProcessDef[]>([]);
	const [selectedProcessId, setSelectedProcessId] = useState<string>("");

	const [previousSessions, setPreviousSessions] = useState<PreviousSession[]>([]);
	const [continuationOfId, setContinuationOfId] = useState<string>("");

	const [meetingUrl, setMeetingUrl] = useState("");

	// Fetch clients on mount
	useEffect(() => {
		fetch("/api/sessions?_clients=1")
			.catch(() => null);
		// Use ORPC client list
		fetch("/api/clients", { method: "GET" })
			.then((r) => r.ok ? r.json() : [])
			.then(setClients)
			.catch(() => setClients([]));
	}, []);

	// Fetch projects when client selected
	useEffect(() => {
		if (!selectedClientId) {
			setProjects([]);
			return;
		}
		fetch(`/api/clients/${selectedClientId}`)
			.then((r) => r.ok ? r.json() : null)
			.then((data) => {
				if (data?.projects) setProjects(data.projects);
			})
			.catch(() => setProjects([]));
	}, [selectedClientId]);

	// Fetch architecture tree when project selected
	useEffect(() => {
		if (!selectedProjectId) {
			setProcesses([]);
			return;
		}
		fetch(`/api/processes/tree?projectId=${selectedProjectId}`)
			.then((r) => r.ok ? r.json() : null)
			.then((data) => {
				if (data?.definitions) setProcesses(data.definitions);
			})
			.catch(() => setProcesses([]));

		// Also fetch previous sessions for continuation
		fetch(`/api/sessions?projectId=${selectedProjectId}`)
			.then((r) => r.ok ? r.json() : [])
			.then((sessions) => {
				setPreviousSessions(
					sessions.filter((s: any) => s.status === "ENDED"),
				);
			})
			.catch(() => setPreviousSessions([]));
	}, [selectedProjectId]);

	const totalSteps = sessionType === "DISCOVERY" ? 4 : 5;

	const canGoNext = useCallback(() => {
		switch (step) {
			case 1:
				return !!selectedClientId || !!newClientName;
			case 2:
				return !!selectedProjectId || !!newProjectName;
			case 3:
				return !!sessionType;
			case 4:
				if (sessionType === "DEEP_DIVE") return !!selectedProcessId;
				if (sessionType === "CONTINUATION") return !!continuationOfId;
				return !!meetingUrl; // DISCOVERY goes straight to URL
			case 5:
				return !!meetingUrl;
			default:
				return false;
		}
	}, [step, selectedClientId, newClientName, selectedProjectId, newProjectName, sessionType, selectedProcessId, continuationOfId, meetingUrl]);

	async function handleSubmit() {
		setIsSubmitting(true);
		setError(null);

		try {
			// Create client if needed
			let clientId = selectedClientId;
			if (!clientId && newClientName) {
				const res = await fetch("/api/clients", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: newClientName }),
				});
				const data = await res.json();
				clientId = data.id;
			}

			// Create project if needed
			let projectId = selectedProjectId;
			if (!projectId && newProjectName) {
				const res = await fetch(`/api/clients/${clientId}/projects`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: newProjectName }),
				});
				const data = await res.json();
				projectId = data.id;
			}

			const res = await fetch("/api/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					meetingUrl,
					clientId,
					projectId,
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

			{/* Step 1: Select Client */}
			{step === 1 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Building2Icon className="size-5 text-muted-foreground" />
						<h3 className="text-lg font-semibold">{t("sessions.new.form.clientName")}</h3>
					</div>
					<p className="text-sm text-muted-foreground">{t("sessions.new.form.clientHint")}</p>

					{!isCreatingClient ? (
						<>
							<div className="space-y-2">
								{clients.map((client) => (
									<button
										type="button"
										key={client.id}
										onClick={() => {
											setSelectedClientId(client.id);
											setNewClientName("");
										}}
										className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
											selectedClientId === client.id
												? "border-primary bg-primary/5"
												: "border-border hover:bg-accent/50"
										}`}
									>
										<div>
											<div className="font-medium">{client.name}</div>
											{client.industry && (
												<div className="text-xs text-muted-foreground">{client.industry}</div>
											)}
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-muted-foreground">
												{client._count.projects} projects
											</span>
											{selectedClientId === client.id && (
												<CheckIcon className="size-4 text-primary" />
											)}
										</div>
									</button>
								))}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsCreatingClient(true)}
								className="gap-1"
							>
								<PlusIcon className="size-3" />
								{t("clients.newClient")}
							</Button>
						</>
					) : (
						<div className="space-y-2">
							<Input
								value={newClientName}
								onChange={(e) => {
									setNewClientName(e.target.value);
									setSelectedClientId("");
								}}
								placeholder="Company name"
								autoFocus
							/>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setIsCreatingClient(false);
									setNewClientName("");
								}}
							>
								Cancel
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Step 2: Select Project */}
			{step === 2 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<FolderIcon className="size-5 text-muted-foreground" />
						<h3 className="text-lg font-semibold">{t("sessions.new.form.projectName")}</h3>
					</div>
					<p className="text-sm text-muted-foreground">{t("sessions.new.form.projectHint")}</p>

					{!isCreatingProject ? (
						<>
							<div className="space-y-2">
								{projects.map((project) => (
									<button
										type="button"
										key={project.id}
										onClick={() => {
											setSelectedProjectId(project.id);
											setNewProjectName("");
										}}
										className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
											selectedProjectId === project.id
												? "border-primary bg-primary/5"
												: "border-border hover:bg-accent/50"
										}`}
									>
										<div className="font-medium">{project.name}</div>
										<div className="flex items-center gap-2">
											<Badge>{project.status}</Badge>
											{selectedProjectId === project.id && (
												<CheckIcon className="size-4 text-primary" />
											)}
										</div>
									</button>
								))}
								{projects.length === 0 && (
									<p className="text-sm text-muted-foreground">No projects yet for this client.</p>
								)}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsCreatingProject(true)}
								className="gap-1"
							>
								<PlusIcon className="size-3" />
								{t("projects.newProject")}
							</Button>
						</>
					) : (
						<div className="space-y-2">
							<Input
								value={newProjectName}
								onChange={(e) => {
									setNewProjectName(e.target.value);
									setSelectedProjectId("");
								}}
								placeholder="Project name"
								autoFocus
							/>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setIsCreatingProject(false);
									setNewProjectName("");
								}}
							>
								Cancel
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Step 3: Session Type */}
			{step === 3 && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">{t("sessions.new.form.sessionType")}</h3>

					<div className="space-y-2">
						{(["DISCOVERY", "DEEP_DIVE", "CONTINUATION"] as SessionType[]).map((type) => (
							<button
								type="button"
								key={type}
								onClick={() => setSessionType(type)}
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
			)}

			{/* Step 4: Process Selection (DEEP_DIVE) or Session Selection (CONTINUATION) */}
			{step === 4 && sessionType === "DEEP_DIVE" && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<PackageIcon className="size-5 text-muted-foreground" />
						<h3 className="text-lg font-semibold">Select Process</h3>
					</div>

					<div className="space-y-2">
						{processes.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No processes defined yet. Run a Discovery session first to map the architecture.
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

			{step === 4 && sessionType === "CONTINUATION" && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Continue Which Session?</h3>

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

			{/* Last Step: Meeting URL */}
			{((step === 4 && sessionType === "DISCOVERY") || step === 5) && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">{t("sessions.new.form.meetingUrl")}</h3>

					<div className="relative">
						<VideoIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={meetingUrl}
							onChange={(e) => setMeetingUrl(e.target.value)}
							placeholder={t("sessions.new.form.meetingUrlPlaceholder")}
							className="pl-10"
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						{t("sessions.new.form.meetingUrlHint")}
					</p>

					{/* Summary */}
					<div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
						<div className="mb-2 font-semibold">Session Summary</div>
						<div className="space-y-1 text-muted-foreground">
							<div>Client: {clients.find(c => c.id === selectedClientId)?.name || newClientName}</div>
							<div>Project: {projects.find(p => p.id === selectedProjectId)?.name || newProjectName}</div>
							<div>Type: {sessionType}</div>
							{selectedProcessId && (
								<div>Process: {processes.find(p => p.id === selectedProcessId)?.name}</div>
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

				{((step === 4 && sessionType === "DISCOVERY") || step === 5) ? (
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
						<ArrowRightIcon className="size-4" />
					</Button>
				)}
			</div>
		</Card>
	);
}
