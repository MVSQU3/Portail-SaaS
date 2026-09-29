import { spawnSync } from "node:child_process";

const env = { ...process.env };
if (!env.DATABASE_URL) {
  env.DATABASE_URL =
    "postgresql://user:password@localhost:5432/fleetcare?schema=public";
}

const result = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 1);
