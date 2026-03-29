"use client";

import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

export function useNavData() {
	const { activeOrganization } = useActiveOrganization();

	const { data, isLoading } = useQuery({
		...orpc.organizations.navSummary.queryOptions({
			input: {
				organizationId: activeOrganization?.id ?? "",
			},
		}),
		enabled: !!activeOrganization?.id,
		refetchInterval: 60_000,
		staleTime: 30_000,
	});

	return {
		data: data ?? null,
		isLoading,
		hasOrg: !!activeOrganization,
	};
}
