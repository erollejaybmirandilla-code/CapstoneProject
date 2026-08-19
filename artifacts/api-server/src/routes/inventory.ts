import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, vendorsTable, inventoryLogsTable, usersTable } from "@workspace/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { requireRole } from "../lib/auth.js";
import { z } from "zod";

const router = Router();
router.use(requireRole("admin", "staff"));

router.get("/", async (req, res) => {
  const { vendorId, lowStock } = req.query as Record<string, string>;

  const conditions = [eq(productsTable.isActive, true)];
  if (vendorId) conditions.push(eq(productsTable.vendorId, vendorId));
  if (lowStock === "true") conditions.push(lte(productsTable.stock, 10));

  const products = await db.select().from(productsTable).where(and(...conditions));
  const vendors = await db.select({ id: vendorsTable.id, name: vendorsTable.name }).from(vendorsTable);
  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));

  const inventory = products.map(p => ({
    productId: p.id,
    productName: p.name,
    vendorId: p.vendorId,
    vendorName: vendorMap[p.vendorId] ?? "Unknown",
    stock: p.stock,
    sku: p.sku ?? null,
    isActive: p.isActive,
    price: p.price,
  }));
  res.json(inventory);
});

const restockSchema = z.object({
  quantity: z.number().int().min(1),
  notes: z.string().nullable().optional(),
});

router.post("/:productId/restock", async (req, res) => {
  const result = restockSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.productId as string)).limit(1);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const newStock = product.stock + result.data.quantity;
  await db.update(productsTable).set({ stock: newStock }).where(eq(productsTable.id, product.id));
  await db.insert(inventoryLogsTable).values({
    productId: product.id,
    vendorId: product.vendorId,
    userId: req.session.userId!,
    action: "restock",
    quantity: result.data.quantity,
    previousStock: product.stock,
    newStock,
    notes: result.data.notes ?? null,
  });

  const [vendor] = await db.select({ name: vendorsTable.name }).from(vendorsTable).where(eq(vendorsTable.id, product.vendorId)).limit(1);
  res.json({
    productId: product.id,
    productName: product.name,
    vendorId: product.vendorId,
    vendorName: vendor?.name ?? "Unknown",
    stock: newStock,
    sku: product.sku ?? null,
    isActive: product.isActive,
    price: product.price,
  });
});

router.get("/logs", async (req, res) => {
  const { productId, vendorId, limit = "50" } = req.query as Record<string, string>;
  const conditions = [];
  if (productId) conditions.push(eq(inventoryLogsTable.productId, productId));
  if (vendorId) conditions.push(eq(inventoryLogsTable.vendorId, vendorId));

  const logs = await db.select().from(inventoryLogsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(inventoryLogsTable.createdAt))
    .limit(parseInt(limit));

  const enriched = await Promise.all(logs.map(async log => {
    const [product] = await db.select({ name: productsTable.name }).from(productsTable).where(eq(productsTable.id, log.productId)).limit(1);
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, log.userId)).limit(1);
    return { ...log, productName: product?.name ?? null, userName: user?.name ?? null };
  }));
  res.json(enriched);
});

export default router;
