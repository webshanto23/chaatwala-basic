import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/lib/authorize";

export default async function ProfileIndexRedirect() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const role = getUserRole(session);
  if (role === "admin" || role === "store_manager") {
    redirect("/access-denied");
  }

  redirect("/profile/dashboard");
}
