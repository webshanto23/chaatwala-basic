import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/service";
import { can } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import StoreManagerShell from "@/components/store-manager/store-manager-shell";

export default async function StoreManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.permissions) {
    redirect("/");
  }

  const isStoreManager = can(session.user.permissions, "store:view");
  if (!isStoreManager) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { managedStore: { select: { id: true } } },
  });

  if (!user?.managedStore) {
    redirect("/");
  }

  return <StoreManagerShell storeId={user.managedStore.id}>{children}</StoreManagerShell>;
}
