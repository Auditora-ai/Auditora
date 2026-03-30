import { db } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

export const getPlatformOverview = adminProcedure
	.route({
		method: "GET",
		path: "/admin/overview",
		tags: ["Administration"],
		summary: "Get platform overview with all organizations and their AI usage",
	})
	.input(
		z.object({
			query: z.string().optional(),
		}).optional(),
	)
	.handler(async ({ input }) => {
		const query = input?.query;

		const since = new Date();
		since.setDate(since.getDate() - 30);

		// Get all orgs with member counts and session counts
		const organizations = await db.organization.findMany({
			where: query
				? {
						OR: [
							{ name: { contains: query, mode: "insensitive" } },
							{ slug: { contains: query, mode: "insensitive" } },
						],
					}
				: undefined,
			include: {
				_count: {
					select: {
						members: true,
						sessions: true,
					},
				},
				purchases: {
					where: { status: "active" },
					take: 1,
					orderBy: { createdAt: "desc" },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Get 30-day token usage per org
		const usageByOrg = await db.aiUsageLog.groupBy({
			by: ["organizationId"],
			where: {
				createdAt: { gte: since },
			},
			_sum: {
				inputTokens: true,
				outputTokens: true,
			},
			_count: true,
		});

		const usageMap = new Map(
			usageByOrg.map((u) => [
				u.organizationId,
				{
					totalTokens: (u._sum.inputTokens ?? 0) + (u._sum.outputTokens ?? 0),
					calls: u._count,
				},
			]),
		);

		// Platform totals
		const totalOrgs = organizations.length;
		const totalMembers = organizations.reduce((sum, o) => sum + o._count.members, 0);
		const totalSessions = organizations.reduce((sum, o) => sum + o._count.sessions, 0);
		const totalTokens30d = Array.from(usageMap.values()).reduce((sum, u) => sum + u.totalTokens, 0);

		return {
			platform: {
				totalOrgs,
				totalMembers,
				totalSessions,
				totalTokens30d,
			},
			organizations: organizations.map((org) => {
				const usage = usageMap.get(org.id);
				const budgetPct = org.aiTokenBudget && usage
					? Math.round((usage.totalTokens / org.aiTokenBudget) * 100)
					: null;

				return {
					id: org.id,
					name: org.name,
					slug: org.slug,
					aiTier: org.aiTier ?? "standard",
					aiTokenBudget: org.aiTokenBudget,
					sessionCreditsUsed: org.sessionCreditsUsed,
					sessionCreditsLimit: org.sessionCreditsLimit,
					membersCount: org._count.members,
					sessionsCount: org._count.sessions,
					tokens30d: usage?.totalTokens ?? 0,
					calls30d: usage?.calls ?? 0,
					budgetPct,
					budgetStatus: budgetPct === null
						? "unlimited"
						: budgetPct >= 100
							? "exceeded"
							: budgetPct >= 80
								? "warning"
								: "ok",
					activePlan: org.purchases[0]?.priceId ?? null,
					createdAt: org.createdAt.toISOString(),
				};
			}),
		};
	});
