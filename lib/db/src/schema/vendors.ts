import { pgTable, text, timestamp, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const vendorsTable = pgTable("vendors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  location: text("location").notNull().default(""),
  operatingHours: text("operating_hours").notNull().default("8:00 AM - 8:00 PM"),
  dtiRegistration: text("dti_registration").notNull().default(""),
  rating: real("rating").notNull().default(0),
  totalProducts: integer("total_products").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: text("owner_id"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVendorSchema = createInsertSchema(vendorsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const selectVendorSchema = createSelectSchema(vendorsTable);

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendorsTable.$inferSelect;
