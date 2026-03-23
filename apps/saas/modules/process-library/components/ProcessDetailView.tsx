"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
	ArrowLeft,
	FileText,
	GitBranch,
	Table2,
	GitMerge,
	Target,
	Zap,
	PackageOpen,
	User,
} from "lucide-react";
import Link from "next/link";
import { RaciTab } from "./RaciTab";
import { ConsolidationView } from "./ConsolidationView";

interface ProcessData {
	id: string;
	name: string;
	description: string | null;
	level: string;
	processStatus: string;
	category: string | null;
	owner: string | null;
	goals: string[];
	triggers: string[];
	outputs: string[];
	bpmnXml: string | null;
	sessionsCount: number;
	versionsCount: number;
	raciCount: number;
	conflictsCount: number;
}

interface ProcessDetailViewProps {
	process: ProcessData;
	basePath: string;
}

const STATUS_MAP: Record<string, "success" | "info" | "warning" | "error"> = {
	DRAFT: "info",
	MAPPED: "warning",
	VALIDATED: "success",
	APPROVED: "success",
};

const TABS = [
	{ key: "details", label: "Detalles", icon: FileText },
	{ key: "raci", label: "RACI", icon: Table2 },
	{ key: "consolidation", label: "Consolidación", icon: GitMerge },
] as const;

export function ProcessDetailView({
	process,
	basePath,
}: ProcessDetailViewProps) {
	const [activeTab, setActiveTab] = useState<string>("details");

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-4">
					<Link href={`${basePath}/procesos`}>
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold">
								{process.name}
							</h1>
							<Badge
								status={
									STATUS_MAP[process.processStatus] || "info"
								}
							>
								{process.processStatus}
							</Badge>
							{process.category && (
								<Badge variant="outline">
									{process.category}
								</Badge>
							)}
						</div>
						{process.description && (
							<p className="mt-1 text-sm text-muted-foreground">
								{process.description}
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<span>{process.sessionsCount} sessions</span>
					<span>·</span>
					<span>{process.versionsCount} versions</span>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex border-b">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const showBadge =
						tab.key === "raci" && process.raciCount > 0;
					const showConflictBadge =
						tab.key === "consolidation" &&
						process.conflictsCount > 0;

					// Hide consolidation tab if less than 2 sessions
					if (
						tab.key === "consolidation" &&
						process.sessionsCount < 2
					) {
						return null;
					}

					return (
						<button
							key={tab.key}
							type="button"
							onClick={() => setActiveTab(tab.key)}
							className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
								activeTab === tab.key
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<Icon className="h-4 w-4" />
							{tab.label}
							{showBadge && (
								<span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs text-primary">
									{process.raciCount}
								</span>
							)}
							{showConflictBadge && (
								<span className="ml-1 rounded-full bg-amber-500/10 px-1.5 text-xs text-amber-600">
									{process.conflictsCount}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* Tab content */}
			{activeTab === "details" && (
				<div className="grid gap-6 lg:grid-cols-3">
					{/* Main info */}
					<div className="space-y-4 lg:col-span-2">
						{process.bpmnXml ? (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-base">
										<GitBranch className="h-4 w-4" />
										Diagram
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-center rounded-lg border bg-white p-8 text-sm text-muted-foreground">
										BPMN diagram preview
										<br />
										({process.bpmnXml.length.toLocaleString()}{" "}
										chars)
									</div>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="flex flex-col items-center justify-center py-12 text-center">
									<GitBranch className="mb-3 h-8 w-8 text-muted-foreground/40" />
									<p className="text-sm font-medium text-muted-foreground">
										No diagram yet
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Run a session to generate the BPMN
										diagram
									</p>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-4">
						{process.owner && (
							<Card>
								<CardContent className="flex items-center gap-3 p-4">
									<User className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-xs text-muted-foreground">
											Owner
										</p>
										<p className="text-sm font-medium">
											{process.owner}
										</p>
									</div>
								</CardContent>
							</Card>
						)}

						{process.goals.length > 0 && (
							<Card>
								<CardContent className="p-4">
									<div className="mb-2 flex items-center gap-2">
										<Target className="h-4 w-4 text-primary" />
										<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											Goals
										</span>
									</div>
									<ul className="space-y-1">
										{process.goals.map((g) => (
											<li
												key={g}
												className="text-sm text-foreground/80"
											>
												• {g}
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						)}

						{process.triggers.length > 0 && (
							<Card>
								<CardContent className="p-4">
									<div className="mb-2 flex items-center gap-2">
										<Zap className="h-4 w-4 text-amber-500" />
										<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											Triggers
										</span>
									</div>
									<ul className="space-y-1">
										{process.triggers.map((t) => (
											<li
												key={t}
												className="text-sm text-foreground/80"
											>
												• {t}
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						)}

						{process.outputs.length > 0 && (
							<Card>
								<CardContent className="p-4">
									<div className="mb-2 flex items-center gap-2">
										<PackageOpen className="h-4 w-4 text-emerald-500" />
										<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											Outputs
										</span>
									</div>
									<ul className="space-y-1">
										{process.outputs.map((o) => (
											<li
												key={o}
												className="text-sm text-foreground/80"
											>
												• {o}
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			)}

			{activeTab === "raci" && <RaciTab processId={process.id} />}

			{activeTab === "consolidation" && (
				<ConsolidationView
					processId={process.id}
					sessionCount={process.sessionsCount}
				/>
			)}
		</div>
	);
}
