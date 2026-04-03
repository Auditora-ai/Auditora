"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

export function useUnreadCount(organizationId: string | undefined) {
	return useQuery({
		...orpc.notifications.countUnread.queryOptions({
			input: { organizationId: organizationId ?? "" },
		}),
		enabled: !!organizationId,
		refetchInterval: 30_000, // Poll every 30 seconds
		staleTime: 15_000,
	});
}
