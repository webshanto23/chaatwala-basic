"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { AtSignIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DecorIcon } from "@/components/ui/decor-icon";
import { Logo } from "@/components/shared/footer/logo";
import { getWorkspaceHome } from "@/lib/auth-redirect";

export default function StaffSignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await signIn("staff-credentials", { username, password, redirect: false });
    if (result?.error) {
      setError("Invalid username or password");
      setIsLoading(false);
      return;
    }
    const session = await getSession();
    router.replace(getWorkspaceHome(session?.user?.workspace));
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8">
      <div className="relative w-full max-w-sm space-y-8 p-6 md:p-8">
        <div className="absolute -inset-y-6 -left-px w-px bg-border" />
        <div className="absolute -inset-y-6 -right-px w-px bg-border" />
        <div className="absolute -inset-x-6 -top-px h-px bg-border" />
        <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
        <DecorIcon position="top-left" />
        <DecorIcon position="bottom-right" />
        <div className="space-y-1 text-center"><Logo /><p className="text-base text-muted-foreground">Sign in to the staff workspace.</p></div>
        <form className="space-y-3" onSubmit={submit}>
          {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <InputGroup><InputGroupInput placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /><InputGroupAddon align="inline-start"><AtSignIcon /></InputGroupAddon></InputGroup>
          <InputGroup><InputGroupInput placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><InputGroupAddon align="inline-start"><Lock /></InputGroupAddon></InputGroup>
          <Button className="w-full" size="sm" type="submit" disabled={isLoading}>{isLoading ? "Signing in..." : "Staff Sign In"}</Button>
        </form>
      </div>
    </div>
  );
}
