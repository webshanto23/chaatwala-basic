import { redirect } from "next/navigation";

export default async function ProfileIndexRedirect() {
  redirect("/profile/dashboard");
}
