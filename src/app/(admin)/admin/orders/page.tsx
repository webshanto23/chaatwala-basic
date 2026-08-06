"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/app/actions/rbac";
import { useRequestDedupe } from "@/hooks/use-request-dedupe";

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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { dedupe } = useRequestDedupe();

  const loadData = async (cursor?: string) => {
    setLoading(true);
    const result = await dedupe(
      `getOrders-${cursor ?? "start"}`,
      () => getOrders({ limit: 20, cursor })
    );
    if (!("error" in result) && result.orders) {
      const mapped = result.orders.map((order) => ({
        userid: order.userId,
        orderid: order.orderId,
        status: order.status,
        total: order.total,
      }));
      setOrders(cursor ? (prev) => [...prev, ...mapped] : mapped);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [dedupe]);

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

      {loading && orders.length === 0 ? (
        <p className="text-muted-foreground">Loading orders...</p>
      ) : (
        <>
          <DataTable
            columns={["UserId", "OrderId", "Status", "Total"]}
            data={filtered}
          />
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!nextCursor || loading}
              onClick={() => nextCursor && loadData(nextCursor)}
            >
              Load More
            </Button>
            {hasMore && (
              <span className="text-xs text-muted-foreground">
                Showing {filtered.length} of {orders.length}+ orders
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
