import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StaffSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage your staff account security.</p>
      </div>
      <Card className="max-w-xl border-border/70">
        <CardHeader><CardTitle>Password</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Use your current password to choose a new one.</p>
          <Button asChild variant="outline"><Link href="/change-password">Change password</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
