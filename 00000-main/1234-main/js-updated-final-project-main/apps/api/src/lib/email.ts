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
      from: `"Government of Punjab" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: 'Verify your Registration - Punjab DSR',
      text: `Your OTP for registration on the Punjab DSR Portal is: ${otp}\n\nThis OTP is valid for 10 minutes. Please do not share it with anyone.`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #1e3a8a; padding: 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Punjab DSR Portal</h2>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">Registration Verification</h3>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Thank you for registering on the Punjab DSR Portal. Please use the following One-Time Password (OTP) to verify your account:</p>
            <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
              <h1 style="color: #1e3a8a; margin: 0; font-size: 36px; letter-spacing: 4px; font-weight: 700;">${otp}</h1>
            </div>
            <p style="color: #ef4444; font-size: 14px; font-weight: 500;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
          </div>
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Government of Punjab. All rights reserved.</p>
          </div>
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
  const host = process.env.PUBLIC_APP_URL || 'https://punjab-dsr.vercel.app/legacy';
  const inviteLink = `${host}/auth.html?invite=${token}`;
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[WARNING] SMTP credentials not configured. Invite link for ${toEmail} (Role: ${role}) is ${inviteLink}`);
    throw new Error('SMTP email credentials not configured in .env file.');
  }

  const roleDisplay = role.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));

  try {
    const info = await transporter.sendMail({
      from: `"Government of Punjab" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: 'You have been invited to the Punjab DSR Portal',
      text: `You have been invited to join the Punjab DSR Portal as a ${roleDisplay}.\n\nPlease click the link below to complete your registration:\n${inviteLink}\n\nThis link is valid for 24 hours.`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #1e3a8a; padding: 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Punjab DSR Portal</h2>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">Official Invitation</h3>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">You have been officially invited to join the Punjab DSR Portal. Your designated role is <strong style="color: #1e3a8a;">${roleDisplay}</strong>.</p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Please click the button below to complete your registration and set up your account:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteLink}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">Complete Registration</a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb; font-size: 14px; margin-top: 0; background-color: #eff6ff; padding: 12px; border-radius: 6px;">${inviteLink}</p>
            <p style="color: #ef4444; font-size: 14px; font-weight: 500; margin-top: 24px;">Note: This invitation link is valid for 24 hours.</p>
          </div>
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Government of Punjab. All rights reserved.</p>
          </div>
        </div>
      `,
    });
    console.log(`[EMAIL SENT] Invitation sent to ${toEmail}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send Invitation to ${toEmail}:`, error);
    throw new Error('Failed to send email');
  }
};
