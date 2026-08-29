import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/service";
import { getUserWorkspace } from "@/lib/authorize";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  if (getUserWorkspace(session) !== "customer") {
    redirect("/access-denied");
  }

  return <>{children}</>;
}
