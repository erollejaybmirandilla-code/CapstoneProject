import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, ordersTable } from "@workspace/db/schema";
import { eq, desc, sql, like } from "drizzle-orm";
import { requireAuth, requireRole, hashPassword, comparePassword } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

router.get("/", requireRole("admin"), async (req, res) => {
  const { role, search, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const conditions = [];
  if (role) conditions.push(eq(usersTable.role, role as any));
  if (search) {
    conditions.push(like(usersTable.name, `%${search}%`));
  }

  const whereClause = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable);
  if (whereClause) countQuery.where(whereClause);
  const [countResult] = await countQuery;

  const query = db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      phone: usersTable.phone,
      role: usersTable.role,
      isVerified: usersTable.isVerified,
      kycStatus: usersTable.kycStatus,
      avatarUrl: usersTable.avatarUrl,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(parseInt(limit))
    .offset(parseInt(offset));
  if (whereClause) query.where(whereClause);
  const users = await query;

  res.json({ users, total: Number(countResult.count), offset: parseInt(offset), limit: parseInt(limit) });
});

router.get("/:id", requireRole("admin"), async (req, res) => {
  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      phone: usersTable.phone,
      role: usersTable.role,
      isVerified: usersTable.isVerified,
      kycStatus: usersTable.kycStatus,
      avatarUrl: usersTable.avatarUrl,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.params.id as string))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [orderStats] = await db
    .select({
      totalOrders: sql<number>`count(*)`,
      totalSpent: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
    })
    .from(ordersTable)
    .where(eq(ordersTable.userId, user.id));

  res.json({ ...user, orderStats });
});

router.put("/:id/role", requireRole("admin"), async (req, res) => {
  const { role } = req.body;
  if (!["admin", "staff", "customer"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(usersTable.id, req.params.id as string))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
    });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

router.put("/:id/verify", requireRole("admin"), async (req, res) => {
  const { isVerified } = req.body;

  const [user] = await db
    .update(usersTable)
    .set({ isVerified: !!isVerified, updatedAt: new Date() })
    .where(eq(usersTable.id, req.params.id as string))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      isVerified: usersTable.isVerified,
    });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, req.params.id as string)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, req.params.id as string));
  res.json({ message: "User deleted" });
});

// Self-service profile update
router.put("/me", requireAuth, async (req, res) => {
  const result = updateProfileSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input", details: result.error.flatten() });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ name: result.data.name.trim(), phone: result.data.phone?.trim() || null, updatedAt: new Date() })
    .where(eq(usersTable.id, req.session.userId!))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      phone: usersTable.phone,
      role: usersTable.role,
      isVerified: usersTable.isVerified,
      kycStatus: usersTable.kycStatus,
      avatarUrl: usersTable.avatarUrl,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

// Change password
router.post("/me/password", requireAuth, async (req, res) => {
  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input", details: result.error.flatten() });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const valid = await comparePassword(result.data.currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = await hashPassword(result.data.newPassword);
  await db.update(usersTable).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  res.json({ message: "Password updated successfully" });
});

// Delete own account
router.delete("/me", requireAuth, async (req, res) => {
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, req.session.userId!));
  res.json({ message: "Account deleted" });
});

export default router;
