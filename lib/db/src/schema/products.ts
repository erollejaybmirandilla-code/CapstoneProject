import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const productsTable = sqliteTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vendorId: text("vendor_id").notNull(),
  categoryId: text("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: real("price").notNull(),
  compareAtPrice: real("compare_at_price"),
  unit: text("unit").notNull().default("piece"),
  stock: integer("stock").notNull().default(0),
  images: text("images", { mode: "json" }).$type<string[]>().notNull().default([]),
  isBestSeller: integer("is_best_seller", { mode: "boolean" }).notNull().default(false),
  isSeasonal: integer("is_seasonal", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sku: text("sku"),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  ingredients: text("ingredients"),
  expirationMonths: integer("expiration_months"),
  weight: text("weight"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  vendorIdIdx: index("products_vendor_id_idx").on(table.vendorId),
  categoryIdIdx: index("products_category_id_idx").on(table.categoryId),
  isActiveIdx: index("products_is_active_idx").on(table.isActive),
  nameIdx: index("products_name_idx").on(table.name),
}));

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const selectProductSchema = createSelectSchema(productsTable);

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
