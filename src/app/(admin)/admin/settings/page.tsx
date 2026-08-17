import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";

export const revalidate = 60;

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        Settings
      </h1>
      <p className="text-muted-foreground">
        Manage your account and system preferences.
      </p>

      <AdminSettingsClient
        userName={session.user.name}
        userEmail={session.user.email}
      />
    </div>
  );
}
