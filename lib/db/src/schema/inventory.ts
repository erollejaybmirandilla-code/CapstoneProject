import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const inventoryActionEnum = pgEnum("inventory_action", [
  "restock", "sale", "adjustment", "damage", "return"
]);

export const inventoryLogsTable = pgTable("inventory_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull(),
  vendorId: text("vendor_id").notNull(),
  userId: text("user_id").notNull(),
  action: inventoryActionEnum("action").notNull(),
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventoryLogSchema = createInsertSchema(inventoryLogsTable).omit({ id: true, createdAt: true });
export const selectInventoryLogSchema = createSelectSchema(inventoryLogsTable);

export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type InventoryLog = typeof inventoryLogsTable.$inferSelect;
