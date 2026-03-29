"use client";

import { Button } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import {
	ChevronRightIcon,
	ChevronDownIcon,
	PackageIcon,
	ListIcon,
	CheckSquareIcon,
	FileTextIcon,
	PlayIcon,
	PencilIcon,
	PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

type ProcessDefinition = {
	id: string;
	name: string;
	description: string | null;
	level: string;
	parentId: string | null;
	processStatus: string;
	priority: number;
};

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

function buildTree(
	definitions: ProcessDefinition[],
): (ProcessDefinition & { children: ProcessDefinition[] })[] {
	const map = new Map<
		string,
		ProcessDefinition & { children: ProcessDefinition[] }
	>();
	const roots: (ProcessDefinition & { children: ProcessDefinition[] })[] = [];

	for (const def of definitions) {
		map.set(def.id, { ...def, children: [] });
	}

	for (const def of definitions) {
		const node = map.get(def.id)!;
		if (def.parentId && map.has(def.parentId)) {
			map.get(def.parentId)!.children.push(node);
		} else {
			roots.push(node);
		}
	}

	return roots;
}

function TreeNode({
	node,
	depth,
	organizationSlug,
}: {
	node: ProcessDefinition & { children: ProcessDefinition[] };
	depth: number;
	organizationSlug: string;
}) {
	const [expanded, setExpanded] = useState(depth < 2);
	const t = useTranslations("processes");
	const tProjects = useTranslations("projects");

	const Icon = LEVEL_ICONS[node.level] ?? PackageIcon;
	const hasChildren = node.children.length > 0;
	const levelLabel = t(node.level.toLowerCase() as "process" | "subprocess" | "task" | "procedure");
	const statusLabel = t(
		node.processStatus.toLowerCase() as "draft" | "mapped" | "validated" | "approved",
	);

	const processDetailPath = `/${organizationSlug}/procesos/${node.id}`;

	return (
		<div>
			<div
				className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50"
				style={{ paddingLeft: `${depth * 24 + 8}px` }}
			>
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className="flex h-5 w-5 shrink-0 items-center justify-center"
					disabled={!hasChildren}
				>
					{hasChildren ? (
						expanded ? (
							<ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
						)
					) : (
						<span className="h-4 w-4" />
					)}
				</button>

				<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

				<Link
					href={processDetailPath}
					className="flex-1 text-sm font-medium text-foreground hover:text-primary hover:underline"
				>
					{node.name}
				</Link>

				<Badge status="info" className="text-xs">
					{levelLabel}
				</Badge>

				<Badge
					status={STATUS_VARIANT[node.processStatus] || "info"}
					className="text-xs"
				>
					{statusLabel}
				</Badge>

				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon" className="h-7 w-7" asChild>
						<Link href={processDetailPath}>
							<PlayIcon className="h-3.5 w-3.5" />
						</Link>
					</Button>
					<Button variant="ghost" size="icon" className="h-7 w-7" asChild>
						<Link href={`${processDetailPath}?tab=details`}>
							<PencilIcon className="h-3.5 w-3.5" />
						</Link>
					</Button>
					<Button variant="ghost" size="icon" className="h-7 w-7" asChild>
						<Link href={`${processDetailPath}?tab=children`}>
							<PlusIcon className="h-3.5 w-3.5" />
						</Link>
					</Button>
				</div>
			</div>

			{expanded &&
				hasChildren &&
				(node.children as (ProcessDefinition & { children: ProcessDefinition[] })[]).map(
					(child) => (
						<TreeNode
							key={child.id}
							node={child}
							depth={depth + 1}
							organizationSlug={organizationSlug}
						/>
					),
				)}
		</div>
	);
}

export function ArchitectureTree({
	definitions,
	organizationSlug,
}: {
	definitions: ProcessDefinition[];
	organizationSlug: string;
}) {
	const tree = buildTree(definitions);

	if (tree.length === 0) {
		return (
			<p className="p-4 text-center text-sm text-muted-foreground">
				No processes defined.
			</p>
		);
	}

	return (
		<div className="space-y-0.5">
			{tree.map((node) => (
				<TreeNode
					key={node.id}
					node={node}
					depth={0}
					organizationSlug={organizationSlug}
				/>
			))}
		</div>
	);
}
