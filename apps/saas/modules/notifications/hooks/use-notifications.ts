"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";

export function useNotifications(organizationId: string | undefined) {
	const queryClient = useQueryClient();

	const notificationsQuery = useQuery({
		...orpc.notifications.list.queryOptions({
			input: {
				organizationId: organizationId ?? "",
				limit: 20,
			},
		}),
		enabled: !!organizationId,
		refetchInterval: 30_000,
		staleTime: 15_000,
	});

	const markReadMutation = useMutation({
		mutationFn: (id: string) => orpcClient.notifications.markRead({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.list.queryOptions({
					input: { organizationId: organizationId ?? "", limit: 20 },
				}).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.countUnread.queryOptions({
					input: { organizationId: organizationId ?? "" },
				}).queryKey,
			});
		},
	});

	const markAllReadMutation = useMutation({
		mutationFn: () =>
			orpcClient.notifications.markAllRead({
				organizationId: organizationId ?? "",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.list.queryOptions({
					input: { organizationId: organizationId ?? "", limit: 20 },
				}).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.countUnread.queryOptions({
					input: { organizationId: organizationId ?? "" },
				}).queryKey,
			});
		},
	});

	const archiveMutation = useMutation({
		mutationFn: (id: string) => orpcClient.notifications.archive({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.list.queryOptions({
					input: { organizationId: organizationId ?? "", limit: 20 },
				}).queryKey,
			});
		},
	});

	return {
		notifications: notificationsQuery.data?.items ?? [],
		hasMore: notificationsQuery.data?.hasMore ?? false,
		isLoading: notificationsQuery.isLoading,
		markRead: markReadMutation.mutate,
		markAllRead: markAllReadMutation.mutate,
		archive: archiveMutation.mutate,
	};
}
