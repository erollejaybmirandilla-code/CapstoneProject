import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, vendorsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

async function enrichProducts(products: typeof productsTable.$inferSelect[]) {
  const { categoriesTable } = await import("@workspace/db/schema");
  const vendors = await db.select({ id: vendorsTable.id, name: vendorsTable.name }).from(vendorsTable);
  const categories = await db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable);
  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
  return products.map(p => ({
    ...p,
    vendorName: vendorMap[p.vendorId] ?? null,
    categoryName: categoryMap[p.categoryId] ?? null,
  }));
}

const createVendorProductSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  price: z.number().positive(),
  compareAtPrice: z.number().nullable().optional(),
  unit: z.string().optional().default("piece"),
  stock: z.number().int().min(0),
  images: z.array(z.string()).optional().default([]),
  isBestSeller: z.boolean().optional().default(false),
  isSeasonal: z.boolean().optional().default(false),
  sku: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  ingredients: z.string().nullable().optional(),
  expirationMonths: z.number().int().nullable().optional(),
  weight: z.string().nullable().optional(),
});

async function findVendorForUser(userId: string) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(and(eq(vendorsTable.ownerId, userId), eq(vendorsTable.isActive, true)))
    .limit(1);
  return vendor ?? null;
}

router.get("/", requireAuth, async (req, res) => {
  const vendor = await findVendorForUser(req.session.userId!);
  if (!vendor) {
    res.status(403).json({ error: "User does not own an active vendor" });
    return;
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.vendorId, vendor.id));

  const enriched = await enrichProducts(products);
  res.json({ vendorId: vendor.id, products: enriched });
});

router.post("/", requireAuth, async (req, res) => {
  const vendor = await findVendorForUser(req.session.userId!);
  if (!vendor) {
    res.status(403).json({ error: "User does not own an active vendor" });
    return;
  }

  const result = createVendorProductSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input", issues: result.error.issues });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ ...result.data, vendorId: vendor.id })
    .returning();

  await db
    .update(vendorsTable)
    .set({ totalProducts: sql`total_products + 1` })
    .where(eq(vendorsTable.id, vendor.id));

  const [enriched] = await enrichProducts([product]);
  res.status(201).json(enriched);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const vendor = await findVendorForUser(req.session.userId!);
  if (!vendor) {
    res.status(403).json({ error: "User does not own an active vendor" });
    return;
  }

  const [existing] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, req.params.id as string), eq(productsTable.vendorId, vendor.id)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Product not found for this vendor" });
    return;
  }

  await db
    .update(productsTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(productsTable.id, req.params.id as string), eq(productsTable.vendorId, vendor.id)));

  if (existing.isActive) {
    await db
      .update(vendorsTable)
      .set({ totalProducts: sql`max(total_products - 1, 0)` })
      .where(eq(vendorsTable.id, vendor.id));
  }

  res.json({ message: "Product removed" });
});

export default router;
