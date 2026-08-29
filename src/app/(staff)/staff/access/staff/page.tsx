import { redirect } from "next/navigation";
import StaffManagementClient from "@/features/access-control/StaffManagementClient";
import { getStaffAccessData } from "@/features/access-control/queries";

export default async function StaffAccessPage() {
  const data = await getStaffAccessData();
  if ("error" in data) redirect("/access-denied");
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-foreground md:text-3xl">Staff</h1><p className="text-muted-foreground">Create and review staff accounts.</p></div><StaffManagementClient {...data} /></div>;
}
