import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { permissionsFor, roleToFrontend, signToken } from "../lib/auth.js";
import { recordAudit } from "../lib/audit.js";
import { config } from "../lib/config.js";
import { prisma } from "../lib/prisma.js";
import { jsonSafe } from "../lib/json.js";
import { sendOtpEmail } from "../lib/email.js";

const loginSchema = z.object({
  username: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(256)
});

const registerSchema = z.object({
  username: z.string().trim().min(3).max(64).optional(),
  email: z.string().email(),
  fullName: z.string().min(1),
  password: z.string().min(10).max(128).regex(/[A-Za-z]/).regex(/[0-9]/)
});

const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 15 * 60 * 1000
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: "strict" as const,
  path: "/api/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const authRouter = Router();

import crypto from "crypto";

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const usernameOrEmail = parsed.data.username.toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    }
  });

  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    recordAudit(req, "AUTH_LOGIN_FAILED", { username: usernameOrEmail }, 401);
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  if (!user.active) {
    res.status(403).json({ error: "Please verify your email via OTP to activate your account." });
    return;
  }

  const token = signToken(user);
  
  const refreshTokenStr = crypto.randomBytes(40).toString("hex");
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenStr,
      userId: user.id,
      expiresAt: new Date(Date.now() + refreshTokenCookieOptions.maxAge)
    }
  });

  res.cookie(config.sessionCookieName, token, cookieOptions);
  res.cookie("dsr_refresh_token", refreshTokenStr, refreshTokenCookieOptions);
  
  recordAudit(req, "AUTH_LOGIN_SUCCESS", { username: user.username, role: user.role }, 200);
  res.json(
    jsonSafe({
      token,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: `ROLE_${user.role}`,
      uiRole: roleToFrontend(user.role),
      permissions: permissionsFor(user.role),
      scope: {
        district: user.district,
        blockName: user.blockName,
        sectionName: user.sectionName
      },
      accessLabel: user.accessScope || user.role.replaceAll("_", " ")
    })
  );
});

authRouter.post("/refresh", async (req, res) => {
  const refreshTokenStr = req.cookies?.["dsr_refresh_token"];
  if (!refreshTokenStr) {
    res.status(401).json({ error: "No refresh token provided" });
    return;
  }

  const rt = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenStr },
    include: { user: true }
  });

  if (!rt || rt.revoked || rt.expiresAt < new Date() || !rt.user.active) {
    if (rt) {
      await prisma.refreshToken.update({
        where: { id: rt.id },
        data: { revoked: true }
      });
    }
    res.clearCookie("dsr_refresh_token", { path: "/api/auth/refresh" });
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  const token = signToken(rt.user);
  res.cookie(config.sessionCookieName, token, cookieOptions);
  res.json({ token, success: true });
});

authRouter.post("/logout", async (req, res) => {
  const refreshTokenStr = req.cookies?.["dsr_refresh_token"];
  if (refreshTokenStr) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshTokenStr },
      data: { revoked: true }
    });
  }

  res.clearCookie(config.sessionCookieName, { path: "/" });
  res.clearCookie("dsr_refresh_token", { path: "/api/auth/refresh" });
  recordAudit(req, "AUTH_LOGOUT", undefined, 200);
  res.json({ success: true });
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid registration details" });
    return;
  }

  const username = parsed.data.username || parsed.data.email;
  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: parsed.data.email }] }
  });
  
  if (exists) {
    if (exists.active) {
      res.status(409).json({ error: "User already exists and is active. Please login." });
      return;
    } else {
      // User exists but inactive. We update password and resend OTP.
      await prisma.user.update({
        where: { id: exists.id },
        data: {
          password: await bcrypt.hash(parsed.data.password, 10),
          fullName: parsed.data.fullName,
        }
      });
    }
  }

  let user = exists;
  if (!user) {
    user = await prisma.user.create({
      data: {
        username,
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        password: await bcrypt.hash(parsed.data.password, 10),
        role: Role.OFFICER,
        active: false // Wait for OTP
      }
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Deprecate previous unused register OTPs
  await prisma.otpVerification.updateMany({
    where: { identifier: parsed.data.email, purpose: "REGISTER", used: false },
    data: { used: true }
  });

  await prisma.otpVerification.create({
    data: {
      identifier: parsed.data.email,
      otpHash,
      purpose: "REGISTER",
      expiresAt
    }
  });

  try {
    await sendOtpEmail(parsed.data.email, otp);
  } catch(e) {
    console.error("Failed to send OTP:", e);
  }

  res.json(jsonSafe({ success: true, message: "OTP sent to your email", username: user.username }));
});

authRouter.post("/verify-register-otp", async (req, res) => {
  const parsed = z.object({
    email: z.string().email(),
    otp: z.string().length(6)
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload. Need valid email and 6-digit OTP." });
    return;
  }

  const { email, otp } = parsed.data;

  const otpRecord = await prisma.otpVerification.findFirst({
    where: { identifier: email, purpose: "REGISTER", used: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  if (otpRecord.attemptCount >= 5) {
    res.status(429).json({ error: "Too many attempts. Please request a new OTP by registering again." });
    return;
  }

  const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attemptCount: { increment: 1 } }
    });
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  // Mark used
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { used: true }
  });

  // Activate the user
  await prisma.user.update({
    where: { email },
    data: { active: true }
  });

  res.json({ success: true, message: "Registration verified successfully. You can now login." });
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1)
});

const verifyOtpSchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6)
});

const resetPasswordSchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6),
  newPassword: z.string().min(10).max(128).regex(/[A-Za-z]/).regex(/[0-9]/)
});

// Helper for generic success message
const genericSuccess = { success: true, message: "If account exists, verification instructions have been sent." };

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Identifier is required" });
    return;
  }

  const { identifier } = parsed.data;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { mobileNumber: identifier }
      ]
    }
  });

  // Always return success to prevent user enumeration
  if (!user || !user.active) {
    res.json(genericSuccess);
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  
  // Set expiration to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.passwordResetRequest.create({
    data: {
      userId: user.id,
      identifier,
      otpHash,
      expiresAt
    }
  });

  // TODO: Dispatch Email/SMS in a real app
  console.log(`[MOCK EMAIL/SMS] OTP for ${identifier} is ${otp}`);
  recordAudit(req, "PASSWORD_RESET_REQUESTED", { userId: user.id, identifier }, 200);

  res.json(genericSuccess);
});

authRouter.post("/verify-reset-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const { identifier, otp } = parsed.data;

  const resetReq = await prisma.passwordResetRequest.findFirst({
    where: { identifier, used: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!resetReq) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }

  if (resetReq.expiresAt < new Date()) {
    res.status(400).json({ error: "OTP expired" });
    return;
  }

  if (resetReq.attemptCount >= 5) {
    res.status(429).json({ error: "Too many attempts, please request a new OTP." });
    return;
  }

  const isValid = await bcrypt.compare(otp, resetReq.otpHash);
  if (!isValid) {
    await prisma.passwordResetRequest.update({
      where: { id: resetReq.id },
      data: { attemptCount: { increment: 1 } }
    });
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  res.json({ success: true, message: "OTP verified" });
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload or password doesn't meet criteria" });
    return;
  }

  const { identifier, otp, newPassword } = parsed.data;

  const resetReq = await prisma.passwordResetRequest.findFirst({
    where: { identifier, used: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!resetReq || resetReq.expiresAt < new Date() || resetReq.attemptCount >= 5) {
    res.status(400).json({ error: "Invalid or expired session. Please request a new OTP." });
    return;
  }

  const isValid = await bcrypt.compare(otp, resetReq.otpHash);
  if (!isValid) {
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  // Update password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: resetReq.userId },
    data: { password: newPasswordHash }
  });

  // Mark as used
  await prisma.passwordResetRequest.update({
    where: { id: resetReq.id },
    data: { used: true }
  });

  // Revoke all refresh tokens for this user
  await prisma.refreshToken.updateMany({
    where: { userId: resetReq.userId },
    data: { revoked: true }
  });

  recordAudit(req, "PASSWORD_RESET_SUCCESS", { userId: resetReq.userId }, 200);

  res.json({ success: true, message: "Password reset successful" });
});

authRouter.get("/invitation/:token", async (req, res) => {
  const token = req.params.token;
  const invitation = await prisma.invitation.findUnique({
    where: { token, status: "PENDING" }
  });

  if (!invitation || invitation.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired invitation link" });
    return;
  }

  res.json(jsonSafe({ email: invitation.email, role: invitation.role }));
});

const registerInvitedSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(1),
  mobileNumber: z.string().min(10),
  password: z.string().min(10).max(128).regex(/[A-Za-z]/).regex(/[0-9]/),
  phoneVerified: z.boolean().optional(),
  idToken: z.string().optional()
});

authRouter.post("/register-invited", async (req, res) => {
  const parsed = registerInvitedSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid registration details" });
    return;
  }

  const { token, fullName, mobileNumber, password } = parsed.data;

  const invitation = await prisma.invitation.findUnique({
    where: { token, status: "PENDING" }
  });

  if (!invitation || invitation.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired invitation link" });
    return;
  }

  // If frontend already verified phone via Firebase SMS
  if (parsed.data.phoneVerified) {
    let user = await prisma.user.findFirst({ where: { email: invitation.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: invitation.email,
          email: invitation.email,
          fullName,
          mobileNumber,
          password: await bcrypt.hash(password, 10),
          role: invitation.role,
          active: true
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await bcrypt.hash(password, 10),
          fullName,
          mobileNumber,
          active: true
        }
      });
    }

    // Mark invitation as ACCEPTED
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" }
    });

    // Automatically log them in
    const sessionToken = signToken(user);
    const refreshTokenStr = crypto.randomBytes(40).toString("hex");
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenStr,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshTokenCookieOptions.maxAge)
      }
    });

    res.cookie("refreshToken", refreshTokenStr, refreshTokenCookieOptions);
    res.json(jsonSafe({
      success: true,
      message: "Registration successful",
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    }));
    return;
  }

  // Fallback: Generate 6-digit OTP for Email (or old mock mobile)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Invalidate old OTPs
  await prisma.otpVerification.updateMany({
    where: { identifier: mobileNumber, purpose: "REGISTER", used: false },
    data: { used: true }
  });

  await prisma.otpVerification.create({
    data: {
      identifier: mobileNumber,
      otpHash,
      purpose: "REGISTER",
      expiresAt
    }
  });

  // Send real OTP via Email to the invited user
  try {
    sendOtpEmail(invitation.email, otp).catch(err => {
      console.error(`Background OTP email failed for ${invitation.email}:`, err);
    });
    console.log(`[EMAIL OTP] Registration OTP for ${invitation.email} sent successfully.`);
  } catch (error) {
    console.error(`Failed to trigger OTP email for ${invitation.email}`, error);
  }

  let user = await prisma.user.findFirst({ where: { email: invitation.email } });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: invitation.email,
        email: invitation.email,
        fullName,
        mobileNumber,
        password: await bcrypt.hash(password, 10),
        role: invitation.role,
        active: false // Wait for OTP
      }
    });
  } else if (!user.active) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 10),
        fullName,
        mobileNumber
      }
    });
  }

  res.json({ success: true, message: "OTP sent to your email" });
});

authRouter.post("/verify-invited-otp", async (req, res) => {
  const parsed = z.object({
    token: z.string().min(1),
    mobileNumber: z.string().min(10),
    otp: z.string().length(6)
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload. Need valid token, mobile and 6-digit OTP." });
    return;
  }

  const { token, mobileNumber, otp } = parsed.data;

  const invitation = await prisma.invitation.findUnique({
    where: { token, status: "PENDING" }
  });

  if (!invitation || invitation.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired invitation link" });
    return;
  }

  const otpRecord = await prisma.otpVerification.findFirst({
    where: { identifier: mobileNumber, purpose: "REGISTER", used: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  if (otpRecord.attemptCount >= 5) {
    res.status(429).json({ error: "Too many attempts. Please request a new OTP." });
    return;
  }

  const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attemptCount: { increment: 1 } }
    });
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  // Mark OTP used
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { used: true }
  });

  // Activate the user
  const user = await prisma.user.update({
    where: { email: invitation.email },
    data: { active: true }
  });

  // Mark invitation as ACCEPTED
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED" }
  });

  // Automatically log them in
  const sessionToken = signToken(user);
  
  const refreshTokenStr = crypto.randomBytes(40).toString("hex");
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenStr,
      userId: user.id,
      expiresAt: new Date(Date.now() + refreshTokenCookieOptions.maxAge)
    }
  });

  res.cookie(config.sessionCookieName, sessionToken, cookieOptions);
  res.cookie("dsr_refresh_token", refreshTokenStr, refreshTokenCookieOptions);
  
  recordAudit(req, "AUTH_REGISTER_INVITED_SUCCESS", { username: user.username, role: user.role }, 200);

  res.json(
    jsonSafe({
      success: true,
      message: "Registration completed successfully",
      token: sessionToken,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: `ROLE_${user.role}`,
      uiRole: roleToFrontend(user.role),
      permissions: permissionsFor(user.role),
      scope: {
        district: user.district,
        blockName: user.blockName,
        sectionName: user.sectionName
      },
      accessLabel: user.accessScope || user.role.replaceAll("_", " ")
    })
  );
});
