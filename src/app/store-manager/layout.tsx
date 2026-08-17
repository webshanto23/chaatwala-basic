import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/service";
import { getUserRole } from "@/lib/authorize";
import prisma from "@/lib/prisma";
import StoreManagerShell from "@/components/store-manager/store-manager-shell";

export default async function StoreManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const role = getUserRole(session);
  if (role !== "admin" && role !== "store_manager") {
    redirect("/access-denied");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { managedStore: { select: { id: true } } },
  });

  if (!user?.managedStore) {
    redirect("/access-denied");
  }

  return <StoreManagerShell storeId={user.managedStore.id}>{children}</StoreManagerShell>;
}
