"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Lock } from "lucide-react";
import { DecorIcon } from "@/components/ui/decor-icon";
import { Logo } from "@/components/shared/footer/logo";
import { resetPassword } from "@/app/actions/password";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "Invalid or missing reset token.");
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("password", password);

    const result = await resetPassword(formData);

    if (result.success) {
      setSuccess(result.message || "Password reset successful.");
      setTimeout(() => router.push("/sign-in"), 2000);
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
              Set a new password for your account
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
              <form className="space-y-2" onSubmit={handleSubmit}>
                <InputGroup>
                  <InputGroupInput
                    placeholder="New password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                  />
                  <InputGroupAddon align="inline-start">
                    <Lock />
                  </InputGroupAddon>
                </InputGroup>

                <Button className="w-full" size="sm" type="submit" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}

            {!token && !success && (
              <p className="text-sm text-muted-foreground">
                The reset link is invalid or has expired.{" "}
                <Link href="/forgot-password" className="underline underline-offset-4 hover:text-primary">
                  Request a new link
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
