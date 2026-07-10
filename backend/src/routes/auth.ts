import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { permissionsFor, roleToFrontend, signToken } from "../lib/auth.js";
import { recordAudit } from "../lib/audit.js";
import { config } from "../lib/config.js";
import { prisma } from "../lib/prisma.js";
import { jsonSafe } from "../lib/json.js";
import { sendOtpEmail, sendPasswordChangedEmail, sendPasswordResetOtpEmail } from "../lib/email.js";

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

const otpTtlMinutes = 10;
const otpTtlMs = otpTtlMinutes * 60 * 1000;
const resendCooldownMs = 60 * 1000;
const maxResetAttempts = 5;
const maxResetResends = 5;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function clientIp(req: any) {
  const forwardedFor = req.header?.("x-forwarded-for");
  if (forwardedFor) return String(forwardedFor).split(",")[0]?.trim();
  return req.ip || req.socket?.remoteAddress || undefined;
}

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
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + otpTtlMs); // 10 mins

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
  identifier: z.string().trim().min(1).max(254)
});

const verifyOtpSchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6)
});

const resetPasswordSchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6),
  newPassword: z.string().min(10).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/)
});

async function createPasswordResetOtp(req: any, res: any) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Identifier is required" });
    return;
  }

  const identifier = normalizeIdentifier(parsed.data.identifier);
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { mobileNumber: identifier }
      ]
    }
  });

  if (!user || !user.active) {
    recordAudit(req, "PASSWORD_RESET_ACCOUNT_NOT_FOUND", { identifier }, 404);
    res.status(404).json({ error: "No account found with this email." });
    return;
  }

  const latest = await prisma.passwordResetRequest.findFirst({
    where: { identifier: user.email, used: false },
    orderBy: { createdAt: "desc" }
  });
  if (latest && latest.createdAt.getTime() > Date.now() - resendCooldownMs) {
    res.status(429).json({ error: "Please wait 60 seconds before requesting another OTP." });
    return;
  }

  const recentRequests = await prisma.passwordResetRequest.count({
    where: {
      identifier: user.email,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });
  if (recentRequests >= maxResetResends) {
    res.status(429).json({ error: "Resend limit exceeded. Please try again later." });
    return;
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + otpTtlMs);

  await prisma.passwordResetRequest.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true }
  });

  await prisma.passwordResetRequest.create({
    data: {
      userId: user.id,
      identifier: user.email,
      otpHash,
      expiresAt
    }
  });

  try {
    await sendPasswordResetOtpEmail(user.email, user.fullName, otp, otpTtlMinutes);
  } catch (error) {
    await prisma.passwordResetRequest.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });
    recordAudit(req, "PASSWORD_RESET_EMAIL_FAILED", { userId: user.id, identifier: user.email }, 502);
    res.status(502).json({ error: "Could not send OTP email. Please try again later." });
    return;
  }

  recordAudit(req, "PASSWORD_RESET_REQUESTED", { userId: user.id, identifier: user.email }, 200);

  res.json({
    success: true,
    message: "OTP sent to your registered email.",
    identifier: user.email,
    expiresInSeconds: otpTtlMinutes * 60,
    resendCooldownSeconds: 60
  });
}

authRouter.post("/forgot-password", async (req, res) => {
  await createPasswordResetOtp(req, res);
});

authRouter.post("/forgot-password/resend", async (req, res) => {
  await createPasswordResetOtp(req, res);
});

authRouter.post("/verify-reset-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const identifier = normalizeIdentifier(parsed.data.identifier);
  const { otp } = parsed.data;

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

  if (resetReq.attemptCount >= maxResetAttempts) {
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

  recordAudit(req, "PASSWORD_RESET_OTP_VERIFIED", { userId: resetReq.userId }, 200);
  res.json({ success: true, message: "OTP verified" });
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload or password doesn't meet criteria" });
    return;
  }

  const identifier = normalizeIdentifier(parsed.data.identifier);
  const { otp, newPassword } = parsed.data;

  const resetReq = await prisma.passwordResetRequest.findFirst({
    where: { identifier, used: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!resetReq || resetReq.expiresAt < new Date() || resetReq.attemptCount >= maxResetAttempts) {
    res.status(400).json({ error: "Invalid or expired session. Please request a new OTP." });
    return;
  }

  const isValid = await bcrypt.compare(otp, resetReq.otpHash);
  if (!isValid) {
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  const changedAt = new Date();
  const user = await prisma.user.update({
    where: { id: resetReq.userId },
    data: { password: newPasswordHash }
  });

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
  await sendPasswordChangedEmail(user.email, user.fullName, {
    changedAt,
    ip: clientIp(req),
    userAgent: req.header("user-agent") || undefined
  });

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
  password: z.string().min(6).max(128)
});

authRouter.post("/register-invited", async (req, res) => {
  const parsed = registerInvitedSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    res.status(400).json({ error: `Validation error: ${errorMsg}` });
    return;
  }

  const { token, fullName, mobileNumber, password } = parsed.data;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token, status: "PENDING" }
    });

    if (!invitation || invitation.expiresAt < new Date()) {
      res.status(400).json({ error: "Invalid or expired invitation link" });
      return;
    }

    // Check if mobile number is already in use by another user
    const existingUserWithPhone = await prisma.user.findFirst({
      where: {
        mobileNumber,
        NOT: {
          email: invitation.email
        }
      }
    });
    if (existingUserWithPhone) {
      res.status(400).json({ error: "Mobile number is already registered to another account" });
      return;
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
  } catch (error: any) {
    console.error("Error during invited registration:", error);
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : String(error.meta?.target || '');
      if (target.includes('mobileNumber')) {
        res.status(400).json({ error: "Mobile number is already registered" });
      } else if (target.includes('email')) {
        res.status(400).json({ error: "Email address is already registered" });
      } else {
        res.status(400).json({ error: `Unique constraint failed on field: ${target}` });
      }
    } else {
      res.status(500).json({ error: error.message || "Internal server error during registration" });
    }
  }
});

authRouter.post("/verify-invited-otp", async (req, res) => {
  const parsed = z.object({
    token: z.string().min(1),
    otp: z.string().length(6)
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload. Need valid token and 6-digit OTP." });
    return;
  }

  const { token, otp } = parsed.data;

  const invitation = await prisma.invitation.findUnique({
    where: { token, status: "PENDING" }
  });

  if (!invitation || invitation.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired invitation link" });
    return;
  }

  // Look up user by invitation email to retrieve their mobile number
  const userRecord = await prisma.user.findFirst({
    where: { email: invitation.email }
  });

  if (!userRecord || !userRecord.mobileNumber) {
    res.status(400).json({ error: "User profile not found. Please complete the registration form first." });
    return;
  }

  const otpRecord = await prisma.otpVerification.findFirst({
    where: { identifier: invitation.email, purpose: "REGISTER", used: false },
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
