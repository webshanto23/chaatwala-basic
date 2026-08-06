import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/service";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }
  return <>{children}</>;
}
