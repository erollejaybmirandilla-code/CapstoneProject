import { rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

for (const f of ["package-lock.json", "yarn.lock"]) {
  try {
    rmSync(resolve(root, f), { force: true });
  } catch {}
}

const userAgent = process.env.npm_config_user_agent || "";
if (!userAgent.includes("pnpm")) {
  console.error("Use pnpm instead");
  process.exit(1);
}
