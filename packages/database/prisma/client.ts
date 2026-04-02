import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

type PrismaClientInstance = InstanceType<typeof PrismaClient>;

function createPrismaClient(): PrismaClientInstance {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL,
	});

	return new PrismaClient({ adapter });
}

declare global {
	var prisma: PrismaClientInstance | undefined;
}

/**
 * Lazy-initialized Prisma client singleton.
 * Defers DATABASE_URL check until first actual database call,
 * preventing build-time failures in Next.js route handlers.
 */
let _db: PrismaClientInstance | undefined;

function getDb(): PrismaClientInstance {
	if (!_db) {
		_db = globalThis.prisma ?? createPrismaClient();

		if (process.env.NODE_ENV !== "production") {
			globalThis.prisma = _db;
		}
	}
	return _db;
}

// Use a Proxy so `db` behaves exactly like a PrismaClient instance
// but defers initialization until first property access.
const db = new Proxy({} as PrismaClientInstance, {
	get(_target, prop, receiver) {
		const client = getDb();
		const value = Reflect.get(client, prop, receiver);
		// Bind methods to the actual client instance
		if (typeof value === "function") {
			return value.bind(client);
		}
		return value;
	},
});

export { db };
