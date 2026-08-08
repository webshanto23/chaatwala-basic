"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
};

type Order = {
  id: string;
  status: string;
  total: string;
  sslTxnId: string | null;
  paymentMethod: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
  items: OrderItem[];
};

const orderCache = new Map<string, Order>();

export default function OrderDetailsClient({ orderId }: { orderId: string }) {
  const [data, setData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (orderCache.has(orderId)) {
      setData(orderCache.get(orderId)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/admin/orders/${orderId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load order");
        }
        return res.json();
      })
      .then((body) => {
        if (!cancelled) {
          orderCache.set(orderId, body.order);
          setData(body.order);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (error || !data) {
    return <p className="text-muted-foreground">{error ?? "Order not found."}</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-muted-foreground">User</p>
          <p className="font-medium">{data.user?.name ?? data.user?.email ?? "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Status</p>
          <p className="font-medium capitalize">{data.status.replace(/_/g, " ")}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total</p>
          <p className="font-medium">৳ {data.total}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Transaction ID</p>
          <p className="font-mono text-xs">{data.sslTxnId ?? "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Payment Method</p>
          <p className="font-medium">{data.paymentMethod ?? "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Created At</p>
          <p className="font-medium">{new Date(data.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground font-medium">Items</p>
        <div className="space-y-2">
          {data.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-2">
              <div className="flex items-center gap-3">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-medium">৳ {Number(item.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
