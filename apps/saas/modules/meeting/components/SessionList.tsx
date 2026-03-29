"use client";

import { useEffect, useState } from "react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import {
	PlayIcon,
	EyeIcon,
	ClockIcon,
	MoreHorizontalIcon,
	PencilIcon,
	TrashIcon,
	WorkflowIcon,
	PlusIcon,
	Loader2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "error"> = {
	ACTIVE: "info",
	CONNECTING: "warning",
	ENDED: "success",
	FAILED: "error",
	SCHEDULED: "info",
};

const TYPE_LABELS: Record<string, string> = {
	DISCOVERY: "Discovery",
	DEEP_DIVE: "Deep Dive",
	CONTINUATION: "Continuation",
};

type Session = {
	id: string;
	type: string;
	status: string;
	createdAt: string;
	processDefinition?: { id: string; name: string } | null;
	_count: { diagramNodes: number; transcriptEntries: number };
};

type ProcessOption = {
	id: string;
	name: string;
	level: string;
};

export function SessionList({ organizationSlug }: { organizationSlug: string }) {
	const router = useRouter();
	const { confirm } = useConfirmationAlert();
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);

	// Edit dialog state
	const [editSession, setEditSession] = useState<Session | null>(null);
	const [editType, setEditType] = useState("");
	const [editProcessId, setEditProcessId] = useState<string>("");
	const [processes, setProcesses] = useState<ProcessOption[]>([]);
	const [saving, setSaving] = useState(false);

	const fetchSessions = async () => {
		try {
			const res = await fetch("/api/sessions");
			if (res.ok) {
				const data = await res.json();
				setSessions(data);
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSessions();
	}, []);

	const handleDelete = (session: Session) => {
		confirm({
			title: "Eliminar sesión",
			message: `Se eliminará la sesión y todos sus datos asociados (nodos, transcripción, resúmenes). Esta acción no se puede deshacer.`,
			confirmLabel: "Eliminar",
			destructive: true,
			onConfirm: async () => {
				const res = await fetch(`/api/sessions/${session.id}`, {
					method: "DELETE",
				});
				if (res.ok) {
					setSessions((prev) => prev.filter((s) => s.id !== session.id));
				}
			},
		});
	};

	const openEdit = async (session: Session) => {
		setEditSession(session);
		setEditType(session.type);
		setEditProcessId(session.processDefinition?.id ?? "none");

		// Fetch processes for the selector
		if (processes.length === 0) {
			try {
				const res = await fetch("/api/processes/tree");
				if (res.ok) {
					const data = await res.json();
					const flat: ProcessOption[] = [];
					const flatten = (nodes: Array<{ id: string; name: string; level: string; children?: unknown[] }>) => {
						for (const node of nodes) {
							flat.push({ id: node.id, name: node.name, level: node.level });
							if (node.children && Array.isArray(node.children)) {
								flatten(node.children as Array<{ id: string; name: string; level: string; children?: unknown[] }>);
							}
						}
					};
					flatten(data.definitions || []);
					setProcesses(flat);
				}
			} catch {
				// Process list failed, continue without it
			}
		}
	};

	const handleEdit = async () => {
		if (!editSession) return;
		setSaving(true);
		try {
			const body: Record<string, unknown> = {};
			if (editType !== editSession.type) body.type = editType;
			if ((editProcessId === "none" ? null : editProcessId) !== (editSession.processDefinition?.id ?? null)) {
				body.processDefinitionId = editProcessId === "none" ? null : editProcessId;
			}

			if (Object.keys(body).length === 0) {
				setEditSession(null);
				return;
			}

			const res = await fetch(`/api/sessions/${editSession.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (res.ok) {
				await fetchSessions();
				setEditSession(null);
			}
		} finally {
			setSaving(false);
		}
	};

	const isActive = (status: string) =>
		status === "ACTIVE" || status === "CONNECTING";

	if (loading) {
		return (
			<Card>
				<div className="flex items-center justify-center p-12">
					<Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			</Card>
		);
	}

	if (sessions.length === 0) {
		return (
			<Card>
				<div className="flex flex-col items-center justify-center p-12 text-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<WorkflowIcon className="h-6 w-6 text-primary" />
					</div>
					<h3 className="text-lg font-semibold text-foreground">
						No hay sesiones
					</h3>
					<p className="mt-2 max-w-sm text-sm text-muted-foreground">
						Crea tu primera sesión para comenzar a mapear procesos.
					</p>
					<Button asChild className="mt-6">
						<Link href={`/${organizationSlug}/sessions/new`}>
							<PlusIcon className="mr-2 h-4 w-4" />
							Nueva sesión
						</Link>
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Process</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Nodes</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Date</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sessions.map((session) => (
							<TableRow key={session.id}>
								<TableCell>
									<p className="font-medium text-foreground">
										{session.processDefinition?.name ?? "General"}
									</p>
								</TableCell>
								<TableCell>
									<Badge status="info">
										{TYPE_LABELS[session.type] ?? session.type}
									</Badge>
								</TableCell>
								<TableCell>
									<span className="tabular-nums">
										{session._count.diagramNodes}
									</span>
								</TableCell>
								<TableCell>
									<Badge status={STATUS_VARIANT[session.status] || "info"}>
										{session.status}
									</Badge>
								</TableCell>
								<TableCell className="text-muted-foreground">
									<div className="flex items-center gap-1">
										<ClockIcon className="h-3.5 w-3.5" />
										{new Date(session.createdAt).toLocaleDateString()}
									</div>
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-1">
										{isActive(session.status) ? (
											<Button size="sm" variant="primary" asChild>
												<Link href={`/${organizationSlug}/session/${session.id}/live`}>
													<PlayIcon className="mr-1 h-3.5 w-3.5" />
													Join
												</Link>
											</Button>
										) : (
											<Button size="sm" variant="secondary" asChild>
												<Link href={`/${organizationSlug}/session/${session.id}`}>
													<EyeIcon className="mr-1 h-3.5 w-3.5" />
													View
												</Link>
											</Button>
										)}

										{!isActive(session.status) && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
														<MoreHorizontalIcon className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => openEdit(session)}>
														<PencilIcon className="mr-2 h-4 w-4" />
														Editar
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="text-destructive focus:text-destructive"
														onClick={() => handleDelete(session)}
													>
														<TrashIcon className="mr-2 h-4 w-4" />
														Eliminar
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>

			{/* Edit Dialog */}
			<Dialog open={!!editSession} onOpenChange={(open) => !open && setEditSession(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar sesión</DialogTitle>
						<DialogDescription>
							Modifica el tipo de sesión o el proceso asociado.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Tipo de sesión</label>
							<Select value={editType} onValueChange={setEditType}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="DISCOVERY">Discovery</SelectItem>
									<SelectItem value="DEEP_DIVE">Deep Dive</SelectItem>
									<SelectItem value="CONTINUATION">Continuation</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Proceso</label>
							<Select value={editProcessId} onValueChange={setEditProcessId}>
								<SelectTrigger>
									<SelectValue placeholder="Sin proceso" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Sin proceso</SelectItem>
									{processes.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setEditSession(null)}>
							Cancelar
						</Button>
						<Button onClick={handleEdit} disabled={saving}>
							{saving && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
							Guardar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
