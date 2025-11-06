import "dotenv/config";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

type PackageJson = {
  scripts?: Record<string, string>;
};

function loadPackageJson(): PackageJson {
  const raw = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  return JSON.parse(raw) as PackageJson;
}

function hasScript(pkg: PackageJson, name: string) {
  return typeof pkg.scripts?.[name] === "string" && pkg.scripts[name]!.trim() !== "";
}

function runCommand(command: string, args: string[]) {
  console.log(`[prebuild] run: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}`);
  }

  if (result.signal) {
    throw new Error(`${command} terminated by signal ${result.signal}`);
  }
}

function ensureEnv(name: string) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env: ${name}`);
  }
}

async function main() {
  console.log("[prebuild] start");

  const allowMigrate = process.env.ALLOW_MIGRATE_ON_VERCEL === "1";
  if (!allowMigrate) {
    console.log("[prebuild] skip: ALLOW_MIGRATE_ON_VERCEL!=1");
    process.exit(0);
  }

  ensureEnv("TURSO_DATABASE_URL");
  ensureEnv("TURSO_AUTH_TOKEN");

  const pkg = loadPackageJson();

  runCommand("npm", ["run", "db:push"]);

  if (hasScript(pkg, "seed")) {
    runCommand("npm", ["run", "seed"]);
  } else {
    console.log("[prebuild] skip: no \"seed\" script");
  }

  if (process.env.RUN_IMPORT_JSON === "1") {
    if (hasScript(pkg, "import:json")) {
      runCommand("npm", ["run", "import:json"]);
    } else {
      console.log("[prebuild] skip: no \"import:json\" script");
    }
  }

  console.log("[prebuild] success");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[prebuild] error: Prebuild migration failed: ${message}`);
  console.error("[prebuild] hint: Periksa TURSO_DATABASE_URL/TURSO_AUTH_TOKEN dan izin akses DB.");
  process.exit(1);
});
