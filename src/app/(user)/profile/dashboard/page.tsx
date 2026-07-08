import UserDashboard from "@/components/account/UserDashboard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfileDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.role !== "user") {
    if (session.user.role === "admin" || session.user.role === "super_admin" || session.user.role === "store_manager") {
      redirect("/admin/dashboard");
    }
    redirect("/");
  }

  return <UserDashboard />;
}
