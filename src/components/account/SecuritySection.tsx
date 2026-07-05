import { LogOut, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SecuritySection() {
  return (
    <Card className="border-border/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardContent className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Button className="w-full sm:w-auto">
          <LogOut className="mr-1.5 h-4 w-4" />
          Logout
        </Button>
        <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 sm:w-auto">
          <Trash2 className="mr-1.5 h-4 w-4" />
          Delete account
        </Button>
      </CardContent>
    </Card>
  );
}
