import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verify your email address</h2>
        <p style="color: #666; line-height: 1.6;">Click the button below to verify your email address.</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Verify Email</a>
        </div>
        <p style="color: #999; font-size: 14px;">If you did not request this, please ignore this email.</p>
        <p style="color: #999; font-size: 14px;">This link will expire in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@chaatwala.com",
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Reset your password</h2>
        <p style="color: #666; line-height: 1.6;">Click the button below to reset your password.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 14px;">If you did not request this, please ignore this email.</p>
        <p style="color: #999; font-size: 14px;">This link will expire in 1 hour.</p>
      </div>
    `,
  });
}

export async function sendSetPasswordEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const setPasswordUrl = `${appUrl}/set-password?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@chaatwala.com",
    to: email,
    subject: "Set your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Set your password</h2>
        <p style="color: #666; line-height: 1.6;">You signed up with Google. Click the button below to set a password for your account so you can sign in with email.</p>
        <div style="margin: 30px 0;">
          <a href="${setPasswordUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Set Password</a>
        </div>
        <p style="color: #999; font-size: 14px;">If you did not request this, please ignore this email.</p>
        <p style="color: #999; font-size: 14px;">This link will expire in 1 hour.</p>
      </div>
    `,
  });
}
