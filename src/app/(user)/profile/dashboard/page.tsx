import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UserDashboard from "@/components/account/UserDashboard";

export default async function ProfileDashboardPage() {
  const cookiesStore = await cookies();
  const cookie = cookiesStore.get("chaatwala-auth")?.value;
  if (!cookie) {
    // Not authenticated => redirect to home
    redirect("/");
  }

  try {
    const session = JSON.parse(decodeURIComponent(cookie!));
    if (!session?.isAuthenticated || session?.role !== "user") {
      redirect("/");
    }
  } catch (e) {
    redirect("/");
  }

  return <UserDashboard />;
}
