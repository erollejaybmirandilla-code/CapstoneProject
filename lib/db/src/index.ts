import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const dbPath = process.env.DATABASE_URL || "./data/database.db";

const resolvedPath = resolve(dbPath);
const dir = dirname(resolvedPath);
try {
  mkdirSync(dir, { recursive: true });
} catch {}

const sqlite = new Database(resolvedPath);

export const db = drizzle(sqlite, { schema });

export const getDbPath = () => resolvedPath;

export * from "./schema";
