"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get("tran_id") ?? "";
  const [order, setOrder] = useState<{
    id: string;
    status: string;
    total: number;
    tranId: string;
  } | null>(null);
  const [loading, setLoading] = useState(Boolean(!tranId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tranId) {
      return;
    }
    const fetchOrder = async () => {
      try {
        const res = await fetch("/api/payment/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ val_id: tranId }),
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data.status === "VALID") {
          setOrder({
            id: "",
            status: "paid",
            total: data.amount,
            tranId: data.tran_id,
          });
        } else {
          setError(data.error ?? "Payment validation failed");
        }
      } catch {
        setError("Failed to validate payment");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [tranId]);

  if (loading) {
    return (
      <div className="mx-auto px-4 py-10 max-w-7xl">
        <p className="text-muted-foreground">Validating payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto px-4 py-10 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Payment Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-4">
          <Link href="/cart">Return to Cart</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Payment Successful</h1>
      <Card className="rounded-[1.5rem] border border-border/70 bg-white/95 shadow-xl">
        <CardContent className="p-6 space-y-4">
          <p className="text-green-600 font-semibold">Your payment has been verified.</p>
          {order && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-medium">{order.tranId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">৳ {order.total}</span>
              </div>
            </>
          )}
          <Button asChild className="mt-4">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}