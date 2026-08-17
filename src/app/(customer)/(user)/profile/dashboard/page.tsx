import UserDashboard from "@/components/account/UserDashboard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/authorize";

export default async function ProfileDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const role = getUserRole(session);
  if (role === "admin" || role === "store_manager") {
    redirect("/access-denied");
  }

  return <UserDashboard />;
}
