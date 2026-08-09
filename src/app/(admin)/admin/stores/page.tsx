export const revalidate = 120;

import { getStores, getStoreManagers } from "@/features/stores/actions";
import { StoresClient } from "./StoresClient";

export default async function AdminStoresPage() {
  const [storesRes, managersRes] = await Promise.all([getStores(), getStoreManagers()]);
  const stores = "stores" in storesRes ? storesRes.stores : [];
  const managers = "managers" in managersRes ? managersRes.managers : [];

  return <StoresClient initialStores={stores} initialManagers={managers} />;
}
