"use client";

import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import type { SessionData } from "./CommandCenter";

export function ActiveSessionBanner({
	session,
	organizationSlug,
}: {
	session: SessionData;
	organizationSlug: string;
}) {
	const router = useRouter();

	return (
		<div className="flex items-center justify-between border-b border-border bg-green-50 px-6 py-2.5">
			<div className="flex items-center gap-2.5">
				<span className="relative flex h-2 w-2">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
					<span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
				</span>
				<span className="text-sm text-foreground">
					<span className="font-medium">Sesión en curso</span>
					<span className="mx-1.5 text-muted-foreground">/</span>
					{session.processDefinition?.name ?? "Sesión general"}
				</span>
			</div>
			<button
				type="button"
				onClick={() => router.push(`/${organizationSlug}/session/${session.id}/live`)}
				className="flex items-center gap-1.5 rounded-lg bg-chrome-base px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-chrome-raised"
			>
				Retomar
				<ArrowRightIcon className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}
