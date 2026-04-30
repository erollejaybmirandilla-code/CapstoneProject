import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db/schema";
import { asc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const categories = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder));
  res.json(categories);
});

export default router;
