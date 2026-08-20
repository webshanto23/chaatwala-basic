import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CheckoutSuccessPage from "@/app/(customer)/checkout/success/page";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

describe("CheckoutSuccessPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the gateway val_id in a form-encoded validation request", async () => {
    searchParams = new URLSearchParams({ val_id: "val_123" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "VALID", tran_id: "txn_123", amount: 450,
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<CheckoutSuccessPage />);

    await waitFor(() => expect(screen.getByText("Payment Successful")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/payment/validate", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "val_id=val_123",
    }));
    unmount();
  });

  it("shows an error instead of loading forever when the gateway callback has no val_id", () => {
    searchParams = new URLSearchParams();

    const { unmount } = render(<CheckoutSuccessPage />);

    expect(screen.getByText("Payment Error")).toBeInTheDocument();
    expect(screen.getByText(/Missing payment validation reference/)).toBeInTheDocument();
    unmount();
  });
});
