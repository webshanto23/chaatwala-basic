import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/service";
import { getUserRole } from "@/lib/authorize";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const role = getUserRole(session);
  if (role === "admin" || role === "store_manager") {
    redirect("/access-denied");
  }

  return <>{children}</>;
}
