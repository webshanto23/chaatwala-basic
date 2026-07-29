import { LogOut, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SecuritySection() {
  return (
    <Card className="group rounded-[2rem] border border-border/70 bg-card shadow-xl">
      <CardContent className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Button className="w-full sm:w-auto rounded-full">
          <LogOut className="mr-1.5 h-4 w-4" />
          Logout
        </Button>
        <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 sm:w-auto rounded-full">
          <Trash2 className="mr-1.5 h-4 w-4" />
          Delete account
        </Button>
      </CardContent>
    </Card>
  );
}
