"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import {
	Factory,
	Landmark,
	Heart,
	ShoppingCart,
	Monitor,
	Layers,
} from "lucide-react";

interface Template {
	id: string;
	framework: string;
	industry: string;
	name: string;
	description: string | null;
	structure: { processes: Array<{ name: string; category?: string }> };
}

interface TemplatePickerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onApplied?: () => void;
}

const INDUSTRY_ICONS: Record<string, React.ElementType> = {
	Manufacturing: Factory,
	"Financial Services": Landmark,
	Healthcare: Heart,
	Retail: ShoppingCart,
	Technology: Monitor,
};

export function TemplatePicker({
	open,
	onOpenChange,
	onApplied,
}: TemplatePickerProps) {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [applying, setApplying] = useState(false);

	useEffect(() => {
		if (open) {
			setLoading(true);
			fetch("/api/templates")
				.then((r) => r.json())
				.then((data) => setTemplates(data.templates || []))
				.finally(() => setLoading(false));
		}
	}, [open]);

	const handleApply = async () => {
		if (!selected) return;
		setApplying(true);

		try {
			const res = await fetch("/api/templates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ templateId: selected }),
			});

			if (res.ok) {
				onOpenChange(false);
				onApplied?.();
			}
		} finally {
			setApplying(false);
		}
	};

	const selectedTemplate = templates.find((t) => t.id === selected);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Start from Industry Template</DialogTitle>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					</div>
				) : (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{templates.map((t) => {
								const Icon =
									INDUSTRY_ICONS[t.industry] || Layers;
								const isSelected = selected === t.id;

								return (
									<Card
										key={t.id}
										className={`cursor-pointer transition-all ${
											isSelected
												? "border-primary bg-primary/5 ring-2 ring-primary"
												: "hover:border-primary/50 hover:bg-accent/30"
										}`}
										onClick={() => setSelected(t.id)}
									>
										<CardContent className="flex flex-col items-center gap-2 p-4 text-center">
											<Icon
												className={`h-8 w-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
											/>
											<span className="text-sm font-medium">
												{t.industry}
											</span>
											<span className="text-xs text-muted-foreground">
												{t.structure.processes.length}{" "}
												processes
											</span>
										</CardContent>
									</Card>
								);
							})}
						</div>

						{selectedTemplate && (
							<div className="rounded-lg border bg-accent/20 p-4">
								<p className="mb-2 text-sm font-medium">
									{selectedTemplate.name}
								</p>
								<div className="flex flex-wrap gap-1.5">
									{selectedTemplate.structure.processes.map(
										(p) => (
											<span
												key={p.name}
												className={`rounded-full px-2.5 py-0.5 text-xs ${
													p.category === "core"
														? "bg-primary/10 text-primary"
														: p.category ===
															  "strategic"
															? "bg-amber-500/10 text-amber-600"
															: "bg-muted text-muted-foreground"
												}`}
											>
												{p.name}
											</span>
										),
									)}
								</div>
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Skip
					</Button>
					<Button
						onClick={handleApply}
						disabled={!selected || applying}
						loading={applying}
					>
						Apply Template
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
