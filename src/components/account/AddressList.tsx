import { MapPin, PencilLine, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Address = {
  id: number;
  label: string;
  line1: string;
  line2: string;
};

const addresses: Address[] = [
  {
    id: 1,
    label: "Home",
    line1: "12 Rose Avenue",
    line2: "Lakeside, CA 90001",
  },
  {
    id: 2,
    label: "Office",
    line1: "88 Market Street",
    line2: "Downtown, NY 10001",
  },
];

export function AddressList() {
  return (
    <Card className="border-border/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardHeader className="flex flex-row items-center justify-between px-4 pb-2 pt-4">
        <CardTitle className="text-base">Addresses</CardTitle>
        <Button variant="outline" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="rounded-xl border border-border/70 bg-background/70 p-3"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{address.label}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    Default
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{address.line1}</p>
                <p className="text-sm text-muted-foreground">{address.line2}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <PencilLine className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
