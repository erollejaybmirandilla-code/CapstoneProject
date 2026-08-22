import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const ordersTable = sqliteTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  vendorId: text("vendor_id"),
  status: text("status", { enum: ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"] }).notNull().default("pending"),
  paymentMethod: text("payment_method", { enum: ["gcash", "maya", "cod", "bank_transfer", "seven_eleven"] }).notNull(),
  paymentStatus: text("payment_status", { enum: ["unpaid", "paid", "refunded"] }).notNull().default("unpaid"),
  deliveryMethod: text("delivery_method", { enum: ["pickup", "lalamove", "jnt", "lbc", "hotel_dropoff"] }).notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryFee: real("delivery_fee").notNull().default(0),
  subtotal: real("subtotal").notNull(),
  total: real("total").notNull(),
  notes: text("notes"),
  referenceNumber: text("reference_number"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index("orders_user_id_idx").on(table.userId),
  statusIdx: index("orders_status_idx").on(table.status),
  vendorIdIdx: index("orders_vendor_id_idx").on(table.vendorId),
  createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
}));

export const orderItemsTable = sqliteTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull(),
  vendorId: text("vendor_id"),
  vendorName: text("vendor_name"),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export const selectOrderSchema = createSelectSchema(ordersTable);

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
