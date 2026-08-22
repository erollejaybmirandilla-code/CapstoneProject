import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const vendorStaffTable = sqliteTable("vendor_staff", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vendorId: text("vendor_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role", { enum: ["owner", "manager", "staff"] }).notNull().default("staff"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  vendorUserUnique: uniqueIndex("vendor_staff_vendor_user_idx").on(table.vendorId, table.userId),
  vendorIdx: index("vendor_staff_vendor_idx").on(table.vendorId),
  userIdx: index("vendor_staff_user_idx").on(table.userId),
}));

export const insertVendorStaffSchema = createInsertSchema(vendorStaffTable).omit({ id: true, createdAt: true });
export const selectVendorStaffSchema = createSelectSchema(vendorStaffTable);

export type InsertVendorStaff = z.infer<typeof insertVendorStaffSchema>;
export type VendorStaff = typeof vendorStaffTable.$inferSelect;