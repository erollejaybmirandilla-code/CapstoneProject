import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistItemsTable, productsTable, vendorsTable, categoriesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const items = await db.select().from(wishlistItemsTable).where(eq(wishlistItemsTable.userId, req.session.userId!));
  const vendors = await db.select({ id: vendorsTable.id, name: vendorsTable.name }).from(vendorsTable);
  const categories = await db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable);
  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

  const enriched = await Promise.all(items.map(async item => {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
    return {
      ...item,
      product: product ? { ...product, vendorName: vendorMap[product.vendorId] ?? null, categoryName: categoryMap[product.categoryId] ?? null } : null,
    };
  }));
  res.json(enriched.filter(i => i.product !== null));
});

router.post("/", async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ error: "productId required" });
    return;
  }
  const userId = req.session.userId!;
  const [existing] = await db.select().from(wishlistItemsTable).where(and(eq(wishlistItemsTable.userId, userId), eq(wishlistItemsTable.productId, productId))).limit(1);
  if (!existing) {
    await db.insert(wishlistItemsTable).values({ userId, productId });
  }
  res.json({ message: "Added to wishlist" });
});

router.delete("/:productId", async (req, res) => {
  await db.delete(wishlistItemsTable).where(and(eq(wishlistItemsTable.userId, req.session.userId!), eq(wishlistItemsTable.productId, req.params.productId as string)));
  res.json({ message: "Removed from wishlist" });
});

export default router;
