import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.session.role as string)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
    email: string;
    name: string;
  }
}
