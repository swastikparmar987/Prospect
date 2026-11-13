import { PrismaClient as SqlitePrismaClient } from "@prisma/client";

/**
 * Resolves the active database URL, supporting separate production and test database configurations
 * (`TEST_DATABASE_URL` in test environments vs `DATABASE_URL` in production/runtime).
 */
export function resolveDatabaseUrl(): string {
  const isTestEnv =
    process.env.NODE_ENV === "test" ||
    Boolean(process.env.VITEST) ||
    Boolean(process.env.NODE_TEST_CONTEXT);
  if (isTestEnv) {
    return process.env.TEST_DATABASE_URL || "file:./test.db";
  }
  return process.env.DATABASE_URL || "file:./dev.db";
}

const dbUrl = resolveDatabaseUrl();
const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");
const activeProvider = isPostgres ? "postgresql" : "sqlite";

function getPrismaClientConstructor(): any {
  if (isPostgres) {
    try {
      // Dynamic require to prevent bundling errors when PostgreSQL client is generated
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const postgresModule = require("@prisma/client-postgresql");
      return postgresModule.PrismaClient;
    } catch (err) {
      console.warn(
        "[db] Warning: @prisma/client-postgresql not available, falling back to @prisma/client:",
        err
      );
      return SqlitePrismaClient;
    }
  }
  return SqlitePrismaClient;
}

const ClientConstructor = getPrismaClientConstructor();

declare global {
  var prisma: SqlitePrismaClient | undefined;
  var __prismaProvider: string | undefined;
}

function initPrismaClient(): SqlitePrismaClient {
  if (global.prisma && global.__prismaProvider === activeProvider) {
    return global.prisma;
  }

  const client = new ClientConstructor({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    global.prisma = client;
    global.__prismaProvider = activeProvider;
  }

  return client;
}

export const prisma: SqlitePrismaClient = initPrismaClient();
