import { redirect } from "next/navigation";
import { requirePermission, requireWorkspace } from "@/lib/authorize";
import { getFoodCatalog, getFoodTaxonomy } from "@/features/food/queries";
import { FoodsClient } from "@/features/staff-ui/products/FoodsClient";

export const revalidate = 60;

export default async function StaffFoodsPage() {
  const [access, workspace] = await Promise.all([requirePermission("food:view"), requireWorkspace("staff")]);
  if (!access.authorized || !workspace.authorized) redirect("/access-denied");
  const [catalog, taxonomy] = await Promise.all([
    getFoodCatalog({ includeUnavailable: true, limit: 100 }),
    getFoodTaxonomy(),
  ]);
  return <FoodsClient initialFoods={catalog.foods} taxonomy={taxonomy} />;
}
