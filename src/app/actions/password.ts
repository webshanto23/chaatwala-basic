"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth";
import { hashToken, generateToken } from "@/lib/crypto";
import { sendVerificationEmail, sendPasswordResetEmail, sendSetPasswordEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, setPasswordSchema } from "@/lib/validations/password";
import { z } from "zod";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function forgotPassword(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const validated = forgotPasswordSchema.parse(raw);

    const rateResult = await checkRateLimit(`forgot-password:${validated.email}`, "strict");
    if (!rateResult.success) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      return { success: true, message: "If an account exists, we sent a password reset email." };
    }

    if (!user.password) {
      const token = generateToken();
      const hashedToken = await hashToken(token);
      const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

      await prisma.verificationToken.create({
        data: {
          identifier: user.email,
          token: hashedToken,
          expires,
        },
      });

      await sendSetPasswordEmail(user.email, token);
      return { success: true, message: "If an account exists, we sent a password reset email." };
    }

    const token = generateToken();
    const hashedToken = await hashToken(token);
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expires,
      },
    });

    await sendPasswordResetEmail(user.email, token);
    return { success: true, message: "If an account exists, we sent a password reset email." };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message || "Invalid input" };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const validated = resetPasswordSchema.parse(raw);
    const hashedToken = await hashToken(validated.token);

    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!tokenRecord) {
      return { success: false, error: "Invalid or expired reset link." };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } }),
    ]);

    return { success: true, message: "Password reset successful. You can now sign in." };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message || "Invalid input" };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const raw = Object.fromEntries(formData.entries());
    const validated = changePasswordSchema.parse(raw);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user || !user.password) {
      return { success: false, error: "No password set for this account." };
    }

    const currentMatch = await bcrypt.compare(validated.currentPassword, user.password);
    if (!currentMatch) {
      return { success: false, error: "Current password is incorrect." };
    }

    const hashedPassword = await bcrypt.hash(validated.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Password changed successfully." };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message || "Invalid input" };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function verifyEmail(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const validated = z.object({ token: z.string().min(1, "Token is required") }).parse(raw);
    const hashedToken = await hashToken(validated.token);

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return { success: false, error: "Invalid or expired verification link." };
    }

    await prisma.user.update({
      where: { email: tokenRecord.identifier },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: tokenRecord.identifier },
    });

    return { success: true, message: "Email verified successfully." };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function setPassword(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const validated = setPasswordSchema.parse(raw);
    const hashedToken = await hashToken(validated.token);

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return { success: false, error: "Invalid or expired link." };
    }

    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.identifier },
    });

    if (!user) {
      return { success: false, error: "Invalid or expired link." };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.deleteMany({
        where: { identifier: tokenRecord.identifier },
      }),
    ]);

    return { success: true, message: "Password set successfully. You can now sign in with your email and password." };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message || "Invalid input" };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function sendEmailVerification() {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const rateResult = await checkRateLimit(`send-verification:${session.user.email}`, "strict");
    if (!rateResult.success) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (user.emailVerified) {
      return { success: false, error: "Email is already verified." };
    }

    const token = generateToken();
    const hashedToken = await hashToken(token);
    const expires = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: hashedToken,
        expires,
      },
    });

    await sendVerificationEmail(user.email, token);
    return { success: true, message: "Verification email sent." };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
