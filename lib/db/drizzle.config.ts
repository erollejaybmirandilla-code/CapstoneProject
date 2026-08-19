import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_URL || "./data/database.db";
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
