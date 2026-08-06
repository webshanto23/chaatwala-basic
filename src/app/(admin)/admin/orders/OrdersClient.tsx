"use client";

import { useState } from "react";
import DataTable from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { getOrders } from "@/app/actions/rbac";

type OrderRow = { userId: string; orderId: string; status: string; total: string };

export function OrdersClient({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return o.userId.toLowerCase().includes(q) || o.orderId.toLowerCase().includes(q) || o.status.toLowerCase().includes(q) || o.total.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orders</h1>
        <div className="flex items-center gap-3">
          <Input placeholder="Search orders..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        </div>
      </div>

      <DataTable columns={["UserId", "OrderId", "Status", "Total"]} data={filtered} />
    </div>
  );
}
