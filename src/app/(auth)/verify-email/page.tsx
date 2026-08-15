"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/ui/decor-icon";
import { Logo } from "@/components/shared/footer/logo";
import { verifyEmail, sendEmailVerification } from "@/app/actions/password";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "Invalid or missing verification token.");
  const [success, setSuccess] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("token", token);

    const result = await verifyEmail(formData);

    if (result.success) {
      setSuccess(result.message || "Email verified successfully.");
      setTimeout(() => router.push("/sign-in?verified=true"), 2000);
    } else {
      setError(result.error || "Something went wrong. Please try again.");
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await sendEmailVerification();

    if (result.success) {
      setSuccess(result.message || "Verification email sent.");
    } else {
      setError(result.error || "Something went wrong. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8">
      <div
        className={cn(
          "relative flex w-full max-w-sm flex-col justify-between p-6 md:p-8",
          "dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]"
        )}
      >
        <div className="absolute -inset-y-6 -left-px w-px bg-border" />
        <div className="absolute -inset-y-6 -right-px w-px bg-border" />
        <div className="absolute -inset-x-6 -top-px h-px bg-border" />
        <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
        <DecorIcon position="top-left" />
        <DecorIcon position="bottom-right" />

        <div className="w-full max-w-sm animate-in space-y-8">
          <div className="flex flex-col text-center space-y-1">
            <Logo />
            <p className="text-base text-muted-foreground">
              Verify your email address
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                {success}
              </p>
            )}

            {token && !success && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Click the button below to verify your email address.
                </p>
                <Button className="w-full" size="sm" onClick={handleVerify} disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify Email"}
                </Button>
              </div>
            )}

            {!token && !success && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your email is not verified. Please verify it to access all features.
                </p>
                <Button className="w-full" size="sm" onClick={handleResend} disabled={isLoading}>
                  {isLoading ? "Sending..." : "Resend Verification Email"}
                </Button>
              </div>
            )}
          </div>

          <p className="text-muted-foreground text-sm">
            <Link
              className="underline underline-offset-4 hover:text-primary"
              href="/sign-in"
            >
              Back to sign in
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
