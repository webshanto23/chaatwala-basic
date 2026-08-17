"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AtSignIcon } from "lucide-react";
import { Lock } from "lucide-react";
import { User } from "lucide-react";
import { DecorIcon } from "@/components/ui/decor-icon";
import { AuthDivider } from "@/components/ui/auth-divider";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Logo } from "@/components/shared/footer/logo";
import { XIcon } from "@/components/icons/x-icon";
import Link from "next/link";
import { registerUser } from "@/app/actions/auth";

export default function SignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else if (role === "store_manager") {
        router.replace("/store-manager/dashboard");
      } else {
        router.replace("/profile/dashboard");
      }
    }
  }, [status, session, router]);

  const errorFromUrl = searchParams.get("error");
  const urlError = errorFromUrl ? (errorFromUrl === "CredentialsSignin" ? "Invalid email or password" : "Login failed, please try again") : null;
  const displayError = error ?? urlError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);

      const result = await registerUser(formData);

      if (result.success) {
        setSuccess("Account created successfully. Please verify your email to continue.");
        setName("");
        setPassword("");
      } else {
        setError("Failed to create account");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    router.replace("/sign-in");
    await signIn(provider, { callbackUrl: "/profile/dashboard" });
  };

  if (status === "authenticated" && session?.user) {
    return null;
  }

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
              Create your account & Get exclusive Discounts...
            </p>
          </div>
          <div className="space-y-4">
            {displayError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {displayError}
              </p>
            )}
            {success && (
              <div className="space-y-3">
                <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                  {success}
                </p>
                <p className="text-sm text-muted-foreground">
                  We sent a verification link to <strong>{email}</strong>.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => router.push("/verify-email")}
                  >
                    Verify Email
                  </Button>
                  <Button
                    className="w-full"
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`mailto:${email}`, "_blank")}
                  >
                    Open Mail App
                  </Button>
                </div>
              </div>
            )}

            {!success && (
              <div>
                <form className="space-y-2" onSubmit={handleSubmit}>
              <InputGroup>
                <InputGroupInput
                  placeholder="Enter your name"
                  type="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <InputGroupAddon align="inline-start">
                  <User />
                </InputGroupAddon>
              </InputGroup>

              <InputGroup>
                <InputGroupInput
                  placeholder="email@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <InputGroupAddon align="inline-start">
                  <AtSignIcon />
                </InputGroupAddon>
              </InputGroup>

              <InputGroup>
                <InputGroupInput
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <InputGroupAddon align="inline-start">
                  <Lock />
                </InputGroupAddon>
              </InputGroup>

              <Button className="w-full" size="sm" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>

            <AuthDivider>OR</AuthDivider>

            <div className="grid grid-cols-2 gap-2 space-y-2">
              <Button className="w-full" type="button" variant="outline" onClick={() => handleOAuthSignIn("google")}>
                <GoogleIcon data-icon="inline-start" />
              </Button>
              <Button className="w-full" type="button" variant="outline" onClick={() => handleOAuthSignIn("facebook")}>
                <XIcon data-icon="inline-start" />
              </Button>
            </div>
            </div>
          )}
          </div>
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link
              className="underline underline-offset-4 hover:text-primary"
              href="/sign-in"
            >
              Sign in
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
