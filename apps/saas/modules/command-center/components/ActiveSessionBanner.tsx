"use client";

import { useRouter } from "next/navigation";
import { PlayIcon } from "lucide-react";
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
		<div className="flex items-center justify-between bg-[#16A34A] px-6 py-2.5">
			<div className="flex items-center gap-3">
				<span className="relative flex h-2.5 w-2.5">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
					<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
				</span>
				<span className="text-sm font-medium text-white">
					Sesión en curso: {session.processDefinition?.name ?? "Sesión general"}
				</span>
			</div>
			<button
				type="button"
				onClick={() => router.push(`/${organizationSlug}/session/${session.id}/live`)}
				className="flex items-center gap-1.5 rounded-md bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30"
			>
				<PlayIcon className="h-3 w-3" />
				Retomar
			</button>
		</div>
	);
}
