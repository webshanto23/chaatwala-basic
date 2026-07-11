import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProfileIndexRedirect() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const isAdmin = (session.user.permissions as string[] | undefined)?.includes("admin:access");

  if (!isAdmin) {
    redirect("/profile/dashboard");
  }

  redirect("/admin/dashboard");
}
