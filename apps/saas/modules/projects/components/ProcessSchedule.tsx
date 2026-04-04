"use client";

import { Button } from "@repo/ui";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { Label } from "@repo/ui/components/label";
import {
	CalendarIcon,
	PlayIcon,
	CheckSquareIcon,
	ClockIcon,
	ArrowRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type ProcessData = {
	id: string;
	name: string;
	processStatus: string;
	children: {
		id: string;
		name: string;
		level: string;
		processStatus: string;
	}[];
	sessions: {
		id: string;
		type: string;
		status: string;
		createdAt: string;
	}[];
};

interface ProcessScheduleProps {
	process: ProcessData;
	organizationSlug: string;
}

const STATUS_ORDER = ["DRAFT", "MAPPED", "VALIDATED", "APPROVED"];

const STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "error"> =
	{
		DRAFT: "info",
		MAPPED: "warning",
		VALIDATED: "success",
		APPROVED: "success",
	};

const ACTION_TYPES = [
	{ value: "DEEP_DIVE", label: "Deep Dive Session" },
	{ value: "REVIEW", label: "Review & Validation" },
	{ value: "VALIDATION", label: "Stakeholder Validation" },
];

export function ProcessSchedule({
	process,
	organizationSlug,
}: ProcessScheduleProps) {
	const t = useTranslations("processes");
	const sessionUrl = `/${organizationSlug}/descubrir/new?processId=${process.id}&type=DEEP_DIVE`;

	const currentStatusIndex = STATUS_ORDER.indexOf(process.processStatus);
	const nextStatus = currentStatusIndex < STATUS_ORDER.length - 1
		? STATUS_ORDER[currentStatusIndex + 1]
		: null;

	const sessions = process.sessions ?? [];
	const lastSession = sessions[0];
	const hasActiveSessions = sessions.some(
		(s) => s.status === "ACTIVE" || s.status === "CONNECTING",
	);

	// Determine next recommended action
	const getRecommendation = () => {
		if (process.processStatus === "DRAFT" && sessions.length === 0) {
			return {
				action: "Start first Deep Dive session",
				description: "This process has no sessions yet. Schedule a deep dive to begin mapping.",
				type: "DEEP_DIVE",
			};
		}
		if (process.processStatus === "DRAFT" && sessions.length > 0) {
			return {
				action: "Continue mapping with another Deep Dive",
				description: "The process is still in draft. Continue mapping with additional sessions.",
				type: "DEEP_DIVE",
			};
		}
		if (process.processStatus === "MAPPED") {
			return {
				action: "Schedule validation session",
				description: "The process is mapped. Next step: validate with stakeholders.",
				type: "VALIDATION",
			};
		}
		if (process.processStatus === "VALIDATED") {
			return {
				action: "Seek final approval",
				description: "The process is validated. Schedule a final review for approval.",
				type: "REVIEW",
			};
		}
		return null;
	};

	const recommendation = getRecommendation();

	// Children that still need work
	const draftChildren = process.children.filter((c) => c.processStatus === "DRAFT");
	const mappedChildren = process.children.filter((c) => c.processStatus === "MAPPED");

	return (
		<div className="space-y-6">
			{/* Status Progress */}
			<Card className="border border-border">
				<CardHeader>
					<CardTitle className="text-base">Process Status Workflow</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2">
						{STATUS_ORDER.map((status, i) => {
							const isActive = status === process.processStatus;
							const isPast = i < currentStatusIndex;
							return (
								<div key={status} className="flex items-center gap-2">
									{i > 0 && (
										<ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
									)}
									<Badge
										status={
											isActive
												? STATUS_VARIANT[status]
												: isPast
													? "success"
													: "info"
										}
										className={`text-xs ${isActive ? "ring-2 ring-primary ring-offset-2" : isPast ? "" : "opacity-50"}`}
									>
										{t(status.toLowerCase() as "draft" | "mapped" | "validated" | "approved")}
									</Badge>
								</div>
							);
						})}
					</div>
					{nextStatus && (
						<p className="mt-3 text-sm text-muted-foreground">
							Next milestone:{" "}
							<span className="font-medium text-foreground">
								{t(nextStatus.toLowerCase() as "draft" | "mapped" | "validated" | "approved")}
							</span>
						</p>
					)}
				</CardContent>
			</Card>

			{/* Recommendation */}
			{recommendation && (
				<Card className="border border-primary/30 bg-primary/5">
					<CardContent className="flex items-center justify-between p-4">
						<div className="flex items-center gap-4">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<CalendarIcon className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="font-medium text-foreground">
									{recommendation.action}
								</p>
								<p className="text-sm text-muted-foreground">
									{recommendation.description}
								</p>
							</div>
						</div>
						<Button asChild>
							<Link href={sessionUrl}>
								<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
								{t("startDeepDive")}
							</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Children needing work */}
			{(draftChildren.length > 0 || mappedChildren.length > 0) && (
				<Card className="border border-border">
					<CardHeader>
						<CardTitle className="text-base">Sub-processes Needing Attention</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{draftChildren.length > 0 && (
							<div>
								<p className="mb-2 text-sm font-medium text-muted-foreground">
									Draft ({draftChildren.length})
								</p>
								<div className="space-y-1.5">
									{draftChildren.map((child) => (
										<Link
											key={child.id}
											href={`/${organizationSlug}/procesos/${child.id}`}
											className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent/50"
										>
											<span className="font-medium">{child.name}</span>
											<Badge status="info" className="text-xs">
												{t("draft")}
											</Badge>
										</Link>
									))}
								</div>
							</div>
						)}
						{mappedChildren.length > 0 && (
							<div>
								<p className="mb-2 text-sm font-medium text-muted-foreground">
									Mapped - Ready for Validation ({mappedChildren.length})
								</p>
								<div className="space-y-1.5">
									{mappedChildren.map((child) => (
										<Link
											key={child.id}
											href={`/${organizationSlug}/procesos/${child.id}`}
											className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent/50"
										>
											<span className="font-medium">{child.name}</span>
											<Badge status="warning" className="text-xs">
												{t("mapped")}
											</Badge>
										</Link>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Quick Stats */}
			<div className="grid grid-cols-3 gap-4">
				<Card className="border border-border">
					<CardContent className="p-4 text-center">
						<p className="text-2xl font-bold text-foreground">
							{sessions.length}
						</p>
						<p className="text-xs text-muted-foreground">Total Sessions</p>
					</CardContent>
				</Card>
				<Card className="border border-border">
					<CardContent className="p-4 text-center">
						<p className="text-2xl font-bold text-foreground">
							{process.children.length}
						</p>
						<p className="text-xs text-muted-foreground">Sub-processes</p>
					</CardContent>
				</Card>
				<Card className="border border-border">
					<CardContent className="p-4 text-center">
						<p className="text-2xl font-bold text-foreground">
							{lastSession
								? new Date(lastSession.createdAt).toLocaleDateString()
								: "N/A"}
						</p>
						<p className="text-xs text-muted-foreground">Last Session</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
