import HeroSettingsClient from "./HeroSettingsClient";
import { getHeroSettings } from "@/features/site-settings/service";

export default async function AdminHomepagePage() {
  const settings = await getHeroSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Homepage</h1>
        <p className="text-muted-foreground">Manage the public homepage hero image.</p>
      </div>
      <HeroSettingsClient settings={settings} />
    </div>
  );
}
