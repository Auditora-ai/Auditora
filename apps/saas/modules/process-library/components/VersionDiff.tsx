"use client";

import { useState, useCallback } from "react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { GitCompareIcon, Loader2Icon, PlusIcon, MinusIcon, RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface VersionEntry {
	id: string;
	version: number;
	changeNote: string | null;
	createdAt: string;
}

interface DiffChange {
	type: "added" | "removed" | "modified";
	element: string;
	label: string;
}

interface VersionDiffProps {
	processId: string;
	versions: VersionEntry[];
}

/**
 * Parses BPMN XML and extracts element names/IDs for diffing.
 * Simple text-based approach — no DOM parser needed.
 */
function extractBpmnElements(xml: string | null): Map<string, string> {
	const elements = new Map<string, string>();
	if (!xml) return elements;

	// Match BPMN elements with id and name attributes
	const regex = /<bpmn:(\w+)\s[^>]*?id="([^"]+)"[^>]*?(?:name="([^"]*)")?/g;
	let match;
	while ((match = regex.exec(xml)) !== null) {
		const [, type, id, name] = match;
		if (type && id) {
			elements.set(id, `${type}: ${name || id}`);
		}
	}

	// Also try without bpmn: prefix
	const regex2 = /<(\w+)\s[^>]*?id="([^"]+)"[^>]*?(?:name="([^"]*)")?/g;
	while ((match = regex2.exec(xml)) !== null) {
		const [, type, id, name] = match;
		if (type && id && !elements.has(id)) {
			// Skip DI elements and definitions
			if (["bpmndi", "dc", "di", "definitions"].some((p) => type.toLowerCase().startsWith(p))) continue;
			elements.set(id, `${type}: ${name || id}`);
		}
	}

	return elements;
}

function computeDiff(xml1: string | null, xml2: string | null): DiffChange[] {
	const elements1 = extractBpmnElements(xml1);
	const elements2 = extractBpmnElements(xml2);
	const changes: DiffChange[] = [];

	// Added in v2
	for (const [id, label] of elements2) {
		if (!elements1.has(id)) {
			changes.push({ type: "added", element: id, label });
		}
	}

	// Removed from v1
	for (const [id, label] of elements1) {
		if (!elements2.has(id)) {
			changes.push({ type: "removed", element: id, label });
		}
	}

	// Modified (same ID, different name/label)
	for (const [id, label2] of elements2) {
		const label1 = elements1.get(id);
		if (label1 && label1 !== label2) {
			changes.push({ type: "modified", element: id, label: `${label1} → ${label2}` });
		}
	}

	return changes;
}

export function VersionDiff({ processId, versions }: VersionDiffProps) {
	const t = useTranslations("processLibrary.sidebar");
	const tc = useTranslations("common");
	const [v1, setV1] = useState<string>("");
	const [v2, setV2] = useState<string>("");
	const [changes, setChanges] = useState<DiffChange[] | null>(null);
	const [loading, setLoading] = useState(false);

	const runDiff = useCallback(async () => {
		if (!v1 || !v2 || v1 === v2) return;
		setLoading(true);
		try {
			const res = await fetch(
				`/api/processes/${processId}/diff?v1=${v1}&v2=${v2}`,
			);
			if (!res.ok) throw new Error("Diff API error");
			const data = await res.json();
			const diff = computeDiff(data.v1?.bpmnXml, data.v2?.bpmnXml);
			setChanges(diff);
		} catch {
			setChanges([]);
		} finally {
			setLoading(false);
		}
	}, [processId, v1, v2]);

	if (versions.length < 2) return null;

	return (
		<div className="space-y-3">
			<div className="flex items-end gap-2">
				<div className="flex-1 space-y-1">
					<label className="text-xs font-medium text-muted-foreground">
						Versión anterior
					</label>
					<Select value={v1} onValueChange={setV1}>
						<SelectTrigger className="h-8 text-xs">
							<SelectValue placeholder="Seleccionar..." />
						</SelectTrigger>
						<SelectContent>
							{versions.map((v) => (
								<SelectItem key={v.id} value={v.id}>
									v{v.version} — {v.changeNote || tc("noNote")}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex-1 space-y-1">
					<label className="text-xs font-medium text-muted-foreground">
						Versión nueva
					</label>
					<Select value={v2} onValueChange={setV2}>
						<SelectTrigger className="h-8 text-xs">
							<SelectValue placeholder="Seleccionar..." />
						</SelectTrigger>
						<SelectContent>
							{versions.map((v) => (
								<SelectItem key={v.id} value={v.id}>
									v{v.version} — {v.changeNote || tc("noNote")}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={runDiff}
					disabled={!v1 || !v2 || v1 === v2 || loading}
					className="h-8"
				>
					{loading ? (
						<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
					) : (
						<GitCompareIcon className="h-3.5 w-3.5" />
					)}
					<span className="ml-1.5">Comparar</span>
				</Button>
			</div>

			{changes !== null && (
				<div className="rounded-lg border bg-muted/30 p-3">
					{changes.length === 0 ? (
						<p className="text-center text-xs text-muted-foreground">
							{t("noChanges")}
						</p>
					) : (
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground mb-2">
								{changes.length} cambio{changes.length !== 1 ? "s" : ""} encontrado{changes.length !== 1 ? "s" : ""}
							</p>
							{changes.map((change, i) => (
								<div
									key={i}
									className="flex items-center gap-2 text-xs"
								>
									{change.type === "added" && (
										<PlusIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
									)}
									{change.type === "removed" && (
										<MinusIcon className="h-3.5 w-3.5 shrink-0 text-red-600" />
									)}
									{change.type === "modified" && (
										<RefreshCwIcon className="h-3.5 w-3.5 shrink-0 text-amber-600" />
									)}
									<Badge
										status={
											change.type === "added"
												? "success"
												: change.type === "removed"
													? "error"
													: "warning"
										}
										className="text-[10px]"
									>
										{change.type === "added"
											? "Nuevo"
											: change.type === "removed"
												? "Eliminado"
												: "Modificado"}
									</Badge>
									<span className="text-muted-foreground truncate">
										{change.label}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
