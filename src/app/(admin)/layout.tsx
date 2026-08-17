import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/service";
import { getUserRole } from "@/lib/authorize";
import AdminShell from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const role = getUserRole(session);
  if (role !== "admin") {
    redirect("/access-denied");
  }

  return <AdminShell>{children}</AdminShell>;
}
