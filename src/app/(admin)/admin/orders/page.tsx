"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { getOrders } from "@/app/actions/rbac";

type OrderRow = {
  userid: string;
  orderid: string;
  status: string;
  total: string;
};

export default function OrdersPage() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const result = await getOrders();
    if (!("error" in result) && result.orders) {
      setOrders(
        result.orders.map((order) => ({
          userid: order.userId,
          orderid: order.orderId,
          status: order.status,
          total: order.total,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.userid.toLowerCase().includes(q) ||
      o.orderid.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      o.total.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orders</h1>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search orders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading orders...</p>
      ) : (
        <DataTable
          columns={["UserId", "OrderId", "Status", "Total"]}
          data={filtered}
        />
      )}
    </div>
  );
}
