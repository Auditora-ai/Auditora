"use client";

import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { PlayIcon, EyeIcon, ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProcessSession } from "../../types";
import { SESSION_STATUS_VARIANT } from "../../types";

interface SessionesTabProps {
	sessions?: ProcessSession[];
	organizationSlug: string;
	processId: string;
}

export function SessionesTab({ sessions, organizationSlug, processId }: SessionesTabProps) {
	const t = useTranslations("processLibrary.sidebar");

	if (!sessions || sessions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<ClockIcon className="mb-2 h-6 w-6 text-muted-foreground/40" />
				<p className="text-xs text-muted-foreground mb-3">
					{t("noSessions")}
				</p>
				<Button size="sm" asChild>
					<Link href={`/${organizationSlug}/sessions/new?processId=${processId}&type=DEEP_DIVE`}>
						<PlayIcon className="mr-1 h-3.5 w-3.5" />
						Deep Dive
					</Link>
				</Button>
			</div>
		);
	}

	const lastSession = sessions[0];

	return (
		<div className="space-y-2">
			<div className="flex gap-1.5 mb-3">
				{lastSession?.status === "ENDED" && (
					<Button variant="secondary" size="sm" className="text-xs h-7 flex-1" asChild>
						<Link href={`/${organizationSlug}/sessions/new?processId=${processId}&type=DEEP_DIVE&continuationOf=${lastSession.id}`}>
							Continuar
						</Link>
					</Button>
				)}
				<Button size="sm" className="text-xs h-7 flex-1" asChild>
					<Link href={`/${organizationSlug}/sessions/new?processId=${processId}&type=DEEP_DIVE`}>
						<PlayIcon className="mr-1 h-3.5 w-3.5" />
						Deep Dive
					</Link>
				</Button>
			</div>

			{sessions.map((session) => (
				<div key={session.id} className="flex items-center justify-between rounded-md border px-2.5 py-2">
					<div>
						<div className="flex items-center gap-1.5">
							<span className="text-xs font-medium">
								{session.type === "DISCOVERY" ? "Discovery" : "Deep Dive"}
							</span>
							<Badge status={SESSION_STATUS_VARIANT[session.status] || "info"} className="text-[10px]">
								{session.status}
							</Badge>
						</div>
						<div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
							<span>{session._count.diagramNodes} nodos</span>
							<span>{new Date(session.createdAt).toLocaleDateString()}</span>
						</div>
					</div>
					<Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
						{session.status === "ACTIVE" || session.status === "CONNECTING" ? (
							<Link href={`/${organizationSlug}/session/${session.id}/live`}>
								<PlayIcon className="h-3.5 w-3.5" />
							</Link>
						) : (
							<Link href={`/${organizationSlug}/session/${session.id}`}>
								<EyeIcon className="h-3.5 w-3.5" />
							</Link>
						)}
					</Button>
				</div>
			))}
		</div>
	);
}
