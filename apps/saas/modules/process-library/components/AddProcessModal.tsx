"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { XIcon } from "lucide-react";
import { useState } from "react";

interface AddProcessModalProps {
	organizationId: string;
	onClose: () => void;
	onCreated: () => void;
}

export function AddProcessModal({
	organizationId,
	onClose,
	onCreated,
}: AddProcessModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [level, setLevel] = useState("PROCESS");
	const [category, setCategory] = useState("core");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setIsSubmitting(true);
		setError("");

		try {
			const res = await fetch("/api/discovery/accept", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId,
					process: {
						name: name.trim(),
						description: description.trim() || undefined,
						suggestedLevel: level,
						suggestedCategory: category,
					},
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.message || "Error al crear el proceso");
				return;
			}

			onCreated();
			onClose();
		} catch {
			setError("Error al crear el proceso");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold">Agregar Proceso</h2>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="size-8"
					>
						<XIcon className="size-4" />
					</Button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="process-name"
							className="mb-1 block text-sm font-medium"
						>
							Nombre *
						</label>
						<Input
							id="process-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ej: Gestión de Compras"
							autoFocus
						/>
					</div>

					<div>
						<label
							htmlFor="process-desc"
							className="mb-1 block text-sm font-medium"
						>
							Descripción
						</label>
						<Textarea
							id="process-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Breve descripción del proceso"
							rows={2}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-sm font-medium">
								Nivel
							</label>
							<Select value={level} onValueChange={setLevel}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PROCESS">
										Proceso
									</SelectItem>
									<SelectItem value="SUBPROCESS">
										Subproceso
									</SelectItem>
									<SelectItem value="TASK">Tarea</SelectItem>
									<SelectItem value="PROCEDURE">
										Procedimiento
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium">
								Categoría
							</label>
							<Select
								value={category}
								onValueChange={setCategory}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="core">Core</SelectItem>
									<SelectItem value="strategic">
										Estratégico
									</SelectItem>
									<SelectItem value="support">
										Soporte
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{error && (
						<p className="text-sm text-destructive">{error}</p>
					)}

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={!name.trim() || isSubmitting}
						>
							{isSubmitting ? "Creando..." : "Crear Proceso"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
