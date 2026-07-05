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
          "relative h-6 w-11 rounded-full border transition-colors",
          enabled ? "border-primary bg-primary" : "border-border bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
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
    <Card className="border-border/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="text-base">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
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
