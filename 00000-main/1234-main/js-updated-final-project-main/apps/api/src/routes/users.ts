import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import crypto from "crypto";
import multer from "multer";
import * as xlsx from "xlsx";
import { canAdmin, permissionsFor } from "../lib/auth.js";
import { jsonSafe } from "../lib/json.js";
import { prisma } from "../lib/prisma.js";
import { parseBigIntParam } from "../lib/validation.js";
import { sendInvitationEmail } from "../lib/email.js";

export const usersRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

function normalizeRole(value: unknown) {
  const role = String(value || "OFFICER").toUpperCase();
  if (role === "DATA_ENTRY") return Role.OFFICER;
  return Object.values(Role).includes(role as Role) ? (role as Role) : Role.OFFICER;
}

function toUserDto(user: Awaited<ReturnType<typeof prisma.user.findMany>>[number]) {
  return {
    id: Number(user.id),
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    district: user.district || "",
    block: user.blockName || "",
    blockName: user.blockName || "",
    section: user.sectionName || "",
    sectionName: user.sectionName || "",
    accessLabel: user.accessScope || user.role.replaceAll("_", " "),
    permissions: permissionsFor(user.role),
    active: user.active,
    createdAt: user.createdAt.toISOString()
  };
}

usersRouter.use((req, res, next) => {
  if (!canAdmin(req.user!.role)) {
    res.status(403).json({ error: "Only Admin can manage users" });
    return;
  }
  next();
});

usersRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  res.json(jsonSafe(users.map(toUserDto)));
});

usersRouter.post("/", async (req, res) => {
  const username = String(req.body?.username || req.body?.email || "").trim();
  const email = String(req.body?.email || username).trim();
  if (!username || !email) {
    res.status(400).json({ error: "Username/email is required" });
    return;
  }
  const password = String(req.body?.password || "");
  if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    res.status(400).json({ error: "Password must be at least 10 characters and include letters and numbers" });
    return;
  }
  const user = await prisma.user.create({
    data: {
      username,
      email,
      fullName: req.body?.fullName || username,
      password: await bcrypt.hash(password, 10),
      role: normalizeRole(req.body?.role),
      district: req.body?.district || "",
      blockName: req.body?.block || req.body?.blockName || "",
      sectionName: req.body?.section || req.body?.sectionName || "",
      accessScope: req.body?.accessScope || "",
      active: req.body?.active === undefined ? true : String(req.body.active) === "true"
    }
  });
  res.status(201).json(jsonSafe(toUserDto(user)));
});

usersRouter.put("/:id", async (req, res) => {
  const id = parseBigIntParam(req.params.id, res, "user id");
  if (!id) return;
  const data: Record<string, unknown> = {};
  if (req.body?.fullName !== undefined) data.fullName = req.body.fullName;
  if (req.body?.email !== undefined) data.email = req.body.email;
  if (req.body?.username !== undefined) data.username = req.body.username;
  if (req.body?.role !== undefined) data.role = normalizeRole(req.body.role);
  if (req.body?.district !== undefined) data.district = req.body.district;
  if (req.body?.block !== undefined || req.body?.blockName !== undefined) data.blockName = req.body.block || req.body.blockName || "";
  if (req.body?.section !== undefined || req.body?.sectionName !== undefined) data.sectionName = req.body.section || req.body.sectionName || "";
  if (req.body?.accessScope !== undefined) data.accessScope = req.body.accessScope;
  if (req.body?.password) {
    const password = String(req.body.password);
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      res.status(400).json({ error: "Password must be at least 10 characters and include letters and numbers" });
      return;
    }
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({ where: { id }, data });
  res.json(jsonSafe(toUserDto(user)));
});

usersRouter.patch("/:id/active", async (req, res) => {
  const id = parseBigIntParam(req.params.id, res, "user id");
  if (!id) return;
  const user = await prisma.user.update({
    where: { id },
    data: { active: Boolean(req.body?.active) }
  });
  res.json(jsonSafe(toUserDto(user)));
});

usersRouter.delete("/:id", async (req, res) => {
  const id = parseBigIntParam(req.params.id, res, "user id");
  if (!id) return;
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

usersRouter.post("/invite", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const role = normalizeRole(req.body?.role);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400).json({ error: "User with this email already exists" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Upsert invitation
  await prisma.invitation.upsert({
    where: { email },
    update: { token, role, expiresAt, status: "PENDING", createdBy: req.user!.id },
    create: { email, token, role, expiresAt, createdBy: req.user!.id }
  });

  try {
    await sendInvitationEmail(email, token, role);
  } catch (e: any) {
    console.error("Failed to send invitation email", e);
    res.status(500).json({ error: "Failed to send email: " + (e.message || "Unknown error") });
    return;
  }

  res.json({ success: true, message: "Invitation sent successfully" });
});

usersRouter.post("/invite/bulk", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet) as any[];

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    const validRoles = Object.values(Role);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = String(row.email || row.Email || "").trim().toLowerCase();
      const rawRole = String(row.role || row.Role || "").toUpperCase();

      if (!email) {
        failedCount++;
        errors.push({ row: i + 2, email: "", reason: "Email is required" });
        continue;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        failedCount++;
        errors.push({ row: i + 2, email, reason: "Invalid email format" });
        continue;
      }

      if (!validRoles.includes(rawRole as Role)) {
        failedCount++;
        errors.push({ row: i + 2, email, reason: `Invalid role: ${rawRole}` });
        continue;
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        failedCount++;
        errors.push({ row: i + 2, email, reason: "User already exists" });
        continue;
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const role = rawRole as Role;

      try {
        await prisma.invitation.upsert({
          where: { email },
          update: { token, role, expiresAt, status: "PENDING", createdBy: req.user!.id },
          create: { email, token, role, expiresAt, createdBy: req.user!.id }
        });

        // Send email in background (fire-and-forget) to speed up API response
        sendInvitationEmail(email, token, role).catch(err => {
          console.error(`Background email failed for ${email}:`, err);
        });
        successCount++;
      } catch (e: any) {
        failedCount++;
        errors.push({ row: i + 2, email, reason: e.message || "Failed to create invitation" });
      }
    }

    res.json({ success: true, successCount, failedCount, errors });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to process the uploaded file: " + error.message });
  }
});
