import { Router } from "express";
import { db } from "@workspace/db";
import { kycVerificationsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { z } from "zod";

const router = Router();
router.use(requireAuth);

const submitSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().min(1),
  address: z.string().min(1),
  idType: z.string().min(1),
  idNumber: z.string().min(1),
});

router.post("/submit", async (req, res) => {
  const result = submitSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const userId = req.session.userId!;

  const [existing] = await db.select().from(kycVerificationsTable).where(eq(kycVerificationsTable.userId, userId)).limit(1);
  if (existing) {
    const [updated] = await db.update(kycVerificationsTable)
      .set({ ...result.data, status: "pending" })
      .where(eq(kycVerificationsTable.userId, userId))
      .returning();
    await db.update(usersTable).set({ kycStatus: "pending" }).where(eq(usersTable.id, userId));
    res.json(updated);
    return;
  }

  const [kyc] = await db.insert(kycVerificationsTable).values({ userId, ...result.data }).returning();
  await db.update(usersTable).set({ kycStatus: "pending" }).where(eq(usersTable.id, userId));
  res.json(kyc);
});

router.get("/status", async (req, res) => {
  const [kyc] = await db.select().from(kycVerificationsTable).where(eq(kycVerificationsTable.userId, req.session.userId!)).limit(1);
  if (!kyc) {
    res.status(404).json({ error: "No KYC submitted" });
    return;
  }
  res.json(kyc);
});

router.get("/pending", requireRole("admin"), async (req, res) => {
  const pending = await db.select().from(kycVerificationsTable).where(eq(kycVerificationsTable.status, "pending"));
  res.json(pending);
});

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().nullable().optional(),
});

router.put("/:id/review", requireRole("admin"), async (req, res) => {
  const result = reviewSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [kyc] = await db.select().from(kycVerificationsTable).where(eq(kycVerificationsTable.id, req.params.id as string)).limit(1);
  if (!kyc) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db.update(kycVerificationsTable)
    .set({ status: result.data.status, reviewNotes: result.data.reviewNotes ?? null, reviewedAt: new Date() })
    .where(eq(kycVerificationsTable.id, req.params.id as string))
    .returning();

  await db.update(usersTable)
    .set({ kycStatus: result.data.status, isVerified: result.data.status === "approved" })
    .where(eq(usersTable.id, kyc.userId));

  res.json(updated);
});

export default router;
