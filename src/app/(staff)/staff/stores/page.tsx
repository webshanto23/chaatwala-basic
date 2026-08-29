import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/authorize";
import { getStores, getStoreManagers } from "@/features/stores/actions";
import { StoresClient } from "@/features/staff-ui/stores/StoresClient";

export const revalidate = 120;

export default async function StaffStoresPage() {
  if (!(await requirePermission("store:view")).authorized) redirect("/access-denied");
  const [storesRes, managersRes] = await Promise.all([getStores(), getStoreManagers()]);
  return <StoresClient initialStores={"stores" in storesRes ? storesRes.stores : []} initialManagers={"managers" in managersRes ? managersRes.managers : []} />;
}
