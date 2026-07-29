import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ProfileHeaderProps = {
  name: string;
  email: string;
  phone?: string;
  image?: string;
};

export function ProfileHeader({
  name,
  email,
  phone,
  image,
}: ProfileHeaderProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="group rounded-[2rem] border border-border/70 bg-card shadow-xl transition-all">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary overflow-hidden flex-shrink-0">
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
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
              {phone ? phone : "Please add Phone & Address"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
