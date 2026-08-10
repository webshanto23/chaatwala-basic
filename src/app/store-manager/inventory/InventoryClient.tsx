"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import Image from "next/image";
import {
  getStoreInventory,
  toggleStoreItemAvailability,
} from "@/features/store-manager/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Dish = {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  tag: string | null;
  imageUrl: string | null;
};

type Drink = {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  tag: string | null;
  imageUrl: string | null;
};

type Combo = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  isAvailable: boolean;
  imageUrl: string | null;
  items: string[];
};

type Tab = "dishes" | "drinks" | "combos";
type SortDirection = "asc" | "desc";

type SortState = {
  field: string;
  direction: SortDirection;
};

export function InventoryClient() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("dishes");
  const [sort, setSort] = useState<SortState>({ field: "name", direction: "asc" });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const result = await getStoreInventory();
        if (!cancelled) {
          if ("dishes" in result) {
            setDishes(result.dishes ?? []);
            setDrinks(result.drinks ?? []);
            setCombos(result.combos ?? []);
          } else if ("error" in result) {
            toast.error(result.error);
          }
        }
      } catch {
        if (!cancelled) toast.error("Failed to load inventory");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSort = (field: string) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (field: string) => {
    if (sort.field !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sort.direction === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortItems = <T extends { name: string; price: number; isAvailable: boolean }>(items: T[]): T[] => {
    const filtered = items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
    return filtered.sort((a, b) => {
      const aVal = a[sort.field as keyof T];
      const bVal = b[sort.field as keyof T];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        return sort.direction === "asc" ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : aVal ? -1 : 1);
      }
      return 0;
    });
  };

  const handleToggleAvailability = async (productType: "dish" | "drink" | "combo", productId: string, currentStatus: boolean) => {
    const res = await toggleStoreItemAvailability(productType, productId, !currentStatus);
    if ("success" in res) {
      toast.success("Availability updated");
      if (productType === "dish") {
        setDishes((prev) => prev.map((item) => (item.id === productId ? { ...item, isAvailable: !currentStatus } : item)));
      } else if (productType === "drink") {
        setDrinks((prev) => prev.map((item) => (item.id === productId ? { ...item, isAvailable: !currentStatus } : item)));
      } else {
        setCombos((prev) => prev.map((item) => (item.id === productId ? { ...item, isAvailable: !currentStatus } : item)));
      }
    } else {
      toast.error(res.error);
    }
  };

  const renderDishTable = (items: Dish[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No dishes found.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Image</TableHead>
            <TableHead>
              <button onClick={() => handleSort("name")} className="flex items-center font-medium">
                Name {getSortIcon("name")}
              </button>
            </TableHead>
            <TableHead>
              <button onClick={() => handleSort("price")} className="flex items-center font-medium">
                Price {getSortIcon("price")}
              </button>
            </TableHead>
            <TableHead>Discount Price</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead>
              <button onClick={() => handleSort("isAvailable")} className="flex items-center font-medium">
                Status {getSortIcon("isAvailable")}
              </button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span className="text-xs text-muted-foreground">No img</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>৳ {item.price}</TableCell>
              <TableCell>{item.discountPrice != null ? `৳ ${item.discountPrice}` : "-"}</TableCell>
              <TableCell>
                {item.tag ? <Badge variant="secondary" className="text-xs">{item.tag}</Badge> : "-"}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleToggleAvailability("dish", item.id, item.isAvailable)}
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                    item.isAvailable ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </button>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-xs text-muted-foreground">Read-only</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderDrinkTable = (items: Drink[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No drinks found.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Image</TableHead>
            <TableHead>
              <button onClick={() => handleSort("name")} className="flex items-center font-medium">
                Name {getSortIcon("name")}
              </button>
            </TableHead>
            <TableHead>
              <button onClick={() => handleSort("price")} className="flex items-center font-medium">
                Price {getSortIcon("price")}
              </button>
            </TableHead>
            <TableHead>Discount Price</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead>
              <button onClick={() => handleSort("isAvailable")} className="flex items-center font-medium">
                Status {getSortIcon("isAvailable")}
              </button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span className="text-xs text-muted-foreground">No img</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>৳ {item.price}</TableCell>
              <TableCell>{item.discountPrice != null ? `৳ ${item.discountPrice}` : "-"}</TableCell>
              <TableCell>
                {item.tag ? <Badge variant="secondary" className="text-xs">{item.tag}</Badge> : "-"}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleToggleAvailability("drink", item.id, item.isAvailable)}
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                    item.isAvailable ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </button>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-xs text-muted-foreground">Read-only</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderComboTable = (items: Combo[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No combos found.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Image</TableHead>
            <TableHead>
              <button onClick={() => handleSort("name")} className="flex items-center font-medium">
                Name {getSortIcon("name")}
              </button>
            </TableHead>
            <TableHead>
              <button onClick={() => handleSort("price")} className="flex items-center font-medium">
                Price {getSortIcon("price")}
              </button>
            </TableHead>
            <TableHead>Original Price</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>
              <button onClick={() => handleSort("isAvailable")} className="flex items-center font-medium">
                Status {getSortIcon("isAvailable")}
              </button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span className="text-xs text-muted-foreground">No img</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>৳ {item.price}</TableCell>
              <TableCell>৳ {item.originalPrice}</TableCell>
              <TableCell className="max-w-xs truncate" title={item.items.join(", ")}>
                {item.items.join(", ")}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleToggleAvailability("combo", item.id, item.isAvailable)}
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                    item.isAvailable ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </button>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-xs text-muted-foreground">Read-only</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Menu / Inventory Management</h1>
          <p className="text-muted-foreground text-sm mt-1">View global menu items and toggle availability for your store.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 max-w-xs" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 border-b">
          {(["dishes", "drinks", "combos"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSort({ field: "name", direction: "asc" }); }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "dishes" ? "Dishes" : t === "drinks" ? "Drinks" : "Combos"}
            </button>
          ))}
        </div>

        {tab === "dishes" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              renderDishTable(sortItems(dishes))
            )}
          </div>
        )}

        {tab === "drinks" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              renderDrinkTable(sortItems(drinks))
            )}
          </div>
        )}

        {tab === "combos" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              renderComboTable(sortItems(combos))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
