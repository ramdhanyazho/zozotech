import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

let client: Client | null = null;
let database: LibSQLDatabase | null = null;

type GetDbOptions = {
  optional?: boolean;
};

export function getDb(): LibSQLDatabase;
export function getDb(options: { optional: true }): LibSQLDatabase | null;
export function getDb(options?: GetDbOptions) {
  if (!client || !database) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      if (options?.optional) {
        return null;
      }
      throw new Error("TURSO_DATABASE_URL is not set");
    }

    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    database = drizzle(client);
  }

  if (!database) {
    if (options?.optional) {
      return null;
    }
    throw new Error("Failed to initialize database client");
  }

  return database;
}
