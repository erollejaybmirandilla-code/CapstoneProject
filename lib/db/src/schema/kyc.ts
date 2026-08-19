import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const kycVerificationsTable = sqliteTable("kyc_verifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: text("birth_date").notNull(),
  address: text("address").notNull(),
  idType: text("id_type").notNull(),
  idNumber: text("id_number").notNull(),
  idImageUrl: text("id_image_url"),
  selfieUrl: text("selfie_url"),
  reviewNotes: text("review_notes"),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
});

export const insertKycSchema = createInsertSchema(kycVerificationsTable).omit({ id: true, submittedAt: true, reviewedAt: true });
export const selectKycSchema = createSelectSchema(kycVerificationsTable);

export type InsertKyc = z.infer<typeof insertKycSchema>;
export type KycVerification = typeof kycVerificationsTable.$inferSelect;
