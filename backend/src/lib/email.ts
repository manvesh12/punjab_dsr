import nodemailer from "nodemailer";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Create SMTP Transporter dynamically if SMTP_PASS is configured
function getSmtpTransporter() {
  if (!SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,  // 10 seconds
    socketTimeout: 15000,     // 15 seconds
  });
}

async function sendEmailViaBrevo(to: string, subject: string, text: string, html: string) {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  // Use the SMTP_USER as the sender email, since the user already configured it on Render.
  // It should ideally match the email they used to sign up for Brevo.
  const senderEmail = SMTP_USER || 'no-reply@punjab-dsr.onrender.com';

  const payload = {
    sender: { name: 'Government of Punjab', email: senderEmail },
    to: [{ email: to }],
    subject: subject,
    textContent: text,
    htmlContent: html
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[BREVO API ERROR] Failed to send to ${to}. Status: ${response.status}`, errorData);
    throw new Error(`Brevo API Error: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  return data;
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const transporter = getSmtpTransporter();

  // 1. If SMTP_PASS is configured, prioritize free direct SMTP (Gmail App Password setup)
  if (transporter) {
    console.log(`[SMTP] Sending email to ${to} via SMTP server ${SMTP_HOST}...`);
    const info = await transporter.sendMail({
      from: `"Government of Punjab" <${SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[SMTP SENT] Email sent to ${to}. Message ID: ${info.messageId}`);
    return { messageId: info.messageId };
  }

  // 2. Otherwise fallback to Brevo HTTP API
  return sendEmailViaBrevo(to, subject, text, html);
}

export const sendOtpEmail = async (toEmail: string, otp: string) => {
  const subject = 'Verify your Registration - Punjab DSR';
  const text = `Your OTP for registration on the Punjab DSR Portal is: ${otp}\n\nThis OTP is valid for 10 minutes. Please do not share it with anyone.`;
  const html = `
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
  `;

  try {
    const data = await sendEmail(toEmail, subject, text, html);
    console.log(`[EMAIL SENT] OTP sent to ${toEmail}. MessageId: ${data?.messageId}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send OTP to ${toEmail}:`, error);
    throw new Error('Failed to send email');
  }
};

export const sendInvitationEmail = async (toEmail: string, token: string, role: string) => {
  const host = process.env.PUBLIC_APP_URL || 'https://punjab-dsr.vercel.app/legacy';
  const inviteLink = `${host}/login.html?invite=${token}`;

  const roleDisplay = role.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));

  const subject = 'Registration Link - Punjab DSR Portal';
  const text = `Your registration on the Punjab DSR Portal has been initiated as a ${roleDisplay}.\n\nPlease click the link below to complete your registration:\n${inviteLink}\n\nThis link is valid for 24 hours.`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Punjab DSR Portal</h2>
      </div>
      <div style="padding: 32px 24px; background-color: #ffffff;">
        <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">Complete Your Registration</h3>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Your registration on the Punjab DSR Portal has been initiated. Your designated role is <strong style="color: #1e3a8a;">${roleDisplay}</strong>.</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Please click the button below to complete your registration and set up your account password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteLink}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">Complete Registration</a>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb; font-size: 14px; margin-top: 0; background-color: #eff6ff; padding: 12px; border-radius: 6px;">${inviteLink}</p>
        <p style="color: #ef4444; font-size: 14px; font-weight: 500; margin-top: 24px;">Note: This registration link is valid for 24 hours.</p>
      </div>
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Government of Punjab. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    const data = await sendEmail(toEmail, subject, text, html);
    console.log(`[EMAIL SENT] Invitation sent to ${toEmail}. Message ID: ${data?.messageId}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send Invitation to ${toEmail}:`, error);
    throw new Error('Failed to send email');
  }
};
