"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { GraduationCapIcon, Loader2Icon } from "lucide-react";
import { toastSuccess, toastError } from "@repo/ui/components/toast";
import { useRouter } from "next/navigation";

const TARGET_ROLES = [
	{ value: "DIRECTOR_OPERACIONES", label: "Dir. Operaciones" },
	{ value: "DIRECTOR_COMPRAS", label: "Dir. Compras" },
	{ value: "DIRECTOR_CALIDAD", label: "Dir. Calidad" },
	{ value: "DIRECTOR_FINANZAS", label: "Dir. Finanzas" },
	{ value: "DIRECTOR_LOGISTICA", label: "Dir. Logística" },
	{ value: "GERENTE_PLANTA", label: "Ger. Planta" },
	{ value: "CONTROLLER", label: "Controller" },
	{ value: "CEO", label: "CEO" },
	{ value: "CUSTOM", label: "Personalizado" },
] as const;

interface Risk {
	id: string;
	title: string;
	riskType: string;
	riskScore: number;
}

interface GenerateEvaluationDialogProps {
	processId: string;
	processName: string;
	organizationSlug: string;
}

export function GenerateEvaluationDialog({
	processId,
	processName,
	organizationSlug,
}: GenerateEvaluationDialogProps) {
	const [open, setOpen] = useState(false);
	const [risks, setRisks] = useState<Risk[]>([]);
	const [loadingRisks, setLoadingRisks] = useState(false);
	const [selectedRiskIds, setSelectedRiskIds] = useState<string[]>([]);
	const [targetRole, setTargetRole] = useState("");
	const [customRoleName, setCustomRoleName] = useState("");
	const [generating, setGenerating] = useState(false);
	const router = useRouter();

	// Fetch risks when dialog opens
	useEffect(() => {
		if (!open) return;
		setLoadingRisks(true);
		fetch(`/api/processes/${processId}/risks`)
			.then((r) => r.json())
			.then((data) => {
				const riskList: Risk[] = data.risks || data || [];
				setRisks(riskList);
				// Pre-select top 5 by riskScore
				setSelectedRiskIds(
					riskList
						.sort((a, b) => b.riskScore - a.riskScore)
						.slice(0, 5)
						.map((r) => r.id),
				);
			})
			.catch(() => setRisks([]))
			.finally(() => setLoadingRisks(false));
	}, [open, processId]);

	const toggleRisk = (id: string) => {
		setSelectedRiskIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	};

	const handleGenerate = async () => {
		if (!targetRole || selectedRiskIds.length === 0) return;
		setGenerating(true);
		try {
			const res = await fetch("/api/evaluaciones/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					processDefinitionId: processId,
					targetRole,
					riskIds: selectedRiskIds,
					customRoleName:
						targetRole === "CUSTOM" ? customRoleName : undefined,
				}),
			});
			if (res.ok) {
				toastSuccess(
					"Evaluación en generación. Aparecerá en Evaluaciones en unos minutos.",
				);
				setOpen(false);
				router.push(`/${organizationSlug}/evaluaciones`);
			} else {
				const err = await res.json().catch(() => ({}));
				toastError(
					(err as { error?: string }).error ||
						"Error al generar evaluación",
				);
			}
		} catch {
			toastError("Error de conexión");
		} finally {
			setGenerating(false);
		}
	};

	const canSubmit =
		targetRole &&
		selectedRiskIds.length > 0 &&
		(targetRole !== "CUSTOM" || customRoleName.trim());

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<GraduationCapIcon className="mr-1.5 h-3.5 w-3.5" />
					Generar Evaluación
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						Generar Evaluación — {processName}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					{/* Target Role */}
					<div className="space-y-1.5">
						<Label>Rol objetivo</Label>
						<Select
							value={targetRole}
							onValueChange={setTargetRole}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona rol..." />
							</SelectTrigger>
							<SelectContent>
								{TARGET_ROLES.map((r) => (
									<SelectItem key={r.value} value={r.value}>
										{r.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{targetRole === "CUSTOM" && (
							<Input
								placeholder="Nombre del rol personalizado"
								value={customRoleName}
								onChange={(e) =>
									setCustomRoleName(e.target.value)
								}
							/>
						)}
					</div>

					{/* Risks selection */}
					<div className="space-y-1.5">
						<Label>
							Riesgos a evaluar ({selectedRiskIds.length}{" "}
							seleccionados)
						</Label>
						{loadingRisks ? (
							<div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
								<Loader2Icon className="h-4 w-4 animate-spin" />{" "}
								Cargando riesgos...
							</div>
						) : risks.length === 0 ? (
							<p className="text-sm text-muted-foreground py-2">
								Este proceso no tiene riesgos registrados.
								Primero agrega riesgos en la pestaña Riesgos.
							</p>
						) : (
							<div className="max-h-48 overflow-y-auto space-y-2 rounded border p-2">
								{risks.map((risk) => (
									<label
										key={risk.id}
										className="flex items-start gap-2 cursor-pointer hover:bg-accent p-1 rounded"
									>
										<input
											type="checkbox"
											className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
											checked={selectedRiskIds.includes(
												risk.id,
											)}
											onChange={() =>
												toggleRisk(risk.id)
											}
										/>
										<div className="text-sm">
											<span className="font-medium">
												{risk.title}
											</span>
											<span className="ml-1 text-xs text-muted-foreground">
												(Score: {risk.riskScore})
											</span>
										</div>
									</label>
								))}
							</div>
						)}
					</div>
				</div>
				<DialogFooter>
					<Button variant="ghost" onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button
						onClick={handleGenerate}
						disabled={!canSubmit}
						loading={generating}
					>
						<GraduationCapIcon className="mr-1.5 h-4 w-4" />
						Generar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
