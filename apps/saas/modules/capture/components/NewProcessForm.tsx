"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { SparklesIcon, ArrowRightIcon } from "lucide-react";
import { MethodSelector, type CaptureMethod } from "./MethodSelector";

// ─── Area options ────────────────────────────────────────────────────────────

const AREAS = [
	{ value: "operaciones", label: "Operaciones" },
	{ value: "rrhh", label: "RRHH" },
	{ value: "finanzas", label: "Finanzas" },
	{ value: "calidad", label: "Calidad" },
	{ value: "logistica", label: "Logística" },
	{ value: "ventas", label: "Ventas" },
	{ value: "ti", label: "TI" },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

interface NewProcessFormProps {
	organizationSlug: string;
}

export function NewProcessForm({ organizationSlug }: NewProcessFormProps) {
	const router = useRouter();
	const [step, setStep] = useState<"form" | "method">("form");
	const [processName, setProcessName] = useState("");
	const [area, setArea] = useState("");

	function handleContinue() {
		if (!processName.trim() || !area) return;
		setStep("method");
	}

	function handleMethodSelect(method: CaptureMethod) {
		if (method === "chat") {
			// Generate a mock process ID and navigate to capture chat
			const mockId = `proc_${Date.now()}`;
			router.push(
				`/${organizationSlug}/capture/${mockId}?name=${encodeURIComponent(processName.trim())}&area=${area}`,
			);
		}
		// Other methods would have their own flows
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			handleContinue();
		}
	}

	return (
		<div className="flex h-dvh flex-col" style={{ backgroundColor: "#F8FAFC" }}>
			{/* Header */}
			<div
				className="shrink-0 border-b px-4 py-4"
				style={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }}
			>
				<div className="flex items-center gap-2">
					<div
						className="flex h-9 w-9 items-center justify-center rounded-xl"
						style={{ backgroundColor: "#EFF6FF" }}
					>
						<SparklesIcon className="size-5" style={{ color: "#3B8FE8" }} />
					</div>
					<div>
						<h1 className="text-base font-semibold" style={{ color: "#0A1428" }}>
							Capturar proceso
						</h1>
						<p className="text-xs" style={{ color: "#94A3B8" }}>
							{step === "form"
								? "Nombra tu proceso para comenzar"
								: "Elige el método de captura"}
						</p>
					</div>
				</div>

				{/* Step indicator */}
				<div className="mt-3 flex items-center gap-2">
					<div
						className="h-1 flex-1 rounded-full"
						style={{ backgroundColor: "#3B8FE8" }}
					/>
					<div
						className="h-1 flex-1 rounded-full transition-colors duration-300"
						style={{
							backgroundColor: step === "method" ? "#3B8FE8" : "#E2E8F0",
						}}
					/>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto px-4 py-6">
				<div className="mx-auto max-w-md">
					{step === "form" && (
						<div className="flex flex-col gap-5">
							<div>
								<label
									htmlFor="process-name"
									className="mb-1.5 block text-sm font-medium"
									style={{ color: "#0A1428" }}
								>
									Nombre del proceso
								</label>
								<input
									id="process-name"
									type="text"
									value={processName}
									onChange={(e) => setProcessName(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="Ej. Compras de materia prima"
									autoFocus
									className="h-12 w-full rounded-xl border px-4 text-[16px] outline-none transition-colors focus:border-[#3B8FE8] focus:ring-1 focus:ring-[#3B8FE8]/30"
									style={{
										backgroundColor: "#FFFFFF",
										borderColor: "#E2E8F0",
										color: "#0A1428",
									}}
								/>
							</div>

							<div>
								<label
									htmlFor="area-select"
									className="mb-1.5 block text-sm font-medium"
									style={{ color: "#0A1428" }}
								>
									Área
								</label>
								<select
									id="area-select"
									value={area}
									onChange={(e) => setArea(e.target.value)}
									className="h-12 w-full appearance-none rounded-xl border px-4 text-[16px] outline-none transition-colors focus:border-[#3B8FE8] focus:ring-1 focus:ring-[#3B8FE8]/30"
									style={{
										backgroundColor: "#FFFFFF",
										borderColor: "#E2E8F0",
										color: area ? "#0A1428" : "#94A3B8",
									}}
								>
									<option value="" disabled>
										Selecciona un área
									</option>
									{AREAS.map((a) => (
										<option key={a.value} value={a.value}>
											{a.label}
										</option>
									))}
								</select>
							</div>

							<button
								onClick={handleContinue}
								disabled={!processName.trim() || !area}
								className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 active:scale-[0.98]"
								style={{ backgroundColor: "#3B8FE8" }}
							>
								Continuar
								<ArrowRightIcon className="size-4" />
							</button>
						</div>
					)}

					{step === "method" && (
						<MethodSelector onSelect={handleMethodSelect} />
					)}
				</div>
			</div>
		</div>
	);
}
