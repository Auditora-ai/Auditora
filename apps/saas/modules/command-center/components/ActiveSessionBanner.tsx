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
		<div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F0FDF4] px-6 py-2.5">
			<div className="flex items-center gap-2.5">
				<span className="relative flex h-2 w-2">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-75" />
					<span className="relative inline-flex h-2 w-2 rounded-full bg-[#16A34A]" />
				</span>
				<span className="text-sm text-[#334155]">
					<span className="font-medium">Sesión en curso</span>
					<span className="mx-1.5 text-[#CBD5E1]">/</span>
					{session.processDefinition?.name ?? "Sesión general"}
				</span>
			</div>
			<button
				type="button"
				onClick={() => router.push(`/${organizationSlug}/session/${session.id}/live`)}
				className="flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1E293B]"
			>
				Retomar
				<ArrowRightIcon className="h-3 w-3" />
			</button>
		</div>
	);
}
