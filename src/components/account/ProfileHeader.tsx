import { Mail, PencilLine, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ProfileHeaderProps = {
  name?: string;
  email?: string;
  phone?: string;
};

export function ProfileHeader({
  name = "Ava Carter",
  email = "ava.carter@example.com",
  phone = "+1 (555) 014-2211",
}: ProfileHeaderProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="border-border/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardContent className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground">{name}</h2>
          <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-3">
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              {phone}
            </span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <PencilLine className="mr-1.5 h-4 w-4" />
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  );
}
