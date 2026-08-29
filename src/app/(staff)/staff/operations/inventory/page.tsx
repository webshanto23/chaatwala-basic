import { redirect } from "next/navigation";
import { requirePermission, requireWorkspace } from "@/lib/authorize";
import { getStaffFoodInventory } from "@/features/food/actions";
import { FoodInventoryClient } from "@/features/staff-ui/inventory/FoodInventoryClient";

export default async function StaffInventoryPage() {
  const [access, workspace] = await Promise.all([requirePermission("food:view"), requireWorkspace("staff")]);
  if (!access.authorized || !workspace.authorized) redirect("/access-denied");
  const inventory = await getStaffFoodInventory();
  if ("error" in inventory) return <p className="text-sm text-muted-foreground">{inventory.error}</p>;
  return <FoodInventoryClient initialFoods={inventory.foods} />;
}
