import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, usersTable, vendorsTable } from "@workspace/db/schema";
import { eq, and, gte, sql, desc, lte } from "drizzle-orm";
import { requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireRole("admin", "staff"));

router.get("/summary", async (req, res) => {
  const { period = "month" } = req.query as Record<string, string>;

  const now = new Date();
  let since = new Date();
  switch (period) {
    case "today": since = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case "week": since = new Date(now.getTime() - 7 * 86400000); break;
    case "year": since = new Date(now.getFullYear(), 0, 1); break;
    default: since = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [revenueResult] = await db.select({
    total: sql<number>`coalesce(sum(total), 0)`,
    count: sql<number>`count(*)`,
    avg: sql<number>`coalesce(avg(total), 0)`,
  }).from(ordersTable).where(and(gte(ordersTable.createdAt, since), eq(ordersTable.status, "delivered")));

  const [pendingResult] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(eq(ordersTable.status, "pending"));
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.isActive, true));
  const [customerCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "customer"));
  const [lowStockCount] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(and(eq(productsTable.isActive, true), lte(productsTable.stock, 10)));

  const topProducts = await db.select({
    productId: orderItemsTable.productId,
    productName: orderItemsTable.productName,
    totalSold: sql<number>`sum(${orderItemsTable.quantity})`,
    revenue: sql<number>`sum(${orderItemsTable.price} * ${orderItemsTable.quantity})`,
  }).from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(gte(ordersTable.createdAt, since))
    .groupBy(orderItemsTable.productId, orderItemsTable.productName)
    .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
    .limit(5);

  const vendorRevenue = await db.select({
    vendorId: orderItemsTable.vendorId,
    vendorName: orderItemsTable.vendorName,
    revenue: sql<number>`sum(${orderItemsTable.price} * ${orderItemsTable.quantity})`,
    orders: sql<number>`count(distinct ${orderItemsTable.orderId})`,
  }).from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(gte(ordersTable.createdAt, since))
    .groupBy(orderItemsTable.vendorId, orderItemsTable.vendorName)
    .orderBy(desc(sql`sum(${orderItemsTable.price} * ${orderItemsTable.quantity})`));

  const paymentBreakdown = await db.select({
    method: ordersTable.paymentMethod,
    count: sql<number>`count(*)`,
    total: sql<number>`coalesce(sum(total), 0)`,
  }).from(ordersTable)
    .where(gte(ordersTable.createdAt, since))
    .groupBy(ordersTable.paymentMethod);

  const revenueByDay = await db.select({
    date: sql<string>`strftime('%Y-%m-%d', datetime(${ordersTable.createdAt} / 1000, 'unixepoch'))`,
    revenue: sql<number>`coalesce(sum(total), 0)`,
    orders: sql<number>`count(*)`,
  }).from(ordersTable)
    .where(and(gte(ordersTable.createdAt, since), eq(ordersTable.status, "delivered")))
    .groupBy(sql`strftime('%Y-%m-%d', datetime(${ordersTable.createdAt} / 1000, 'unixepoch'))`)
    .orderBy(sql`strftime('%Y-%m-%d', datetime(${ordersTable.createdAt} / 1000, 'unixepoch'))`);

  res.json({
    totalRevenue: Number(revenueResult.total),
    totalOrders: Number(revenueResult.count),
    totalProducts: Number(productCount.count),
    totalCustomers: Number(customerCount.count),
    avgOrderValue: Number(revenueResult.avg),
    pendingOrders: Number(pendingResult.count),
    lowStockItems: Number(lowStockCount.count),
    topProducts: topProducts.map(p => ({ ...p, totalSold: Number(p.totalSold), revenue: Number(p.revenue) })),
    vendorRevenue: vendorRevenue.map(v => ({ ...v, vendorId: v.vendorId ?? "", vendorName: v.vendorName ?? "", revenue: Number(v.revenue), orders: Number(v.orders) })),
    paymentBreakdown: paymentBreakdown.map(p => ({ method: p.method, count: Number(p.count), total: Number(p.total) })),
    revenueByDay: revenueByDay.map(d => ({ ...d, revenue: Number(d.revenue), orders: Number(d.orders) })),
  });
});

export default router;
