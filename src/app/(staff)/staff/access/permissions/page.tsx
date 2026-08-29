import { redirect } from "next/navigation";
import PermissionManagementClient from "@/features/access-control/PermissionManagementClient";
import { getStaffAccessData } from "@/features/access-control/queries";

export default async function StaffPermissionsPage() {
  const data = await getStaffAccessData();
  if ("error" in data) redirect("/access-denied");
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-foreground md:text-3xl">Permissions</h1><p className="text-muted-foreground">Assign approved capabilities to staff roles.</p></div><PermissionManagementClient roles={data.roles} permissions={data.permissions} /></div>;
}
