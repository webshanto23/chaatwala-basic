"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Image from "next/image";

type OrderItem = {
  id: string;
  productId: string;
  productType: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  createdAt: string;
};

type Order = {
  id: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  sslTxnId: string | null;
  items: OrderItem[];
  createdAt: string;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(price: number) {
  return `৳ ${Number(price).toLocaleString("en-BD")}`;
}

function statusBadge(status: string) {
  switch (status) {
    case "paid":
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Paid
        </Badge>
      );
    case "pending_payment":
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "payment_failed":
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <Loader2 className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
  }
}

export default function OrdersPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.push("/signin?redirect=/orders");
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/my-orders", { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch orders");
        }
        const data = await res.json();
        setOrders(data.orders ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [auth.isAuthenticated, router]);

  if (!auth.isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto px-4 py-10 max-w-7xl flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto px-4 py-10 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4 text-foreground">My Orders</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/cart")}>
          Return to Cart
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <Package className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <Card className="rounded-[1.5rem] border border-border/70 bg-card shadow-xl">
          <CardContent className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your orders will appear here once you place one.
            </p>
            <Button asChild>
              <a href="/products">Browse Products</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="rounded-[1.5rem] border border-border/70 bg-card shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(order.status)}
                    <span className="font-bold text-lg text-foreground">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted/50 flex-shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {order.sslTxnId && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Transaction: {order.sslTxnId}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}