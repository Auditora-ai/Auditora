"use client";

import { Button } from "@repo/ui";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { PageHeader } from "@shared/components/PageHeader";
import { ArchitectureTree } from "@projects/components/ArchitectureTree";
import { VersionHistory } from "@shared/components/VersionHistory";
import {
	ArrowLeftIcon,
	PlusIcon,
	PlayIcon,
	EyeIcon,
	ClockIcon,
	FileTextIcon,
	DownloadIcon,
	TrashIcon,
	UploadIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type ProcessDefinition = {
	id: string;
	name: string;
	description: string | null;
	level: string;
	parentId: string | null;
	processStatus: string;
	priority: number;
};

type ArchitectureVersion = {
	id: string;
	version: number;
	snapshot: unknown;
	changeNote: string | null;
	createdBy: string;
	createdAt: Date;
};

type Session = {
	id: string;
	type: string;
	status: string;
	createdAt: Date;
	processDefinition: {
		id: string;
		name: string;
	} | null;
};

type Document = {
	id: string;
	name: string;
	mimeType: string;
	fileSize: number;
	createdAt: Date;
};

type Project = {
	id: string;
	name: string;
	description: string | null;
	goals: string[];
	status: string;
	clientId: string;
	client: {
		id: string;
		name: string;
	};
	architecture: {
		id: string;
		definitions: ProcessDefinition[];
		versions: ArchitectureVersion[];
	} | null;
	sessions: Session[];
	documents: Document[];
};

const SESSION_STATUS_VARIANT: Record<
	string,
	"success" | "info" | "warning" | "error"
> = {
	ACTIVE: "info",
	CONNECTING: "warning",
	ENDED: "success",
	FAILED: "error",
	SCHEDULED: "info",
};

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectDashboard({
	project,
	organizationSlug,
	clientId,
}: {
	project: Project;
	organizationSlug: string;
	clientId: string;
}) {
	const t = useTranslations("projects");
	const tClients = useTranslations("clients");

	const definitions = project.architecture?.definitions ?? [];
	const versions = project.architecture?.versions ?? [];

	return (
		<div>
			<div className="mb-6 flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link
						href={`/${organizationSlug}/clients/${clientId}`}
					>
						<ArrowLeftIcon className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<PageHeader title={project.name} className="mb-0" />
					<p className="text-sm text-muted-foreground">
						{project.client.name}
					</p>
				</div>
			</div>

			<Tabs defaultValue="architecture">
				<TabsList>
					<TabsTrigger value="architecture">
						{t("architecture")}
					</TabsTrigger>
					<TabsTrigger value="sessions">
						{t("sessions")}
					</TabsTrigger>
					<TabsTrigger value="documents">
						{tClients("documents")}
					</TabsTrigger>
					<TabsTrigger value="versions">
						{t("versions")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="architecture" className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-lg font-semibold">
							{t("architecture")}
						</h3>
						<div className="flex items-center gap-2">
							<Button variant="secondary">
								<PlusIcon className="mr-2 h-4 w-4" />
								{t("addProcess")}
							</Button>
							<Button>
								<PlayIcon className="mr-2 h-4 w-4" />
								{t("startDiscovery")}
							</Button>
						</div>
					</div>

					{definitions.length === 0 ? (
						<Card>
							<div className="flex flex-col items-center justify-center p-12 text-center">
								<p className="text-sm text-muted-foreground">
									No processes defined yet. Add your first
									process or start a discovery session.
								</p>
							</div>
						</Card>
					) : (
						<Card className="border border-border p-4">
							<ArchitectureTree
								definitions={definitions}
								organizationSlug={organizationSlug}
								clientId={clientId}
								projectId={project.id}
							/>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="sessions" className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-lg font-semibold">
							{t("sessions")}
						</h3>
						<Button>
							<PlayIcon className="mr-2 h-4 w-4" />
							{t("startSession")}
						</Button>
					</div>

					{project.sessions.length === 0 ? (
						<Card>
							<div className="flex flex-col items-center justify-center p-12 text-center">
								<p className="text-sm text-muted-foreground">
									No sessions yet.
								</p>
							</div>
						</Card>
					) : (
						<div className="space-y-3">
							{project.sessions.map((session) => (
								<Card
									key={session.id}
									className="border border-border"
								>
									<CardContent className="flex items-center justify-between p-4">
										<div className="flex items-center gap-4">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
												<ClockIcon className="h-5 w-5 text-primary" />
											</div>
											<div>
												<p className="font-medium text-foreground">
													{session.type ===
													"DISCOVERY"
														? "Discovery"
														: "Deep Dive"}
												</p>
												<p className="text-xs text-muted-foreground">
													{session.processDefinition
														?.name ?? "General"}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<Badge
												status={
													SESSION_STATUS_VARIANT[
														session.status
													] || "info"
												}
											>
												{session.status}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{new Date(
													session.createdAt,
												).toLocaleDateString()}
											</span>
											{session.status === "ACTIVE" ||
											session.status === "CONNECTING" ? (
												<Button
													size="sm"
													variant="primary"
													asChild
												>
													<Link
														href={`/${organizationSlug}/session/${session.id}/live`}
													>
														<PlayIcon className="mr-1 h-3 w-3" />
														Join
													</Link>
												</Button>
											) : (
												<Button
													size="sm"
													variant="secondary"
													asChild
												>
													<Link
														href={`/${organizationSlug}/session/${session.id}`}
													>
														<EyeIcon className="mr-1 h-3 w-3" />
														View
													</Link>
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="documents" className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-lg font-semibold">
							{tClients("documents")}
						</h3>
						<Button>
							<UploadIcon className="mr-2 h-4 w-4" />
							Upload
						</Button>
					</div>

					{project.documents.length === 0 ? (
						<Card>
							<div className="flex flex-col items-center justify-center p-12 text-center">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
									<FileTextIcon className="h-6 w-6 text-primary" />
								</div>
								<p className="text-sm text-muted-foreground">
									No documents uploaded yet.
								</p>
							</div>
						</Card>
					) : (
						<Card>
							<table className="w-full">
								<thead>
									<tr className="border-b border-border text-left text-sm text-muted-foreground">
										<th className="p-4 font-medium">
											Name
										</th>
										<th className="p-4 font-medium">
											Type
										</th>
										<th className="p-4 font-medium">
											Size
										</th>
										<th className="p-4 font-medium">
											Date
										</th>
										<th className="p-4 text-right font-medium">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{project.documents.map((doc) => (
										<tr
											key={doc.id}
											className="border-b border-border last:border-0"
										>
											<td className="p-4">
												<div className="flex items-center gap-2">
													<FileTextIcon className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium text-foreground">
														{doc.name}
													</span>
												</div>
											</td>
											<td className="p-4 text-sm text-muted-foreground">
												{doc.mimeType.split("/").pop()}
											</td>
											<td className="p-4 text-sm text-muted-foreground">
												{formatFileSize(doc.fileSize)}
											</td>
											<td className="p-4 text-sm text-muted-foreground">
												{new Date(
													doc.createdAt,
												).toLocaleDateString()}
											</td>
											<td className="p-4 text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
													>
														<DownloadIcon className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
													>
														<TrashIcon className="h-4 w-4" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="versions" className="mt-6">
					<h3 className="mb-4 text-lg font-semibold">
						{t("versions")}
					</h3>

					{versions.length === 0 ? (
						<Card>
							<div className="flex flex-col items-center justify-center p-12 text-center">
								<p className="text-sm text-muted-foreground">
									No version history yet.
								</p>
							</div>
						</Card>
					) : (
						<VersionHistory
							versions={versions.map((v) => ({
								version: v.version,
								changeNote: v.changeNote ?? undefined,
								createdBy: v.createdBy,
								createdAt: v.createdAt,
							}))}
							onRollback={(version) => {
								// TODO: implement rollback
								console.log("Rollback to version", version);
							}}
						/>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
