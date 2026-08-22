import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, vendorsTable, vendorStaffTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { hashPassword, comparePassword, requireAuth } from "../lib/auth.js";

const router = Router();

const vendorDetailsSchema = z.object({
  name: z.string().min(3, "Business name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  location: z.string().min(1, "Location is required"),
  dtiRegistration: z.string().min(8, "Valid DTI registration required"),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  accountType: z.enum(["customer", "vendor"]),
  vendorDetails: vendorDetailsSchema.optional(),
}).refine(
  (data) => {
    if (data.accountType === "vendor" && !data.vendorDetails) {
      return false;
    }
    return true;
  },
  { message: "Vendor details are required for vendor accounts" }
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input", details: result.error.flatten() });
    return;
  }

  const { email, password, name, phone, accountType, vendorDetails } = result.data;

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  if (accountType === "vendor" && vendorDetails) {
    const existingVendorName = await db.select().from(vendorsTable)
      .where(eq(vendorsTable.name, vendorDetails.name.trim()))
      .limit(1);
    if (existingVendorName.length > 0) {
      res.status(409).json({ error: "A vendor with this business name already exists" });
      return;
    }

    const existingDTI = await db.select().from(vendorsTable)
      .where(eq(vendorsTable.dtiRegistration, vendorDetails.dtiRegistration.trim()))
      .limit(1);
    if (existingDTI.length > 0) {
      res.status(409).json({ error: "This DTI registration is already associated with another vendor" });
      return;
    }
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = (() => {
      const [newUser] = db.insert(usersTable).values({
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        phone: phone?.replace(/\s/g, "") ?? null,
        role: accountType === "vendor" ? "staff" : "customer",
        kycStatus: accountType === "vendor" ? "pending" : "none",
        isVerified: false,
      }).returning().all();

      if (accountType === "vendor" && vendorDetails) {
        const [vendor] = db.insert(vendorsTable).values({
          name: vendorDetails.name.trim(),
          description: vendorDetails.description.trim(),
          location: vendorDetails.location.trim(),
          dtiRegistration: vendorDetails.dtiRegistration.replace(/\s/g, ""),
          ownerId: newUser.id,
          isActive: false,
        }).returning().all();

        db.update(usersTable)
          .set({ vendorId: vendor.id })
          .where(eq(usersTable.id, newUser.id))
          .run();

        db.insert(vendorStaffTable).values({
          vendorId: vendor.id,
          userId: newUser.id,
          role: "owner",
        }).run();

        const [updatedUser] = db.select().from(usersTable)
          .where(eq(usersTable.id, newUser.id))
          .limit(1)
          .all();
        return updatedUser;
      }

      return newUser;
    })();

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.email = user.email;
    req.session.name = user.name;

    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token: req.session.id });
  } catch (error: any) {
    if (error.message?.includes("UNIQUE")) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    throw error;
  }
});

router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = result.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.email = user.email;
  req.session.name = user.name;

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser, token: req.session.id });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
