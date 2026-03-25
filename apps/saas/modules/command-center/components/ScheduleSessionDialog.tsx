"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { XIcon, SearchIcon, PlusIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

interface ProcessOption {
	id: string;
	name: string;
	level: string;
	children?: ProcessOption[];
}

const SESSION_TYPES = [
	{ value: "DISCOVERY", label: "Discovery", desc: "Primera vez con este proceso" },
	{ value: "DEEP_DIVE", label: "Deep Dive", desc: "Profundizar en detalles" },
	{ value: "CONTINUATION", label: "Continuación", desc: "Seguir donde quedamos" },
] as const;

const DURATIONS = [
	{ value: "30", label: "30 min" },
	{ value: "60", label: "1 hora" },
	{ value: "90", label: "1.5 hrs" },
	{ value: "120", label: "2 hrs" },
] as const;

export function ScheduleSessionDialog({
	open,
	onClose,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	onCreated: () => void;
}) {
	const [processes, setProcesses] = useState<ProcessOption[]>([]);
	const [loadingProcesses, setLoadingProcesses] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Form state
	const [processSearch, setProcessSearch] = useState("");
	const [selectedProcess, setSelectedProcess] = useState<ProcessOption | null>(null);
	const [isNewProcess, setIsNewProcess] = useState(false);
	const [showProcessDropdown, setShowProcessDropdown] = useState(false);
	const [sessionType, setSessionType] = useState("DISCOVERY");
	const [scheduledFor, setScheduledFor] = useState("");
	const [duration, setDuration] = useState("60");
	const [contactName, setContactName] = useState("");
	const [contactEmail, setContactEmail] = useState("");
	const [sessionGoals, setSessionGoals] = useState("");

	const processInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			setLoadingProcesses(true);
			fetch("/api/processes/tree")
				.then((r) => r.json())
				.then((data) => {
					if (Array.isArray(data)) {
						setProcesses(flattenProcesses(data));
					}
				})
				.catch(() => {})
				.finally(() => setLoadingProcesses(false));

			// Default date to tomorrow at 10am
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(10, 0, 0, 0);
			setScheduledFor(tomorrow.toISOString().slice(0, 16));
		}
	}, [open]);

	function flattenProcesses(tree: ProcessOption[]): ProcessOption[] {
		const result: ProcessOption[] = [];
		function walk(nodes: ProcessOption[], depth = 0) {
			for (const n of nodes) {
				result.push({ ...n, name: n.name.trim() });
				if (n.children) walk(n.children, depth + 1);
			}
		}
		walk(tree);
		return result;
	}

	const filteredProcesses = useMemo(() => {
		if (!processSearch.trim()) return processes;
		const q = processSearch.toLowerCase();
		return processes.filter((p) => p.name.toLowerCase().includes(q));
	}, [processes, processSearch]);

	const handleSelectProcess = (proc: ProcessOption) => {
		setSelectedProcess(proc);
		setProcessSearch(proc.name);
		setIsNewProcess(false);
		setShowProcessDropdown(false);
		// Auto-set type based on whether process has sessions
		if (proc.level === "PROCESS") setSessionType("DEEP_DIVE");
	};

	const handleCreateNewProcess = () => {
		setSelectedProcess(null);
		setIsNewProcess(true);
		setShowProcessDropdown(false);
		setSessionType("DISCOVERY");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!scheduledFor) {
			toast.error("Selecciona una fecha");
			return;
		}

		setSubmitting(true);
		try {
			const scheduledDate = new Date(scheduledFor);
			const durationMs = Number.parseInt(duration) * 60 * 1000;
			const scheduledEnd = new Date(scheduledDate.getTime() + durationMs);

			let processDefinitionId = selectedProcess?.id;

			// If creating a new process, we need the architecture first
			if (isNewProcess && processSearch.trim()) {
				// The POST /api/sessions with DISCOVERY auto-creates architecture
				// But we need to create the process definition first
				// Let's create it via the processes API
				const archRes = await fetch("/api/processes/tree");
				let architectureId: string | null = null;

				if (archRes.ok) {
					const tree = await archRes.json();
					if (Array.isArray(tree) && tree.length > 0) {
						// Get architectureId from first process
						const firstProc = await fetch(`/api/processes/${tree[0].id}`);
						if (firstProc.ok) {
							const procData = await firstProc.json();
							architectureId = procData.architectureId;
						}
					}
				}

				// If no architecture exists, DISCOVERY type will auto-create it
				// We'll pass the name and let the session handle it
				if (!architectureId) {
					// Create session without process, DISCOVERY will create architecture
					processDefinitionId = undefined;
				}
			}

			const res = await fetch("/api/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionType,
					processDefinitionId: processDefinitionId || undefined,
					scheduledFor: scheduledDate.toISOString(),
					scheduledEnd: scheduledEnd.toISOString(),
					sessionGoals: sessionGoals || (isNewProcess ? `Levantamiento: ${processSearch.trim()}` : undefined),
					contactName: contactName || undefined,
					contactEmail: contactEmail || undefined,
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Error creando sesión");
			}

			toast.success("Sesión programada");

			// Reset
			setProcessSearch("");
			setSelectedProcess(null);
			setIsNewProcess(false);
			setSessionType("DISCOVERY");
			setScheduledFor("");
			setDuration("60");
			setContactName("");
			setContactEmail("");
			setSessionGoals("");

			onCreated();
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al programar");
		} finally {
			setSubmitting(false);
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

			{/* Dialog */}
			<div
				className="relative mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-[#F1F5F9] px-6 py-4">
					<h2 className="text-base font-semibold text-[#0F172A]">Nueva sesión</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#334155]"
					>
						<XIcon className="h-4 w-4" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-5">
					{/* Process — searchable combobox with "create new" option */}
					<div className="relative mb-5">
						<label className="mb-1.5 block text-xs font-medium text-[#64748B]">Proceso</label>
						<div className="relative">
							<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
							<input
								ref={processInputRef}
								type="text"
								value={processSearch}
								onChange={(e) => {
									setProcessSearch(e.target.value);
									setSelectedProcess(null);
									setIsNewProcess(false);
									setShowProcessDropdown(true);
								}}
								onFocus={() => setShowProcessDropdown(true)}
								placeholder={loadingProcesses ? "Cargando procesos..." : "Buscar o crear proceso..."}
								className="w-full rounded-lg border border-[#E2E8F0] py-2.5 pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
							/>
						</div>

						{/* Dropdown */}
						{showProcessDropdown && (
							<div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[#E2E8F0] bg-white shadow-lg">
								{filteredProcesses.map((p) => (
									<button
										key={p.id}
										type="button"
										onClick={() => handleSelectProcess(p)}
										className="flex w-full items-center px-3 py-2 text-left text-sm text-[#334155] transition-colors hover:bg-[#F8FAFC]"
									>
										{p.name}
									</button>
								))}
								{processSearch.trim() && !filteredProcesses.some(
									(p) => p.name.toLowerCase() === processSearch.trim().toLowerCase(),
								) && (
									<button
										type="button"
										onClick={handleCreateNewProcess}
										className="flex w-full items-center gap-2 border-t border-[#F1F5F9] px-3 py-2 text-left text-sm font-medium text-[#2563EB] transition-colors hover:bg-[#EFF6FF]"
									>
										<PlusIcon className="h-3.5 w-3.5" />
										Crear &ldquo;{processSearch.trim()}&rdquo;
									</button>
								)}
								{filteredProcesses.length === 0 && !processSearch.trim() && !loadingProcesses && (
									<div className="px-3 py-3 text-center text-xs text-[#94A3B8]">
										Sin procesos. Escribe un nombre para crear uno nuevo.
									</div>
								)}
							</div>
						)}

						{/* Selected badge */}
						{isNewProcess && processSearch.trim() && (
							<div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#2563EB]">
								<PlusIcon className="h-3 w-3" />
								Nuevo proceso
							</div>
						)}
					</div>

					{/* Session type — pill selector */}
					<div className="mb-5">
						<label className="mb-1.5 block text-xs font-medium text-[#64748B]">Tipo de sesión</label>
						<div className="flex gap-2">
							{SESSION_TYPES.map((t) => (
								<button
									key={t.value}
									type="button"
									onClick={() => setSessionType(t.value)}
									className={`flex-1 rounded-lg border px-3 py-2 text-center transition-all ${
										sessionType === t.value
											? "border-[#0F172A] bg-[#0F172A] text-white"
											: "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]"
									}`}
								>
									<div className="text-xs font-medium">{t.label}</div>
									<div className={`text-[10px] ${sessionType === t.value ? "text-[#94A3B8]" : "text-[#CBD5E1]"}`}>
										{t.desc}
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Date + Duration — side by side */}
					<div className="mb-5 grid grid-cols-3 gap-3">
						<div className="col-span-2">
							<label className="mb-1.5 block text-xs font-medium text-[#64748B]">Fecha y hora</label>
							<input
								type="datetime-local"
								value={scheduledFor}
								onChange={(e) => setScheduledFor(e.target.value)}
								required
								className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-xs font-medium text-[#64748B]">Duración</label>
							<div className="grid grid-cols-2 gap-1">
								{DURATIONS.map((d) => (
									<button
										key={d.value}
										type="button"
										onClick={() => setDuration(d.value)}
										className={`rounded-md px-1 py-2.5 text-center text-[11px] font-medium transition-all ${
											duration === d.value
												? "bg-[#0F172A] text-white"
												: "border border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"
										}`}
									>
										{d.label}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Contact — compact inline */}
					<div className="mb-5">
						<label className="mb-1.5 block text-xs font-medium text-[#64748B]">Contacto del cliente (opcional)</label>
						<div className="flex gap-2">
							<input
								type="text"
								value={contactName}
								onChange={(e) => setContactName(e.target.value)}
								placeholder="Nombre"
								className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm placeholder:text-[#CBD5E1] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
							/>
							<input
								type="email"
								value={contactEmail}
								onChange={(e) => setContactEmail(e.target.value)}
								placeholder="email@empresa.com"
								className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm placeholder:text-[#CBD5E1] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
							/>
						</div>
					</div>

					{/* Goals — optional */}
					<div className="mb-6">
						<label className="mb-1.5 block text-xs font-medium text-[#64748B]">Notas (opcional)</label>
						<textarea
							value={sessionGoals}
							onChange={(e) => setSessionGoals(e.target.value)}
							placeholder="Qué cubrir, contexto previo..."
							rows={2}
							className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm placeholder:text-[#CBD5E1] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
						/>
					</div>

					{/* Submit */}
					<button
						type="submit"
						disabled={submitting || !scheduledFor}
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F172A] py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
					>
						{submitting ? (
							<>
								<Loader2Icon className="h-4 w-4 animate-spin" />
								Programando...
							</>
						) : (
							"Programar Sesión"
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
