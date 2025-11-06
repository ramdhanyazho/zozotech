import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

let client: Client | null = null;
let database: LibSQLDatabase | null = null;

type GetDbOptions = {
  optional?: boolean;
};

function isBuilding() {
  const phase = process.env.NEXT_PHASE;
  // NEXT_PHASE hanya bernilai "phase-production-build" (atau "phase-export")
  // ketika proses build dijalankan. Di runtime Vercel variabel VERCEL tetap
  // bernilai "1" sehingga tidak bisa dijadikan indikator build. Hal ini
  // menyebabkan akses database selalu dianggap terjadi saat build dan diblok.
  return phase === "phase-production-build" || phase === "phase-export";
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
