import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, vendorsTable, categoriesTable } from "@workspace/db/schema";
import { eq, and, ilike, asc, desc, sql } from "drizzle-orm";
import { requireRole } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

async function enrichProducts(products: typeof productsTable.$inferSelect[]) {
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

router.get("/", async (req, res) => {
  const { categoryId, vendorId, isBestSeller, isSeasonal, search, sort, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const conditions = [eq(productsTable.isActive, true)];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (vendorId) conditions.push(eq(productsTable.vendorId, vendorId));
  if (isBestSeller === "true") conditions.push(eq(productsTable.isBestSeller, true));
  if (isSeasonal === "true") conditions.push(eq(productsTable.isSeasonal, true));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));

  let orderBy;
  switch (sort) {
    case "price_asc": orderBy = asc(productsTable.price); break;
    case "price_desc": orderBy = desc(productsTable.price); break;
    case "name_asc": orderBy = asc(productsTable.name); break;
    case "rating_desc": orderBy = desc(productsTable.rating); break;
    default: orderBy = desc(productsTable.createdAt);
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(and(...conditions));
  const products = await db.select().from(productsTable)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  const enriched = await enrichProducts(products);
  res.json({ products: enriched, total: Number(countResult.count), offset: parseInt(offset), limit: parseInt(limit) });
});

router.get("/:id", async (req, res) => {
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id)).limit(1);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [enriched] = await enrichProducts([product]);
  res.json(enriched);
});

const createProductSchema = z.object({
  vendorId: z.string(),
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

router.post("/", requireRole("admin", "staff"), async (req, res) => {
  const result = createProductSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [product] = await db.insert(productsTable).values(result.data).returning();
  await db.update(vendorsTable).set({ totalProducts: sql`total_products + 1` }).where(eq(vendorsTable.id, result.data.vendorId));
  const [enriched] = await enrichProducts([product]);
  res.status(201).json(enriched);
});

router.put("/:id", requireRole("admin", "staff"), async (req, res) => {
  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [product] = await db.update(productsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(productsTable.id, req.params.id))
    .returning();
  const [enriched] = await enrichProducts([product]);
  res.json(enriched);
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  await db.update(productsTable).set({ isActive: false }).where(eq(productsTable.id, req.params.id));
  res.json({ message: "Product deleted" });
});

export default router;
