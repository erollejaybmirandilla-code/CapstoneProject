import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const wishlistItemsTable = sqliteTable("wishlist_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  productId: text("product_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItemsTable).omit({ id: true, createdAt: true });
export const selectWishlistItemSchema = createSelectSchema(wishlistItemsTable);

export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItemsTable.$inferSelect;
