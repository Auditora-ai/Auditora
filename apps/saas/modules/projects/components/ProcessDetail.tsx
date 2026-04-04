"use client";

import { Button } from "@repo/ui";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Label } from "@repo/ui/components/label";
import {
	PackageIcon,
	ListIcon,
	CheckSquareIcon,
	FileTextIcon,
	PlayIcon,
	PencilIcon,
	PlusIcon,
	ArrowLeftIcon,
	CalendarIcon,
	ClockIcon,
	ChevronRightIcon,
	SaveIcon,
	XIcon,
	ExternalLinkIcon,
	EyeIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProcessSchedule } from "@projects/components/ProcessSchedule";
import { IntelligenceTab } from "@projects/components/IntelligenceTab";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

// ─── Types ──────────────────────────────────────────────────────────────────

type ProcessChild = {
	id: string;
	name: string;
	level: string;
	processStatus: string;
	description: string | null;
};

type ProcessSession = {
	id: string;
	type: string;
	status: string;
	createdAt: string;
	endedAt: string | null;
	_count: { diagramNodes: number };
};

type ProcessVersionEntry = {
	version: number;
	changeNote: string | null;
	createdBy: string;
	createdAt: string;
};

type ProcessParent = {
	id: string;
	name: string;
	level: string;
};

type ProcessData = {
	id: string;
	name: string;
	description: string | null;
	level: string;
	parentId: string | null;
	owner: string | null;
	goals: string[];
	triggers: string[];
	outputs: string[];
	processStatus: string;
	bpmnXml: string | null;
	priority: number;
	parent: ProcessParent | null;
	children: ProcessChild[];
	sessions: ProcessSession[];
	versions: ProcessVersionEntry[];
};

interface ProcessDetailProps {
	process: ProcessData;
	organizationSlug: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const LEVEL_ICONS: Record<string, typeof PackageIcon> = {
	PROCESS: PackageIcon,
	SUBPROCESS: ListIcon,
	TASK: CheckSquareIcon,
	PROCEDURE: FileTextIcon,
};

const STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "error"> =
	{
		DRAFT: "info",
		MAPPED: "warning",
		VALIDATED: "success",
		APPROVED: "success",
	};

const SESSION_STATUS_VARIANT: Record<
	string,
	"success" | "info" | "warning" | "error"
> = {
	ACTIVE: "info",
	CONNECTING: "warning",
	ENDED: "success",
	FAILED: "error",
	SCHEDULED: "info",
};

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProcessDetail({
	process: initialProcess,
	organizationSlug,
}: ProcessDetailProps) {
	const t = useTranslations("processes");
	const router = useRouter();

	const [process, setProcess] = useState(initialProcess);
	const [name, setName] = useState(process.name);
	const [status, setStatus] = useState(process.processStatus);
	const [saving, setSaving] = useState(false);
	const [dirty, setDirty] = useState(false);

	const basePath = `/${organizationSlug}/procesos`;
	const processPath = `${basePath}/${process.id}`;

	// Track edits
	useEffect(() => {
		setDirty(name !== process.name || status !== process.processStatus);
	}, [name, status, process.name, process.processStatus]);

	const saveHeader = useCallback(async () => {
		if (!dirty) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/processes/${process.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, processStatus: status }),
			});
			if (res.ok) {
				const data = await res.json();
				setProcess((prev) => ({ ...prev, name: data.name ?? name, processStatus: data.processStatus ?? status }));
				setDirty(false);
				router.refresh();
			}
		} finally {
			setSaving(false);
		}
	}, [dirty, name, status, process.id, router]);

	return (
		<div>
			{/* Breadcrumb */}
			<nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
				<Link href={basePath} className="hover:text-foreground">
					{t("processes")}
				</Link>
				{process.parent && (
					<>
						<ChevronRightIcon className="h-3.5 w-3.5" />
						<Link
							href={`${basePath}/${process.parent.id}`}
							className="hover:text-foreground"
						>
							{process.parent.name}
						</Link>
					</>
				)}
				<ChevronRightIcon className="h-3.5 w-3.5" />
				<span className="text-foreground font-medium">{process.name}</span>
			</nav>

			{/* Header card */}
			<Card className="mb-6 border border-border">
				<CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="icon" asChild>
							<Link href={basePath}>
								<ArrowLeftIcon className="h-4 w-4" />
							</Link>
						</Button>
						<div className="flex-1">
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="h-auto border-0 bg-transparent p-0 text-xl font-semibold text-foreground shadow-none focus-visible:ring-0"
							/>
							<div className="mt-1 flex items-center gap-2">
								<Badge status="info" className="text-xs">
									{t(process.level.toLowerCase() as "process" | "subprocess" | "task" | "procedure")}
								</Badge>
								{process.owner && (
									<span className="text-xs text-muted-foreground">
										{t("owner")}: {process.owner}
									</span>
								)}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger className="w-[140px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="DRAFT">{t("draft")}</SelectItem>
								<SelectItem value="MAPPED">{t("mapped")}</SelectItem>
								<SelectItem value="VALIDATED">{t("validated")}</SelectItem>
								<SelectItem value="APPROVED">{t("approved")}</SelectItem>
							</SelectContent>
						</Select>
						{dirty && (
							<Button onClick={saveHeader} disabled={saving} size="sm">
								<SaveIcon className="mr-1.5 h-3.5 w-3.5" />
								{saving ? "..." : "Save"}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Tabs */}
			<Tabs defaultValue="diagram">
				<TabsList>
					<TabsTrigger value="diagram">{t("diagram")}</TabsTrigger>
					<TabsTrigger value="details">{t("details")}</TabsTrigger>
					<TabsTrigger value="children">{t("children")}</TabsTrigger>
					<TabsTrigger value="sessions">{t("sessions")}</TabsTrigger>
					<TabsTrigger value="schedule">{t("schedule")}</TabsTrigger>
					<TabsTrigger value="intelligence">{t("intelligence")}</TabsTrigger>
				</TabsList>

				{/* ─── Diagram Tab ─────────────────────────────── */}
				<TabsContent value="diagram" className="mt-6">
					<DiagramTab
						processId={process.id}
						bpmnXml={process.bpmnXml}
						organizationSlug={organizationSlug}
					/>
				</TabsContent>

				{/* ─── Details Tab ─────────────────────────────── */}
				<TabsContent value="details" className="mt-6">
					<DetailsTab
						process={process}
						onUpdate={(updated) => setProcess((prev) => ({ ...prev, ...updated }))}
					/>
				</TabsContent>

				{/* ─── Children Tab ────────────────────────────── */}
				<TabsContent value="children" className="mt-6">
					<ChildrenTab
						processId={process.id}
						children={process.children}
						basePath={basePath}
						onChildAdded={(child) =>
							setProcess((prev) => ({
								...prev,
								children: [...prev.children, child],
							}))
						}
					/>
				</TabsContent>

				{/* ─── Sessions Tab ────────────────────────────── */}
				<TabsContent value="sessions" className="mt-6">
					<SessionsTab
						sessions={process.sessions}
						organizationSlug={organizationSlug}
						processId={process.id}
					/>
				</TabsContent>

				{/* ─── Schedule Tab ────────────────────────────── */}
				<TabsContent value="schedule" className="mt-6">
					<ProcessSchedule
						process={process}
						organizationSlug={organizationSlug}
					/>
				</TabsContent>

				<TabsContent value="intelligence" className="mt-6">
					<IntelligenceTab processId={process.id} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

// ─── Diagram Tab ────────────────────────────────────────────────────────────

function DiagramTab({
	processId,
	bpmnXml,
	organizationSlug,
}: {
	processId: string;
	bpmnXml: string | null;
	organizationSlug: string;
}) {
	const t = useTranslations("processes");
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [saving, setSaving] = useState(false);
	const [showEditor, setShowEditor] = useState(!!bpmnXml);

	// Initialize bpmn-js Modeler
	useEffect(() => {
		if (!showEditor) return;

		let destroyed = false;
		let modeler: any;

		async function init() {
			if (!containerRef.current) return;

			const BpmnModeler = (await import("bpmn-js/lib/Modeler")).default;
			if (destroyed) return;

			const additionalModules: any[] = [];
			try {
				const minimapModule = (await import("diagram-js-minimap")).default;
				additionalModules.push(minimapModule);
			} catch {
				// minimap not available
			}

			modeler = new BpmnModeler({
				container: containerRef.current,
				additionalModules,
			});
			modelerRef.current = modeler;

			const xml = bpmnXml || emptyBpmnXml();
			try {
				await modeler.importXML(xml);
				if (destroyed) {
					modeler.destroy();
					return;
				}
				modeler.get("canvas").zoom("fit-viewport", "auto");
			} catch (err) {
				console.error("[ProcessDiagram] Import failed:", err);
			}

			const commandStack = modeler.get("commandStack");
			const eventBus = modeler.get("eventBus");
			eventBus.on("commandStack.changed", () => {
				setCanUndo(commandStack.canUndo());
				setCanRedo(commandStack.canRedo());
			});

			setIsReady(true);
		}

		init();
		return () => {
			destroyed = true;
			modeler?.destroy();
			modelerRef.current = null;
			setIsReady(false);
		};
	}, [showEditor]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSave = useCallback(async () => {
		const modeler = modelerRef.current;
		if (!modeler) return;

		setSaving(true);
		try {
			const { xml } = await modeler.saveXML({ format: true });
			const res = await fetch(`/api/processes/${processId}/diagram`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bpmnXml: xml }),
			});
			if (!res.ok) {
				console.error("[ProcessDiagram] Save failed");
			}
		} catch (err) {
			console.error("[ProcessDiagram] Save error:", err);
		} finally {
			setSaving(false);
		}
	}, [processId]);

	// Keyboard shortcut: Ctrl+S
	useEffect(() => {
		if (!showEditor) return;
		const handler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [showEditor, handleSave]);

	if (!showEditor) {
		return (
			<Card>
				<div className="flex flex-col items-center justify-center p-12 text-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<FileTextIcon className="h-6 w-6 text-primary" />
					</div>
					<p className="mb-4 text-sm text-muted-foreground">
						{t("noDiagram")}
					</p>
					<Button onClick={() => setShowEditor(true)}>
						<PlusIcon className="mr-2 h-4 w-4" />
						Create Diagram
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<div>
			{/* Toolbar */}
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => modelerRef.current?.get("commandStack")?.undo()}
						disabled={!canUndo}
					>
						Undo
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => modelerRef.current?.get("commandStack")?.redo()}
						disabled={!canRedo}
					>
						Redo
					</Button>
					<div className="mx-2 h-5 w-px bg-border" />
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							const canvas = modelerRef.current?.get("canvas");
							if (canvas) canvas.zoom(canvas.zoom() * 1.2);
						}}
					>
						Zoom In
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							const canvas = modelerRef.current?.get("canvas");
							if (canvas) canvas.zoom(canvas.zoom() / 1.2);
						}}
					>
						Zoom Out
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							const canvas = modelerRef.current?.get("canvas");
							if (canvas) canvas.zoom("fit-viewport", "auto");
						}}
					>
						Fit
					</Button>
				</div>
				<Button onClick={handleSave} disabled={saving} size="sm">
					<SaveIcon className="mr-1.5 h-3.5 w-3.5" />
					{saving ? "Saving..." : t("saveDiagram")}
				</Button>
			</div>

			{/* Canvas */}
			<Card className="relative overflow-hidden border border-border" style={{ height: "600px" }}>
				<div
					ref={containerRef}
					className="absolute inset-0"
					style={{ background: "#fff" }}
				/>
				{!isReady && (
					<div className="absolute inset-0 flex items-center justify-center bg-background">
						<div className="h-16 w-16 animate-pulse rounded-lg bg-muted" />
					</div>
				)}
			</Card>
		</div>
	);
}

// ─── Details Tab ────────────────────────────────────────────────────────────

function DetailsTab({
	process,
	onUpdate,
}: {
	process: ProcessData;
	onUpdate: (data: Partial<ProcessData>) => void;
}) {
	const t = useTranslations("processes");
	const [description, setDescription] = useState(process.description || "");
	const [owner, setOwner] = useState(process.owner || "");
	const [goals, setGoals] = useState<string[]>(process.goals);
	const [triggers, setTriggers] = useState<string[]>(process.triggers);
	const [outputs, setOutputs] = useState<string[]>(process.outputs);
	const [saving, setSaving] = useState(false);

	const saveDetails = useCallback(async () => {
		setSaving(true);
		try {
			const res = await fetch(`/api/processes/${process.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ description, owner, goals, triggers, outputs }),
			});
			if (res.ok) {
				onUpdate({ description, owner, goals, triggers, outputs });
			}
		} finally {
			setSaving(false);
		}
	}, [description, owner, goals, triggers, outputs, process.id, onUpdate]);

	return (
		<div className="space-y-6">
			<Card className="border border-border">
				<CardContent className="space-y-4 p-6">
					<div className="space-y-2">
						<Label>{t("description")}</Label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
							placeholder="Describe this process..."
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("owner")}</Label>
						<Input
							value={owner}
							onChange={(e) => setOwner(e.target.value)}
							placeholder="Department or person responsible..."
						/>
					</div>

					<TagField
						label={t("goals")}
						items={goals}
						onChange={setGoals}
						placeholder="Add a goal..."
					/>

					<TagField
						label={t("triggers")}
						items={triggers}
						onChange={setTriggers}
						placeholder="Add a trigger..."
					/>

					<TagField
						label={t("outputs")}
						items={outputs}
						onChange={setOutputs}
						placeholder="Add an output..."
					/>

					<div className="flex justify-end pt-2">
						<Button onClick={saveDetails} disabled={saving}>
							<SaveIcon className="mr-1.5 h-3.5 w-3.5" />
							{saving ? "Saving..." : "Save Details"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Version history */}
			{process.versions.length > 0 && (
				<Card className="border border-border">
					<CardHeader>
						<CardTitle className="text-base">Version History</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{process.versions.map((v) => (
								<div
									key={v.version}
									className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
								>
									<div className="flex items-center gap-3">
										<Badge status="info">v{v.version}</Badge>
										<span className="text-muted-foreground">
											{v.changeNote || "No note"}
										</span>
									</div>
									<span className="text-xs text-muted-foreground">
										{new Date(v.createdAt).toLocaleDateString()}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// ─── Tag Field ──────────────────────────────────────────────────────────────

function TagField({
	label,
	items,
	onChange,
	placeholder,
}: {
	label: string;
	items: string[];
	onChange: (items: string[]) => void;
	placeholder: string;
}) {
	const [input, setInput] = useState("");

	const add = () => {
		const value = input.trim();
		if (value && !items.includes(value)) {
			onChange([...items, value]);
			setInput("");
		}
	};

	const remove = (index: number) => {
		onChange(items.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<div className="flex flex-wrap gap-1.5">
				{items.map((item, i) => (
					<Badge key={i} status="info" className="gap-1 pr-1">
						{item}
						<button
							type="button"
							onClick={() => remove(i)}
							className="ml-1 rounded-full p-0.5 hover:bg-accent"
						>
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</Badge>
				))}
			</div>
			<div className="flex gap-2">
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={placeholder}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							add();
						}
					}}
					className="flex-1"
				/>
				<Button variant="secondary" size="sm" onClick={add} disabled={!input.trim()}>
					<PlusIcon className="h-3.5 w-3.5" />
				</Button>
			</div>
		</div>
	);
}

// ─── Children Tab ───────────────────────────────────────────────────────────

function ChildrenTab({
	processId,
	children,
	basePath,
	onChildAdded,
}: {
	processId: string;
	children: ProcessChild[];
	basePath: string;
	onChildAdded: (child: ProcessChild) => void;
}) {
	const t = useTranslations("processes");
	const [showForm, setShowForm] = useState(false);
	const [childName, setChildName] = useState("");
	const [childLevel, setChildLevel] = useState("SUBPROCESS");
	const [creating, setCreating] = useState(false);

	const createChild = useCallback(async () => {
		if (!childName.trim()) return;
		setCreating(true);
		try {
			const res = await fetch(`/api/processes/${processId}/children`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: childName, level: childLevel }),
			});
			if (res.ok) {
				const data = await res.json();
				onChildAdded({
					id: data.id,
					name: data.name,
					level: data.level,
					processStatus: data.processStatus || "DRAFT",
					description: data.description || null,
				});
				setChildName("");
				setShowForm(false);
			}
		} finally {
			setCreating(false);
		}
	}, [processId, childName, childLevel, onChildAdded]);

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-lg font-semibold">{t("children")}</h3>
				<Button
					variant="secondary"
					size="sm"
					onClick={() => setShowForm(!showForm)}
				>
					<PlusIcon className="mr-1.5 h-3.5 w-3.5" />
					{t("addChild")}
				</Button>
			</div>

			{showForm && (
				<Card className="mb-4 border border-border">
					<CardContent className="flex items-end gap-3 p-4">
						<div className="flex-1 space-y-1.5">
							<Label>Name</Label>
							<Input
								value={childName}
								onChange={(e) => setChildName(e.target.value)}
								placeholder="Process name..."
								onKeyDown={(e) => {
									if (e.key === "Enter") createChild();
								}}
							/>
						</div>
						<div className="w-[160px] space-y-1.5">
							<Label>Level</Label>
							<Select value={childLevel} onValueChange={setChildLevel}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SUBPROCESS">{t("subprocess")}</SelectItem>
									<SelectItem value="TASK">{t("task")}</SelectItem>
									<SelectItem value="PROCEDURE">{t("procedure")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Button onClick={createChild} disabled={creating || !childName.trim()}>
							{creating ? "..." : "Create"}
						</Button>
					</CardContent>
				</Card>
			)}

			{children.length === 0 ? (
				<Card>
					<div className="flex flex-col items-center justify-center p-12 text-center">
						<p className="text-sm text-muted-foreground">
							{t("noChildren")}
						</p>
					</div>
				</Card>
			) : (
				<div className="space-y-2">
					{children.map((child) => {
						const Icon = LEVEL_ICONS[child.level] ?? PackageIcon;
						return (
							<Link
								key={child.id}
								href={`${basePath}/${child.id}`}
								className="block"
							>
								<Card className="border border-border transition-colors hover:bg-accent/50">
									<CardContent className="flex items-center gap-3 p-3">
										<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
										<span className="flex-1 font-medium text-foreground">
											{child.name}
										</span>
										<Badge status="info" className="text-xs">
											{t(child.level.toLowerCase() as "process" | "subprocess" | "task" | "procedure")}
										</Badge>
										<Badge
											status={STATUS_VARIANT[child.processStatus] || "info"}
											className="text-xs"
										>
											{t(child.processStatus.toLowerCase() as "draft" | "mapped" | "validated" | "approved")}
										</Badge>
										<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}

// ─── Sessions Tab ───────────────────────────────────────────────────────────

function SessionsTab({
	sessions,
	organizationSlug,
	processId,
}: {
	sessions: ProcessSession[];
	organizationSlug: string;
	processId: string;
}) {
	const t = useTranslations("processes");

	const lastSession = sessions[0];

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-lg font-semibold">{t("sessions")}</h3>
				<div className="flex items-center gap-2">
					{lastSession && lastSession.status === "ENDED" && (
						<Button variant="secondary" size="sm" asChild>
							<Link
								href={`/${organizationSlug}/descubrir/new?processId=${processId}&type=DEEP_DIVE&continuationOf=${lastSession.id}`}
							>
								<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
								{t("continueLast")}
							</Link>
						</Button>
					)}
					<Button size="sm" asChild>
						<Link
							href={`/${organizationSlug}/descubrir/new?processId=${processId}&type=DEEP_DIVE`}
						>
							<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
							{t("startDeepDive")}
						</Link>
					</Button>
				</div>
			</div>

			{sessions.length === 0 ? (
				<Card>
					<div className="flex flex-col items-center justify-center p-12 text-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<ClockIcon className="h-6 w-6 text-primary" />
						</div>
						<p className="text-sm text-muted-foreground">
							{t("noSessions")}
						</p>
					</div>
				</Card>
			) : (
				<div className="space-y-3">
					{sessions.map((session) => (
						<Card key={session.id} className="border border-border">
							<CardContent className="flex items-center justify-between p-4">
								<div className="flex items-center gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
										<ClockIcon className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="font-medium text-foreground">
											{session.type === "DISCOVERY"
												? "Discovery"
												: "Deep Dive"}
										</p>
										<p className="text-xs text-muted-foreground">
											{session._count.diagramNodes} nodes
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Badge
										status={
											SESSION_STATUS_VARIANT[session.status] || "info"
										}
									>
										{session.status}
									</Badge>
									<span className="text-xs text-muted-foreground">
										{new Date(session.createdAt).toLocaleDateString()}
									</span>
									{session.status === "ACTIVE" ||
									session.status === "CONNECTING" ? (
										<Button size="sm" variant="primary" asChild>
											<Link
												href={`/${organizationSlug}/session/${session.id}/live`}
											>
												<PlayIcon className="mr-1 h-3.5 w-3.5" />
												Join
											</Link>
										</Button>
									) : (
										<Button size="sm" variant="secondary" asChild>
											<Link
												href={`/${organizationSlug}/session/${session.id}`}
											>
												<EyeIcon className="mr-1 h-3.5 w-3.5" />
												View
											</Link>
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function emptyBpmnXml(): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
