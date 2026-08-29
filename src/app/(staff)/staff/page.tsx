import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/features/auth/service";
import { getVisibleStaffNavigation } from "@/features/staff-navigation/registry";

export default async function StaffDashboardPage() {
  const session = await getSession();
  const items = getVisibleStaffNavigation(session?.user.permissions ?? [], session?.user.systemRoleKey === "super_admin").filter((item) => item.href !== "/staff");
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-foreground md:text-3xl">Staff Dashboard</h1><p className="text-muted-foreground">Your available tools are based on assigned permissions.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href}><Card className="h-full border-border/70 transition-colors hover:bg-muted"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-primary" />{item.label}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Open {item.label.toLowerCase()}.</CardContent></Card></Link>; })}</div></div>;
}
