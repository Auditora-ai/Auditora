import { createLogoUploadUrl } from "./procedures/create-logo-upload-url";
import { deleteApiKey } from "./procedures/delete-api-key";
import { getAiUsage } from "./procedures/get-ai-usage";
import { getApiKeyStatus } from "./procedures/get-api-key-status";
import { getNavSummary } from "./procedures/get-nav-summary";
import { getSessionCredits } from "./procedures/get-session-credits";
import { generateOrganizationSlug } from "./procedures/generate-organization-slug";
import { saveApiKeys } from "./procedures/save-api-keys";

export const organizationsRouter = {
	generateSlug: generateOrganizationSlug,
	createLogoUploadUrl,
	navSummary: getNavSummary,
	sessionCredits: getSessionCredits,
	ai: {
		usage: getAiUsage,
		saveKeys: saveApiKeys,
		keyStatus: getApiKeyStatus,
		deleteKey: deleteApiKey,
	},
};
