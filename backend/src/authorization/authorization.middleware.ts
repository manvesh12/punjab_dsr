import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";

export function requireAnyRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) { res.status(403).json({ error: "Access denied" }); return; }
    next();
  };
}
