import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const kycVerificationStatusEnum = pgEnum("kyc_verification_status", [
  "pending", "approved", "rejected"
]);

export const kycVerificationsTable = pgTable("kyc_verifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  status: kycVerificationStatusEnum("status").notNull().default("pending"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: text("birth_date").notNull(),
  address: text("address").notNull(),
  idType: text("id_type").notNull(),
  idNumber: text("id_number").notNull(),
  idImageUrl: text("id_image_url"),
  selfieUrl: text("selfie_url"),
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertKycSchema = createInsertSchema(kycVerificationsTable).omit({ id: true, submittedAt: true, reviewedAt: true });
export const selectKycSchema = createSelectSchema(kycVerificationsTable);

export type InsertKyc = z.infer<typeof insertKycSchema>;
export type KycVerification = typeof kycVerificationsTable.$inferSelect;
