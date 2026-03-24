"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const POLL_INTERVAL_MS = 5_000;

export function ReviewPoller({ hasInProgress }: { hasInProgress: boolean }) {
	const router = useRouter();

	useEffect(() => {
		if (!hasInProgress) return;

		const interval = setInterval(() => {
			router.refresh();
		}, POLL_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [hasInProgress, router]);

	return null;
}
