import { createArchitectureVersion } from "./procedures/create-architecture-version";
import { createProcess } from "./procedures/create-process";
import { createProcessVersion } from "./procedures/create-process-version";
import { deleteProcess } from "./procedures/delete-process";
import { getArchitectureTree } from "./procedures/get-architecture-tree";
import { listProcessVersions } from "./procedures/list-process-versions";
import { rollbackProcessVersion } from "./procedures/rollback-process-version";
import { updateProcess } from "./procedures/update-process";

export const processesRouter = {
	getArchitectureTree,
	create: createProcess,
	update: updateProcess,
	delete: deleteProcess,
	createVersion: createProcessVersion,
	rollbackVersion: rollbackProcessVersion,
	listVersions: listProcessVersions,
	createArchitectureVersion,
};
