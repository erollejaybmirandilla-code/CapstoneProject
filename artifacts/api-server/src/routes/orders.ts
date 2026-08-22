import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, usersTable, cartItemsTable, notificationsTable, inventoryLogsTable, vendorsTable } from "@workspace/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

async function enrichOrders(orders: (typeof ordersTable.$inferSelect)[]) {
  if (orders.length === 0) return [];
  
  const orderIds = orders.map(o => o.id);
  const userIds = [...new Set(orders.map(o => o.userId))];
  
  const [items, users] = await Promise.all([
    db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orderIds)),
    db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
      .from(usersTable)
      .where(inArray(usersTable.id, userIds)),
  ]);
  
  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items) {
    const orderItems = itemsByOrder.get(item.orderId) || [];
    orderItems.push(item);
    itemsByOrder.set(item.orderId, orderItems);
  }
  
  const userMap = new Map(users.map(u => [u.id, u]));
  
  return orders.map(order => ({
    ...order,
    items: itemsByOrder.get(order.id) || [],
    customerName: userMap.get(order.userId)?.name ?? null,
    customerEmail: userMap.get(order.userId)?.email ?? null,
  }));
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { status, userId: queryUserId, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const isStaff = ["admin", "staff"].includes(req.session.role as string);

  const conditions = [];
  if (!isStaff) conditions.push(eq(ordersTable.userId, req.session.userId!));
  else if (queryUserId) conditions.push(eq(ordersTable.userId, queryUserId));
  if (status) conditions.push(eq(ordersTable.status, status as any));

  const [countResult, orders] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(conditions.length ? and(...conditions) : undefined),
    db.select().from(ordersTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(ordersTable.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset)),
  ]);

  const enriched = await enrichOrders(orders);
  res.json({ orders: enriched, total: Number(countResult[0]?.count ?? 0), offset: parseInt(offset), limit: parseInt(limit) });
});

router.get("/:id", async (req, res) => {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, req.params.id as string)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const isStaff = ["admin", "staff"].includes(req.session.role as string);
  if (!isStaff && order.userId !== req.session.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [enriched] = await enrichOrders([order]);
  res.json(enriched);
});

const createOrderSchema = z.object({
  paymentMethod: z.enum(["gcash", "maya", "cod", "bank_transfer", "seven_eleven"]),
  deliveryMethod: z.enum(["pickup", "lalamove", "jnt", "lbc", "hotel_dropoff"]),
  deliveryAddress: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  referenceNumber: z.string().nullable().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })).min(1),
});

const DELIVERY_FEES: Record<string, number> = {
  pickup: 0, lalamove: 80, jnt: 60, lbc: 75, hotel_dropoff: 120
};

router.post("/", async (req, res) => {
  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { paymentMethod, deliveryMethod, deliveryAddress, notes, referenceNumber, items } = result.data;
  const userId = req.session.userId!;

  const productIds = items.map(i => i.productId);
  const [products, vendors] = await Promise.all([
    db.select().from(productsTable).where(inArray(productsTable.id, productIds)),
    db.select({ id: vendorsTable.id, name: vendorsTable.name }).from(vendorsTable),
  ]);
  
  const productMap = new Map(products.map(p => [p.id, p]));
  const vendorMap = new Map(vendors.map(v => [v.id, v.name]));

  let subtotal = 0;
  const orderItemsData = [];
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    if (product.stock < item.quantity) {
      res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      return;
    }
    subtotal += product.price * item.quantity;
    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] ?? null,
      price: product.price,
      quantity: item.quantity,
      vendorId: product.vendorId,
      vendorName: vendorMap.get(product.vendorId) ?? null,
    });
  }

  const deliveryFee = DELIVERY_FEES[deliveryMethod] ?? 0;
  const total = subtotal + deliveryFee;

  const [order] = await db.insert(ordersTable).values({
    userId,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "unpaid" : "paid",
    deliveryMethod,
    deliveryAddress: deliveryAddress ?? null,
    deliveryFee,
    subtotal,
    total,
    notes: notes ?? null,
    referenceNumber: referenceNumber ?? null,
  }).returning();

  await db.insert(orderItemsTable).values(orderItemsData.map(i => ({ ...i, orderId: order.id })));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) continue;
    const newStock = product.stock - item.quantity;
    await db.update(productsTable).set({ stock: newStock }).where(eq(productsTable.id, item.productId));
    await db.insert(inventoryLogsTable).values({
      productId: item.productId,
      vendorId: product.vendorId,
      userId,
      action: "sale",
      quantity: item.quantity,
      previousStock: product.stock,
      newStock,
      notes: `Order ${order.id}`,
    });
  }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  await db.insert(notificationsTable).values({
    userId,
    title: "Order Placed!",
    body: `Your order #${order.id.slice(0, 8)} has been placed and is being processed.`,
    type: "order_update",
    relatedId: order.id,
  });

  const [enriched] = await enrichOrders([order]);
  res.status(201).json(enriched);
});

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]),
  notes: z.string().nullable().optional(),
});

router.put("/:id/status", requireRole("admin", "staff"), async (req, res) => {
  const result = updateStatusSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const [order] = await db.update(ordersTable)
    .set({ status: result.data.status, updatedAt: new Date() })
    .where(eq(ordersTable.id, req.params.id as string))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  await db.insert(notificationsTable).values({
    userId: order.userId,
    title: `Order ${result.data.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
    body: `Your order #${order.id.slice(0, 8)} status has been updated.`,
    type: "order_update",
    relatedId: order.id,
  });

  const [enriched] = await enrichOrders([order]);
  res.json(enriched);
});

export default router;
