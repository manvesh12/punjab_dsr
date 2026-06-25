import nodemailer from 'nodemailer';
import { config } from './config.js';

// Setup Nodemailer transport using SMTP credentials from environment
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (toEmail: string, otp: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[WARNING] SMTP credentials not configured. OTP for ${toEmail} is ${otp}`);
    throw new Error('SMTP email credentials not configured in .env file.');
  }

  try {
    const info = await transporter.sendMail({
      from: `"Punjab DSR Portal" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: 'Verify your Registration - Punjab DSR',
      text: `Your OTP for registration on the Punjab DSR Portal is: ${otp}\n\nThis OTP is valid for 10 minutes. Please do not share it with anyone.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Registration Verification</h2>
          <p>Thank you for registering on the Punjab DSR Portal.</p>
          <p>Your One-Time Password (OTP) for verifying your account is:</p>
          <h1 style="background: #f4f4f5; padding: 10px; text-align: center; border-radius: 6px; letter-spacing: 2px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
        </div>
      `,
    });
    console.log(`[EMAIL SENT] OTP sent to ${toEmail}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send OTP to ${toEmail}:`, error);
    // You might choose to throw the error to bubble it up, but usually logging is fine
    throw new Error('Failed to send email');
  }
};

export const sendInvitationEmail = async (toEmail: string, token: string, role: string) => {
  const host = process.env.PUBLIC_APP_URL || 'http://localhost:5000';
  const inviteLink = `${host}/auth.html?invite=${token}`;
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[WARNING] SMTP credentials not configured. Invite link for ${toEmail} (Role: ${role}) is ${inviteLink}`);
    throw new Error('SMTP email credentials not configured in .env file.');
  }

  try {
    const info = await transporter.sendMail({
      from: `"Punjab DSR Portal" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: 'You have been invited to the Punjab DSR Portal',
      text: `You have been invited to join the Punjab DSR Portal as a ${role}.\n\nPlease click the link below to complete your registration:\n${inviteLink}\n\nThis link is valid for 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invitation to Punjab DSR Portal</h2>
          <p>You have been invited to join the Punjab DSR Portal with the role of <strong>${role}</strong>.</p>
          <p>Please click the button below to complete your registration:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Complete Registration</a>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${inviteLink}</p>
          <p>This invitation is valid for 24 hours.</p>
        </div>
      `,
    });
    console.log(`[EMAIL SENT] Invitation sent to ${toEmail}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send Invitation to ${toEmail}:`, error);
    throw new Error('Failed to send email');
  }
};
