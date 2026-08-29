"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AtSignIcon } from "lucide-react";
import { Lock } from "lucide-react";
import { DecorIcon } from "@/components/ui/decor-icon";
import { AuthDivider } from "@/components/ui/auth-divider";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Logo } from "@/components/shared/footer/logo";
import { XIcon } from "@/components/icons/x-icon";
import Link from "next/link";
import { useState } from "react";
import { getSafeReturnPath, getWorkspaceHome } from "@/lib/auth-redirect";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorFromUrl = searchParams.get("error");
  const verifiedFromUrl = searchParams.get("verified");
  const returnPath = getSafeReturnPath(searchParams.get("redirect"));
  const urlError = errorFromUrl ? (errorFromUrl === "CredentialsSignin" ? "Invalid email or password" : "Login failed, please try again") : null;
  const urlVerified = verifiedFromUrl === "true" ? "Email verified successfully! Please sign in." : null;
  const displayError = error ?? urlError;
  const displaySuccess = urlVerified;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await signIn("customer-credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? "Invalid email or password" : "Login failed, please try again");
      setIsLoading(false);
      return;
    }

    const session = await getSession();
    router.replace(returnPath ?? getWorkspaceHome(session?.user?.workspace));
  };

  const handleOAuthSignIn = async (provider: string) => {
    await signIn(provider, { callbackUrl: returnPath ?? "/sign-in" });
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
              Sign in to your account & Get exclusive Discounts...
            </p>
          </div>
          <div className="space-y-4">
            {displayError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {displayError}
              </p>
            )}
            {displaySuccess && (
              <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                {displaySuccess}
              </p>
            )}

            <form className="space-y-2" onSubmit={handleSubmit}>
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
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
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
          <p className="text-muted-foreground text-sm">
            New to Chaatwala?{" "}
            <Link
              className="underline underline-offset-4 hover:text-primary"
              href="/sign-up"
            >
              Create an account
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
