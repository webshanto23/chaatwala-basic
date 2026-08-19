import { auth } from "@/lib/auth";
import { getUserRole } from "@/lib/authorize";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AccessDeniedPage() {
  const session = await auth();
  const role = getUserRole(session);

  let dashboardHref = "/";
  let dashboardLabel = "Go to Home";

  if (role === "admin") {
    dashboardHref = "/admin/dashboard";
    dashboardLabel = "Go to Admin Dashboard";
  } else if (role === "store_manager") {
    dashboardHref = "/store-manager/dashboard";
    dashboardLabel = "Go to Store Manager Dashboard";
  } else if (session?.user) {
    dashboardHref = "/profile/dashboard";
    dashboardLabel = "Go to Profile";
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        You don&apos;t have permission to view this page. If you believe this is an error, please contact support.
      </p>
      <Button asChild className="mt-8">
        <Link href={dashboardHref}>{dashboardLabel}</Link>
      </Button>
    </div>
  );
}
