import { PrismaClient as SqlitePrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/**
 * Resolves the active database URL, supporting separate production, Vercel serverless,
 * and test database configurations.
 */
export function resolveDatabaseUrl(): string {
  const isTestEnv =
    process.env.NODE_ENV === "test" ||
    Boolean(process.env.VITEST) ||
    Boolean(process.env.NODE_TEST_CONTEXT);
  if (isTestEnv) {
    return process.env.TEST_DATABASE_URL || "file:./test.db";
  }

  const explicitUrl = process.env.DATABASE_URL;
  if (
    explicitUrl &&
    (explicitUrl.startsWith("postgres://") || explicitUrl.startsWith("postgresql://"))
  ) {
    return explicitUrl;
  }

  // When running on Vercel or AWS Lambda, the working directory is read-only.
  // SQLite must operate in /tmp to allow write access.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || explicitUrl?.includes("/tmp/")) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    if (!fs.existsSync(tmpDbPath)) {
      try {
        const candidates = [
          path.join(process.cwd(), "prisma", "starter.db"),
          path.join(process.cwd(), "dev.db"),
          path.join(__dirname, "..", "..", "prisma", "starter.db"),
        ];
        let copied = false;
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            fs.copyFileSync(candidate, tmpDbPath);
            console.log(`[db] Initialized /tmp/dev.db from ${candidate}`);
            copied = true;
            break;
          }
        }
        if (!copied) {
          console.warn("[db] Warning: No starter database found to copy to /tmp/dev.db");
        }
      } catch (err) {
        console.warn("[db] Failed to copy starter database to /tmp:", err);
      }
    }
    return `file:${tmpDbPath}`;
  }

  // On Render, standard servers, or local dev: auto-bootstrap target SQLite db if not present
  const targetDbUrl = explicitUrl || "file:./dev.db";
  if (targetDbUrl.startsWith("file:")) {
    const rawPath = targetDbUrl.replace(/^file:/, "");
    const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
    if (!fs.existsSync(resolvedPath)) {
      try {
        const candidates = [
          path.join(process.cwd(), "prisma", "starter.db"),
          path.join(__dirname, "..", "..", "prisma", "starter.db"),
        ];
        const dir = path.dirname(resolvedPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            fs.copyFileSync(candidate, resolvedPath);
            console.log(`[db] Initialized ${resolvedPath} from ${candidate}`);
            break;
          }
        }
      } catch (err) {
        console.warn("[db] Failed to bootstrap database file:", err);
      }
    }
  }

  return targetDbUrl;
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
  const currentDbUrl = resolveDatabaseUrl();
  const currentIsPostgres = currentDbUrl.startsWith("postgres://") || currentDbUrl.startsWith("postgresql://");
  const currentProvider = currentIsPostgres ? "postgresql" : "sqlite";

  if (global.prisma && global.__prismaProvider === currentProvider) {
    return global.prisma;
  }

  const client = new ClientConstructor({
    datasources: currentDbUrl ? { db: { url: currentDbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  global.prisma = client;
  global.__prismaProvider = currentProvider;

  return client;
}

export const prisma: SqlitePrismaClient = initPrismaClient();
