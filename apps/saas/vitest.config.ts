import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts"],
	},
	resolve: {
		alias: {
			"@meeting": path.resolve(__dirname, "modules/meeting"),
		},
	},
});
