import { redirect } from "next/navigation";
import StaffShell from "@/components/staff/staff-shell";
import StaffSidebar from "@/components/staff/staff-sidebar";
import { requireWorkspace } from "@/lib/authorize";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { authorized } = await requireWorkspace("staff");
  if (!authorized) redirect("/staff/sign-in");
  return <StaffShell title="Staff" sidebar={<StaffSidebar />}>{children}</StaffShell>;
}
