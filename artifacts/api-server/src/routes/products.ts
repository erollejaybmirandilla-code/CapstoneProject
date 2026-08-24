import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import { productsTable, vendorsTable, categoriesTable } from "@workspace/db/schema";
import { eq, and, like, asc, desc, sql } from "drizzle-orm";
import { requireRole } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

const uploadDir = path.resolve(process.cwd(), "data/uploads/products");
fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

async function enrichProducts(products: typeof productsTable.$inferSelect[]) {
  if (products.length === 0) return [];
  
  const vendorIds = [...new Set(products.map(p => p.vendorId))];
  const categoryIds = [...new Set(products.map(p => p.categoryId))];
  
  const [vendors, categories] = await Promise.all([
    db.select({ id: vendorsTable.id, name: vendorsTable.name }).from(vendorsTable),
    db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable),
  ]);
  
  const vendorMap = new Map(vendors.map(v => [v.id, v.name]));
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  return products.map(p => ({
    ...p,
    vendorName: vendorMap.get(p.vendorId) ?? null,
    categoryName: categoryMap.get(p.categoryId) ?? null,
  }));
}

router.get("/", async (req, res) => {
  const { categoryId, vendorId, isBestSeller, isSeasonal, search, sort, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const conditions = [eq(productsTable.isActive, true)];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (vendorId) conditions.push(eq(productsTable.vendorId, vendorId));
  if (isBestSeller === "true") conditions.push(eq(productsTable.isBestSeller, true));
  if (isSeasonal === "true") conditions.push(eq(productsTable.isSeasonal, true));
  if (search) conditions.push(like(productsTable.name, `%${search}%`));

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
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id as string)).limit(1);
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
  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id as string)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [product] = await db.update(productsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(productsTable.id, req.params.id as string))
    .returning();
  const [enriched] = await enrichProducts([product]);
  res.json(enriched);
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  await db.update(productsTable).set({ isActive: false }).where(eq(productsTable.id, req.params.id as string));
  res.json({ message: "Product deleted" });
});

router.post("/:id/images", requireRole("admin", "staff"), upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id as string)).limit(1);
  if (!existing) {
    await fs.unlink(req.file.path).catch(() => {});
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const imageUrl = `/uploads/products/${req.file.filename}`;
  const updatedImages = [...(existing.images || []), imageUrl];

  await db.update(productsTable)
    .set({ images: updatedImages, updatedAt: new Date() })
    .where(eq(productsTable.id, req.params.id as string));

  res.status(201).json({ imageUrl, images: updatedImages });
});

router.delete("/:id/images/:imageIndex", requireRole("admin", "staff"), async (req, res) => {
  const imageIndex = parseInt(req.params.imageIndex as string);
  if (isNaN(imageIndex)) {
    res.status(400).json({ error: "Invalid image index" });
    return;
  }

  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id as string)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const images = existing.images || [];
  if (imageIndex < 0 || imageIndex >= images.length) {
    res.status(400).json({ error: "Image index out of range" });
    return;
  }

  const removedUrl = images[imageIndex];
  const updatedImages = images.filter((_, i) => i !== imageIndex);

  await db.update(productsTable)
    .set({ images: updatedImages, updatedAt: new Date() })
    .where(eq(productsTable.id, req.params.id as string));

  if (removedUrl.startsWith("/uploads/")) {
    const filePath = path.resolve(process.cwd(), "data", removedUrl);
    await fs.unlink(filePath).catch(() => {});
  }

  const [updated] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id as string)).limit(1);
  const [enriched] = await enrichProducts([updated]);
  res.json(enriched);
});

export default router;
