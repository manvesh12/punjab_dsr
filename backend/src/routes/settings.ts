import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAnyRole } from "../lib/auth.js";
import { Role } from "@prisma/client";

export const settingsRouter = Router();

// GET /api/settings/:key (public, since notices are displayed publicly on login)
settingsRouter.get("/:key", async (req, res) => {
  try {
    const key = req.params.key as string;
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: "Setting not found" });
    }
    
    res.json(setting);
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

// PUT /api/settings/:key (Admin only)
settingsRouter.put("/:key", requireAuth, requireAnyRole([Role.ADMIN, Role.STATE_ADMIN]), async (req, res) => {
  try {
    const key = req.params.key as string;
    const value = req.body.value as string;
    
    if (value === undefined) {
      return res.status(400).json({ error: "Value is required" });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    
    res.json(setting);
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ error: "Failed to update setting" });
  }
});
