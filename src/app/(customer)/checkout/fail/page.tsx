"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckoutFailPage() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const tranId = searchParams.get("tran_id");
    if (tranId) void fetch("/api/payment/outcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tranId, outcome: "FAILED" }) });
  }, [searchParams]);
  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-3xl font-bold mb-4 text-foreground">Payment Failed</h1>
      <p className="text-muted-foreground mb-6">
        Your payment could not be completed. Please try again or contact support.
      </p>
      <Button asChild>
        <Link href="/checkout">Retry Payment</Link>
      </Button>
    </div>
  );
}
