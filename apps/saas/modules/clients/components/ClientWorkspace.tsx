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
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { PageHeader } from "@shared/components/PageHeader";
import {
	ArrowLeftIcon,
	PlusIcon,
	FolderIcon,
	FileTextIcon,
	DownloadIcon,
	TrashIcon,
	ClockIcon,
	PlayIcon,
	EyeIcon,
	UploadIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Client = {
	id: string;
	name: string;
	industry: string | null;
	operationsProfile: string | null;
	businessModel: string | null;
	employeeCount: string | null;
	notes: string | null;
	projects: Array<{
		id: string;
		name: string;
		description: string | null;
		goals: string[];
		status: string;
		createdAt: Date;
		_count: { sessions: number };
	}>;
	documents: Array<{
		id: string;
		name: string;
		mimeType: string;
		fileSize: number;
		createdAt: Date;
	}>;
};

type Session = {
	id: string;
	type: string;
	status: string;
	createdAt: Date;
	project: {
		id: string;
		name: string;
	};
	processDefinition: {
		id: string;
		name: string;
	} | null;
};

const STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "error"> =
	{
		ACTIVE: "info",
		COMPLETED: "success",
		ON_HOLD: "warning",
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

function getFileTypeIcon(mimeType: string) {
	return FileTextIcon;
}

export function ClientWorkspace({
	client,
	sessions,
	organizationSlug,
}: {
	client: Client;
	sessions: Session[];
	organizationSlug: string;
}) {
	const t = useTranslations("clients");
	const [industry, setIndustry] = useState(client.industry ?? "");
	const [businessModel, setBusinessModel] = useState(
		client.businessModel ?? "",
	);
	const [operations, setOperations] = useState(
		client.operationsProfile ?? "",
	);
	const [employees, setEmployees] = useState(client.employeeCount ?? "");
	const [notes, setNotes] = useState(client.notes ?? "");

	return (
		<div>
			<div className="mb-6 flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link href={`/${organizationSlug}/clients`}>
						<ArrowLeftIcon className="h-4 w-4" />
					</Link>
				</Button>
				<PageHeader title={client.name} className="mb-0" />
			</div>

			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">{t("overview")}</TabsTrigger>
					<TabsTrigger value="projects">{t("projects")}</TabsTrigger>
					<TabsTrigger value="documents">
						{t("documents")}
					</TabsTrigger>
					<TabsTrigger value="sessions">
						{t("sessionHistory")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-6">
					<div className="grid gap-6 md:grid-cols-2">
						<Card className="border border-border">
							<CardHeader>
								<CardTitle className="text-base">
									{t("industry")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Input
									value={industry}
									onChange={(e) =>
										setIndustry(e.target.value)
									}
									placeholder={t("industry")}
								/>
							</CardContent>
						</Card>

						<Card className="border border-border">
							<CardHeader>
								<CardTitle className="text-base">
									{t("businessModel")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Textarea
									value={businessModel}
									onChange={(e) =>
										setBusinessModel(e.target.value)
									}
									placeholder={t("businessModel")}
									rows={3}
								/>
							</CardContent>
						</Card>

						<Card className="border border-border">
							<CardHeader>
								<CardTitle className="text-base">
									{t("operations")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Textarea
									value={operations}
									onChange={(e) =>
										setOperations(e.target.value)
									}
									placeholder={t("operations")}
									rows={3}
								/>
							</CardContent>
						</Card>

						<Card className="border border-border">
							<CardHeader>
								<CardTitle className="text-base">
									{t("employees")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Input
									value={employees}
									onChange={(e) =>
										setEmployees(e.target.value)
									}
									placeholder={t("employees")}
								/>
							</CardContent>
						</Card>

						<Card className="border border-border md:col-span-2">
							<CardHeader>
								<CardTitle className="text-base">
									{t("notes")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder={t("notes")}
									rows={6}
								/>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="projects" className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-lg font-semibold">
							{t("projects")}
						</h3>
						<Button asChild>
							<Link
								href={`/${organizationSlug}/clients/${client.id}/projects/new`}
							>
								<PlusIcon className="mr-2 h-4 w-4" />
								{useTranslations("projects")("newProject")}
							</Link>
						</Button>
					</div>

					{client.projects.length === 0 ? (
						<Card>
							<div className="flex flex-col items-center justify-center p-12 text-center">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
									<FolderIcon className="h-6 w-6 text-primary" />
								</div>
								<p className="text-sm text-muted-foreground">
									No projects yet.
								</p>
							</div>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{client.projects.map((project) => (
								<Link
									key={project.id}
									href={`/${organizationSlug}/clients/${client.id}/projects/${project.id}`}
								>
									<Card className="border border-border transition-colors hover:bg-accent/50">
										<CardHeader>
											<div className="flex items-start justify-between">
												<CardTitle className="text-base">
													{project.name}
												</CardTitle>
												<Badge
													status={
														STATUS_VARIANT[
															project.status
														] || "info"
													}
												>
													{project.status}
												</Badge>
											</div>
										</CardHeader>
										<CardContent>
											{project.goals.length > 0 && (
												<p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
													{project.goals.join(", ")}
												</p>
											)}
											<div className="flex items-center justify-between text-xs text-muted-foreground">
												<span>
													{project._count.sessions}{" "}
													sessions
												</span>
												<div className="flex items-center gap-1">
													<ClockIcon className="h-3 w-3" />
													{new Date(
														project.createdAt,
													).toLocaleDateString()}
												</div>
											</div>
										</CardContent>
									</Card>
								</Link>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="documents" className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-lg font-semibold">
							{t("documents")}
						</h3>
						<Button>
							<UploadIcon className="mr-2 h-4 w-4" />
							Upload
						</Button>
					</div>

					{client.documents.length === 0 ? (
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
									{client.documents.map((doc) => {
										const Icon = getFileTypeIcon(
											doc.mimeType,
										);
										return (
											<tr
												key={doc.id}
												className="border-b border-border last:border-0"
											>
												<td className="p-4">
													<div className="flex items-center gap-2">
														<Icon className="h-4 w-4 text-muted-foreground" />
														<span className="font-medium text-foreground">
															{doc.name}
														</span>
													</div>
												</td>
												<td className="p-4 text-sm text-muted-foreground">
													{doc.mimeType
														.split("/")
														.pop()}
												</td>
												<td className="p-4 text-sm text-muted-foreground">
													{formatFileSize(
														doc.fileSize,
													)}
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
										);
									})}
								</tbody>
							</table>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="sessions" className="mt-6">
					<h3 className="mb-4 text-lg font-semibold">
						{t("sessionHistory")}
					</h3>

					{sessions.length === 0 ? (
						<Card>
							<div className="flex flex-col items-center justify-center p-12 text-center">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
									<ClockIcon className="h-6 w-6 text-primary" />
								</div>
								<p className="text-sm text-muted-foreground">
									No sessions yet.
								</p>
							</div>
						</Card>
					) : (
						<div className="space-y-3">
							{sessions.map((session) => (
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
													{session.project.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{session.type ===
													"DISCOVERY"
														? "Discovery"
														: "Deep Dive"}
													{session.processDefinition &&
														` - ${session.processDefinition.name}`}
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
			</Tabs>
		</div>
	);
}
