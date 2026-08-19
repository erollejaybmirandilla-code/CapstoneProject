import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.session.userId!))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(notifications);
});

router.put("/read-all", async (req, res) => {
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.session.userId!));
  res.json({ message: "All notifications marked as read" });
});

router.put("/:id/read", async (req, res) => {
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, req.params.id as string), eq(notificationsTable.userId, req.session.userId!)));
  res.json({ message: "Notification marked as read" });
});

export default router;
