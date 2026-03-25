import { findOrganization } from "./procedures/find-organization";
import { listOrganizations } from "./procedures/list-organizations";
import { listUsers } from "./procedures/list-users";
import { updateOrgAiConfig } from "./procedures/update-org-ai-config";
import { getOrgUsage } from "./procedures/get-org-usage";
import { getPlatformOverview } from "./procedures/get-platform-overview";

export const adminRouter = {
	users: {
		list: listUsers,
	},
	organizations: {
		list: listOrganizations,
		find: findOrganization,
		updateAiConfig: updateOrgAiConfig,
		usage: getOrgUsage,
	},
	overview: getPlatformOverview,
};
