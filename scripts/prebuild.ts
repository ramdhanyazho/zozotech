import "dotenv/config";
import { spawnSync } from "node:child_process";

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function collectMissing(keys: string[]) {
  return keys.filter((key) => {
    const value = process.env[key];
    return value === undefined || value === "";
  });
}

const dbEnv = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"];
const seedEnv = ["ADMIN_EMAIL", "ADMIN_PASSWORD"];

const missingDb = collectMissing(dbEnv);
const missingSeed = collectMissing(seedEnv);

if (missingDb.length > 0) {
  console.warn(
    `Skipping \"npm run db:push\" because missing environment variables: ${missingDb.join(", ")}`,
  );
} else {
  run("npm", ["run", "db:push"]);
}

if (missingSeed.length > 0) {
  console.warn(
    `Skipping \"npm run seed\" because missing environment variables: ${missingSeed.join(", ")}`,
  );
} else {
  run("npm", ["run", "seed"]);
}
