import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAnyRole } from "../lib/auth.js";
import { Role } from "@prisma/client";

export const settingsRouter = Router();

const DEFAULT_SETTINGS: Record<string, string> = {
  noticeText: "DSR submissions for Punjab districts 2025-26 are now open - Deadline: 30 September 2026 - New: Digital E-Sign integration live for all districts - EMGSM 2020 compliance mandatory",
  publicAnnouncements: JSON.stringify([
    { date: "18 JUN 2026", title: "Instructions for submission and review of District Survey Reports", url: "login.html" },
    { date: "10 JUN 2026", title: "Updated user manual for departmental officers", url: "login.html" },
    { date: "02 JUN 2026", title: "Portal maintenance and service availability notice", url: "login.html" }
  ])
};

// GET /api/settings/:key (public, since notices are displayed publicly on login)
settingsRouter.get("/:key", async (req, res) => {
  try {
    const key = req.params.key as string;
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
        return res.json({ key, value: DEFAULT_SETTINGS[key], updatedAt: null });
      }
      return res.status(404).json({ error: "Setting not found" });
    }
    
    res.json(setting);
  } catch (error) {
    console.error("Error fetching setting:", error);
    const key = req.params.key as string;
    if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
      return res.json({ key, value: DEFAULT_SETTINGS[key], updatedAt: null, degraded: true });
    }
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
