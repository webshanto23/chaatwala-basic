import { MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StoreData = {
  id: string;
  name: string;
  phone: string;
  address: string;
  imageUrl: string | null;
  isOpen: boolean;
};

export function StoreButton({ store }: { store: StoreData }) {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-primary/10 px-4 py-3 text-sm text-primary shadow-inner shadow-primary/10">
      <div className="space-y-1">
        <p className="font-semibold">{store.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{store.address}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>{store.phone}</span>
        </div>
      </div>
      <Badge
        variant={store.isOpen ? "default" : "outline"}
        className="shrink-0"
      >
        {store.isOpen ? "Available" : "Temporarily Closed"}
      </Badge>
    </div>
  );
}
