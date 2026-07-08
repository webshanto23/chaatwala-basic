import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProfileIndexRedirect() {
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

  redirect("/profile/dashboard");
}
