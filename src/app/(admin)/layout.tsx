import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/service";
import { can } from "@/lib/permissions";
import AdminShell from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.permissions) {
    redirect("/sign-in");
  }
  const isAdmin = can(session.user.permissions, "admin:access");
  if (!isAdmin) {
    redirect("/");
  }
  return <AdminShell>{children}</AdminShell>;
}
