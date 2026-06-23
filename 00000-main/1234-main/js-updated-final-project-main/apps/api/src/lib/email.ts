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
    return;
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
