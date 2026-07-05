import data from "../../../sitedata.json";
import { ChevronRight, KeyRound, MoonStar, UserRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SettingsListProps = {
  themeEnabled?: boolean;
  onThemeToggle?: () => void;
};

export function SettingsList({
  themeEnabled = false,
  onThemeToggle,
}: SettingsListProps) {
  const items = data.account.settings.map((item) => ({
    ...item,
    icon: item.icon === "UserRound" ? UserRound : KeyRound,
  }));

  return (
    <Card className="border-border/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="text-base">Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="divide-y divide-border/70">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-1 py-3 text-left transition-colors hover:bg-muted/70"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}

          <button
            type="button"
            onClick={onThemeToggle}
            className="flex w-full items-center gap-3 rounded-lg px-1 py-3 text-left transition-colors hover:bg-muted/70"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
              <MoonStar className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-sm text-muted-foreground">Use a lighter or darker look</p>
            </div>
            <div
              className={`flex h-6 w-11 items-center rounded-full border px-1 transition-colors ${
                themeEnabled ? "border-primary bg-primary" : "border-border bg-muted"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                  themeEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
