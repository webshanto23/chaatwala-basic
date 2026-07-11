import UserDashboard from "@/components/account/UserDashboard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfileDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const isAdmin = (session.user.permissions as string[] | undefined)?.includes("admin:access");

  if (isAdmin) {
    redirect("/admin/dashboard");
  }

  return <UserDashboard />;
}
