import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NotificationSettingsProps = {
  orderUpdates: boolean;
  offers: boolean;
  emailSms: boolean;
  onOrderUpdatesChange: () => void;
  onOffersChange: () => void;
  onEmailSmsChange: () => void;
};

type ToggleRowProps = {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
};

function ToggleRow({ label, description, enabled, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/70 px-3 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors focus:outline-none",
          enabled ? "bg-primary border-primary" : "bg-muted border-border"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export function NotificationSettings({
  orderUpdates,
  offers,
  emailSms,
  onOrderUpdatesChange,
  onOffersChange,
  onEmailSmsChange,
}: NotificationSettingsProps) {
  return (
    <Card className="group rounded-[2rem] border border-border/70 bg-white/95 shadow-xl">
      <CardHeader className="px-6 pb-2 pt-6">
        <CardTitle className="text-base">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6">
        <ToggleRow
          label="Order updates"
          description="Receive updates about your purchases"
          enabled={orderUpdates}
          onToggle={onOrderUpdatesChange}
        />
        <ToggleRow
          label="Offers"
          description="Discounts and new releases"
          enabled={offers}
          onToggle={onOffersChange}
        />
        <ToggleRow
          label="Email / SMS"
          description="Alerts sent to your preferred channels"
          enabled={emailSms}
          onToggle={onEmailSmsChange}
        />
      </CardContent>
    </Card>
  );
}
