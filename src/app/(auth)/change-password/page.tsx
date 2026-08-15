"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Lock } from "lucide-react";
import { DecorIcon } from "@/components/ui/decor-icon";
import { Logo } from "@/components/shared/footer/logo";
import { changePassword } from "@/app/actions/password";
import { useSession } from "next-auth/react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { status } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (status === "unauthenticated") {
    router.replace("/sign-in");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);

    const result = await changePassword(formData);

    if (result.success) {
      setSuccess(result.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => router.push("/profile/dashboard"), 2000);
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
              Change your account password
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

            <form className="space-y-2" onSubmit={handleSubmit}>
              <InputGroup>
                <InputGroupInput
                  placeholder="Current password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
                <InputGroupAddon align="inline-start">
                  <Lock />
                </InputGroupAddon>
              </InputGroup>

              <InputGroup>
                <InputGroupInput
                  placeholder="New password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  minLength={6}
                />
                <InputGroupAddon align="inline-start">
                  <Lock />
                </InputGroupAddon>
              </InputGroup>

              <Button className="w-full" size="sm" type="submit" disabled={isLoading}>
                {isLoading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </div>

          <p className="text-muted-foreground text-sm">
            <button
              type="button"
              onClick={() => router.back()}
              className="underline underline-offset-4 hover:text-primary"
            >
              Back
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
