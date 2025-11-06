import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

let client: Client | null = null;
let database: LibSQLDatabase | null = null;

type GetDbOptions = {
  optional?: boolean;
};

function isBuilding() {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.VERCEL === "1"
  );
}

function looksLikeTursoUrl(url?: string | null): url is string {
  if (!url) return false;
  return url.startsWith("libsql://") || url.startsWith("file:");
}

function requiresAuthToken(url: string) {
  return url.startsWith("libsql://") || url.startsWith("http://") || url.startsWith("https://");
}

export function getDb(): LibSQLDatabase;
export function getDb(options: { optional: true }): LibSQLDatabase | null;
export function getDb(options?: GetDbOptions) {
  const optional = options?.optional ?? false;

  const allowDuringBuild = process.env.ALLOW_DB_DURING_BUILD === "1";
  if (isBuilding() && !allowDuringBuild) {
    if (optional) {
      return null;
    }
    throw new Error(
      "DB access is disabled during build. Set ALLOW_DB_DURING_BUILD=1 to override."
    );
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!looksLikeTursoUrl(url)) {
    if (optional) {
      return null;
    }
    throw new Error(
      "Invalid TURSO_DATABASE_URL/TURSO_AUTH_TOKEN. Set correct credentials or use optional mode."
    );
  }

  if (requiresAuthToken(url) && (!authToken || authToken.trim() === "")) {
    if (optional) {
      return null;
    }
    throw new Error(
      "Invalid TURSO_DATABASE_URL/TURSO_AUTH_TOKEN. Set correct credentials or use optional mode."
    );
  }

  if (!client || !database) {
    client = createClient({
      url,
      authToken,
    });

    database = drizzle(client);
  }

  if (!database) {
    if (optional) {
      return null;
    }
    throw new Error("Failed to initialize database client");
  }

  return database;
}
