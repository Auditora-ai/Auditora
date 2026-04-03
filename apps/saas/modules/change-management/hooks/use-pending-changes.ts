"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";

export function usePendingChanges(organizationId: string | undefined) {
	const queryClient = useQueryClient();

	const pendingQuery = useQuery({
		...orpc.changes.listPending.queryOptions({
			input: { organizationId: organizationId ?? "" },
		}),
		enabled: !!organizationId,
		refetchInterval: 60_000, // Poll every 60 seconds
		staleTime: 30_000,
	});

	const confirmMutation = useMutation({
		mutationFn: ({
			changeConfirmationId,
			comment,
		}: {
			changeConfirmationId: string;
			comment?: string;
		}) =>
			orpcClient.changes.confirm({
				changeConfirmationId,
				comment,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.changes.listPending.queryOptions({
					input: { organizationId: organizationId ?? "" },
				}).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.countUnread.queryOptions({
					input: { organizationId: organizationId ?? "" },
				}).queryKey,
			});
		},
	});

	return {
		pendingChanges: pendingQuery.data ?? [],
		isLoading: pendingQuery.isLoading,
		confirm: confirmMutation.mutate,
		isConfirming: confirmMutation.isPending,
	};
}
