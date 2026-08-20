import { AppShell } from "@/components/layout/app-shell";
import { UserDataProvider } from "@/contexts/auth-context";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserDataProvider>
      <AppShell>{children}</AppShell>
    </UserDataProvider>
  );
}
