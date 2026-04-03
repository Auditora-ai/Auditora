"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface AddProcessModalProps {
	organizationId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated: () => void;
}

export function AddProcessModal({
	organizationId,
	open,
	onOpenChange,
	onCreated,
}: AddProcessModalProps) {
	const tc = useTranslations("common");
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
				setError(data.message || tc("errorSaving"));
				return;
			}

			onCreated();
			onOpenChange(false);
			setName("");
			setDescription("");
			setLevel("PROCESS");
			setCategory("core");
		} catch {
			setError(tc("errorSaving"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{tc("addProcess")}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="process-name"
							className="mb-1 block text-sm font-medium"
						>
							{tc("name")} *
						</label>
						<Input
							id="process-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={tc("processNamePlaceholder")}
							autoFocus
						/>
					</div>

					<div>
						<label
							htmlFor="process-desc"
							className="mb-1 block text-sm font-medium"
						>
							{tc("description")}
						</label>
						<Textarea
							id="process-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={tc("description")}
							rows={2}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-sm font-medium">
								{tc("level")}
							</label>
							<Select value={level} onValueChange={setLevel}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PROCESS">
										{tc("process")}
									</SelectItem>
									<SelectItem value="SUBPROCESS">
										{tc("subprocess")}
									</SelectItem>
									<SelectItem value="TASK">{tc("task")}</SelectItem>
									<SelectItem value="PROCEDURE">
										{tc("procedure")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium">
								{tc("category")}
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
										{tc("strategic")}
									</SelectItem>
									<SelectItem value="support">
										{tc("support")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{error && (
						<p className="text-sm text-destructive">{error}</p>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{tc("cancel")}
						</Button>
						<Button
							type="submit"
							disabled={!name.trim() || isSubmitting}
						>
							{isSubmitting ? tc("creating") : tc("create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
