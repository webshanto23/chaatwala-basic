import { AppShell } from "@/components/layout/app-shell";
import { UserDataProvider } from "@/contexts/auth-context";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.workspace === "staff") redirect("/staff");

  return (
    <UserDataProvider>
      <AppShell>{children}</AppShell>
    </UserDataProvider>
  );
}
