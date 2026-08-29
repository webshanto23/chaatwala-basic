"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const tranId = searchParams.get("tran_id");
    if (tranId) void fetch("/api/payment/outcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tranId, outcome: "CANCELLED" }) });
  }, [searchParams]);
  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-3xl font-bold mb-4 text-foreground">Payment Cancelled</h1>
      <p className="text-muted-foreground mb-6">
        Your payment was cancelled. You can try again or return to your cart.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/cart">Return to Cart</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/checkout">Retry Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
