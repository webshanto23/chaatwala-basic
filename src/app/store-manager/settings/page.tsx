import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import StoreManagerSettingsClient from "./StoreManagerSettingsClient";

export const revalidate = 120;

export default async function StoreManagerSettingsPage() {
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
        Manage your account preferences.
      </p>

      <StoreManagerSettingsClient
        userName={session.user.name}
        userEmail={session.user.email}
      />
    </div>
  );
}
