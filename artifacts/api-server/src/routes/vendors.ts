import { Router } from "express";
import { db } from "@workspace/db";
import { vendorsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const vendors = await db.select().from(vendorsTable).where(eq(vendorsTable.isActive, true));
  res.json(vendors);
});

router.get("/:id", async (req, res) => {
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, req.params.id as string)).limit(1);
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }
  res.json(vendor);
});

export default router;
