import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable, vendorsTable, categoriesTable } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

async function getCartResponse(userId: string) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  
  if (items.length === 0) {
    return { items: [], subtotal: 0, totalItems: 0 };
  }
  
  const productIds = [...new Set(items.map(i => i.productId))];
  
  const [products, vendors, categories] = await Promise.all([
    db.select().from(productsTable).where(inArray(productsTable.id, productIds)),
    db.select({ id: vendorsTable.id, name: vendorsTable.name }).from(vendorsTable),
    db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable),
  ]);
  
  const productMap = new Map(products.map(p => [p.id, p]));
  const vendorMap = new Map(vendors.map(v => [v.id, v.name]));
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const enrichedItems = items
    .map(item => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      return {
        ...item,
        product: {
          ...product,
          vendorName: vendorMap.get(product.vendorId) ?? null,
          categoryName: categoryMap.get(product.categoryId) ?? null,
        },
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const subtotal = enrichedItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const totalItems = enrichedItems.reduce((sum, i) => sum + i.quantity, 0);

  return { items: enrichedItems, subtotal, totalItems };
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  const cart = await getCartResponse(req.session.userId!);
  res.json(cart);
});

const addSchema = z.object({ productId: z.string(), quantity: z.number().int().min(1) });

router.post("/", async (req, res) => {
  const result = addSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { productId, quantity } = result.data;
  const userId = req.session.userId!;

  const [existing] = await db.select().from(cartItemsTable).where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId))).limit(1);
  if (existing) {
    await db.update(cartItemsTable).set({ quantity: existing.quantity + quantity, updatedAt: new Date() }).where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({ userId, productId, quantity });
  }
  res.json(await getCartResponse(userId));
});

router.put("/:itemId", async (req, res) => {
  const { quantity } = req.body;
  if (typeof quantity !== "number" || quantity < 1) {
    res.status(400).json({ error: "Invalid quantity" });
    return;
  }
  await db.update(cartItemsTable).set({ quantity, updatedAt: new Date() }).where(and(eq(cartItemsTable.id, req.params.itemId as string), eq(cartItemsTable.userId, req.session.userId!)));
  res.json(await getCartResponse(req.session.userId!));
});

router.delete("/:itemId", async (req, res) => {
  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, req.params.itemId as string), eq(cartItemsTable.userId, req.session.userId!)));
  res.json(await getCartResponse(req.session.userId!));
});

router.delete("/", async (req, res) => {
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.session.userId!));
  res.json({ message: "Cart cleared" });
});

export default router;
