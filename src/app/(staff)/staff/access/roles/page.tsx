import { redirect } from "next/navigation";
import RoleManagementClient from "@/features/access-control/RoleManagementClient";
import { getStaffAccessData } from "@/features/access-control/queries";

export default async function StaffRolesPage() {
  const data = await getStaffAccessData();
  if ("error" in data) redirect("/access-denied");
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-foreground md:text-3xl">Roles</h1><p className="text-muted-foreground">Manage the staff roles created by Super Admin.</p></div><RoleManagementClient roles={data.roles} /></div>;
}
