import HeroSettingsClient from "@/features/staff-ui/content/HeroSettingsClient";
import { getHeroSettings } from "@/features/site-settings/service";
import { requireSuperAdmin } from "@/lib/authorize";
import { redirect } from "next/navigation";

export default async function StaffHomepagePage() {
  if (!(await requireSuperAdmin()).authorized) redirect("/access-denied");
  const settings = await getHeroSettings();
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-foreground md:text-3xl">Homepage</h1><p className="text-muted-foreground">Manage the public homepage hero image.</p></div><HeroSettingsClient settings={settings} /></div>;
}
