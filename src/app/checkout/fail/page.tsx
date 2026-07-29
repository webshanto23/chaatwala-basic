"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckoutFailPage() {
  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-3xl font-bold mb-4 text-foreground">Payment Failed</h1>
      <p className="text-muted-foreground mb-6">
        Your payment could not be completed. Please try again or contact support.
      </p>
      <Button asChild>
        <Link href="/cart">Return to Cart</Link>
      </Button>
    </div>
  );
}