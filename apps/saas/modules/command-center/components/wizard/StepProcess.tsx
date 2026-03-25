"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
	SearchIcon,
	PlusIcon,
	SparklesIcon,
	ListIcon,
	Loader2Icon,
} from "lucide-react";
import { ProcessDiscoveryChat } from "./ProcessDiscoveryChat";
import type { WizardData } from "../SessionWizard";

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

type Tab = "select" | "discover";

export function StepProcess({
	data,
	onChange,
}: {
	data: WizardData;
	onChange: (patch: Partial<WizardData>) => void;
}) {
	const [tab, setTab] = useState<Tab>("select");
	const [processes, setProcesses] = useState<ProcessOption[]>([]);
	const [loadingProcesses, setLoadingProcesses] = useState(false);
	const [search, setSearch] = useState(data.processName || "");
	const [showDropdown, setShowDropdown] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setLoadingProcesses(true);
		fetch("/api/processes/tree")
			.then((r) => r.json())
			.then((tree) => {
				if (Array.isArray(tree)) {
					setProcesses(flatten(tree));
				}
			})
			.catch(() => {})
			.finally(() => setLoadingProcesses(false));
	}, []);

	// Close dropdown on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(e.target as Node)
			) {
				setShowDropdown(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	function flatten(tree: ProcessOption[]): ProcessOption[] {
		const result: ProcessOption[] = [];
		function walk(nodes: ProcessOption[]) {
			for (const n of nodes) {
				result.push({ ...n, name: n.name.trim() });
				if (n.children) walk(n.children);
			}
		}
		walk(tree);
		return result;
	}

	const filtered = useMemo(() => {
		if (!search.trim()) return processes;
		const q = search.toLowerCase();
		return processes.filter((p) => p.name.toLowerCase().includes(q));
	}, [processes, search]);

	const handleSelectProcess = (proc: ProcessOption) => {
		setSearch(proc.name);
		setShowDropdown(false);
		onChange({
			processId: proc.id,
			processName: proc.name,
			isNewProcess: false,
		});
	};

	const handleCreateNew = () => {
		setShowDropdown(false);
		onChange({
			processId: undefined,
			processName: search.trim(),
			isNewProcess: true,
			sessionType: "DISCOVERY",
		});
	};

	const handleAISelect = (name: string, sessionType: string) => {
		setSearch(name);
		setTab("select");
		onChange({
			processId: undefined,
			processName: name,
			isNewProcess: true,
			sessionType,
		});
	};

	return (
		<div className="flex h-full flex-col">
			<h2 className="mb-1 text-xl font-semibold text-[#F1F5F9]">Proceso</h2>
			<p className="mb-6 text-sm text-[#64748B]">
				Selecciona un proceso existente o descubre uno nuevo con ayuda de IA.
			</p>

			{/* Tabs */}
			<div className="mb-5 flex gap-1 rounded-lg bg-[#1E293B] p-1">
				<button
					type="button"
					onClick={() => setTab("select")}
					className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
						tab === "select"
							? "bg-[#334155] text-[#F1F5F9]"
							: "text-[#64748B] hover:text-[#94A3B8]"
					}`}
				>
					<ListIcon className="h-4 w-4" />
					Seleccionar
				</button>
				<button
					type="button"
					onClick={() => setTab("discover")}
					className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
						tab === "discover"
							? "bg-[#334155] text-[#F1F5F9]"
							: "text-[#64748B] hover:text-[#94A3B8]"
					}`}
				>
					<SparklesIcon className="h-4 w-4" />
					Descubrir con IA
				</button>
			</div>

			{tab === "select" ? (
				<div className="flex-1">
					{/* Search input */}
					<div className="relative mb-5">
						<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
						<input
							ref={inputRef}
							type="text"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setShowDropdown(true);
								onChange({
									processId: undefined,
									processName: e.target.value,
									isNewProcess: false,
								});
							}}
							onFocus={() => setShowDropdown(true)}
							placeholder={
								loadingProcesses
									? "Cargando procesos..."
									: "Buscar proceso o escribir nombre nuevo..."
							}
							className="w-full rounded-lg border border-[#334155] bg-[#1E293B] py-3 pl-10 pr-4 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
						/>

						{/* Dropdown */}
						{showDropdown && (
							<div
								ref={dropdownRef}
								className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#334155] bg-[#1E293B] shadow-xl"
							>
								{loadingProcesses && (
									<div className="flex items-center gap-2 px-4 py-3 text-sm text-[#64748B]">
										<Loader2Icon className="h-4 w-4 animate-spin" />
										Cargando...
									</div>
								)}

								{!loadingProcesses &&
									filtered.map((p) => (
										<button
											key={p.id}
											type="button"
											onClick={() => handleSelectProcess(p)}
											className="flex w-full items-center px-4 py-2.5 text-left text-sm text-[#F1F5F9] transition-colors hover:bg-[#334155]"
										>
											{p.name}
											<span className="ml-auto text-[11px] text-[#64748B]">{p.level}</span>
										</button>
									))}

								{!loadingProcesses &&
									search.trim() &&
									!filtered.some(
										(p) => p.name.toLowerCase() === search.trim().toLowerCase(),
									) && (
										<button
											type="button"
											onClick={handleCreateNew}
											className="flex w-full items-center gap-2 border-t border-[#334155] px-4 py-2.5 text-left text-sm font-medium text-[#60A5FA] transition-colors hover:bg-[#334155]"
										>
											<PlusIcon className="h-3.5 w-3.5" />
											Crear &ldquo;{search.trim()}&rdquo;
										</button>
									)}

								{!loadingProcesses && filtered.length === 0 && !search.trim() && (
									<div className="px-4 py-4 text-center text-xs text-[#64748B]">
										Sin procesos. Escribe un nombre para crear uno nuevo.
									</div>
								)}
							</div>
						)}
					</div>

					{/* Selected badge */}
					{data.isNewProcess && data.processName.trim() && (
						<div className="mb-5 inline-flex items-center gap-1 rounded-full bg-[#2563EB]/10 px-3 py-1 text-xs font-medium text-[#60A5FA]">
							<PlusIcon className="h-3 w-3" />
							Nuevo proceso
						</div>
					)}

					{/* Session type */}
					<div>
						<label className="mb-2 block text-xs font-medium text-[#94A3B8]">
							Tipo de sesión
						</label>
						<div className="grid grid-cols-3 gap-2">
							{SESSION_TYPES.map((t) => (
								<button
									key={t.value}
									type="button"
									onClick={() => onChange({ sessionType: t.value })}
									className={`rounded-lg border px-3 py-3 text-center transition-all ${
										data.sessionType === t.value
											? "border-[#2563EB] bg-[#2563EB]/10 text-[#F1F5F9]"
											: "border-[#334155] bg-[#1E293B] text-[#64748B] hover:border-[#64748B]"
									}`}
								>
									<div className="text-sm font-medium">{t.label}</div>
									<div
										className={`mt-0.5 text-[11px] ${
											data.sessionType === t.value ? "text-[#94A3B8]" : "text-[#64748B]"
										}`}
									>
										{t.desc}
									</div>
								</button>
							))}
						</div>
					</div>
				</div>
			) : (
				<div className="min-h-0 flex-1">
					<ProcessDiscoveryChat onSelectProcess={handleAISelect} />
				</div>
			)}
		</div>
	);
}
