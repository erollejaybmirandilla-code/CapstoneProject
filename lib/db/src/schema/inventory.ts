import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const inventoryLogsTable = sqliteTable("inventory_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull(),
  vendorId: text("vendor_id").notNull(),
  userId: text("user_id").notNull(),
  action: text("action", { enum: ["restock", "sale", "adjustment", "damage", "return"] }).notNull(),
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertInventoryLogSchema = createInsertSchema(inventoryLogsTable).omit({ id: true, createdAt: true });
export const selectInventoryLogSchema = createSelectSchema(inventoryLogsTable);

export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type InventoryLog = typeof inventoryLogsTable.$inferSelect;
