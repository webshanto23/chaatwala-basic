"use client";

import { useState } from "react";
import DataTable from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modals/Modal";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { getStoreOrders, updateStoreOrderStatus, type OrderRow } from "@/features/store-manager/actions";
import StoreOrderDetailsClient from "@/components/store-manager/order-details-client";

type OrderRowData = OrderRow;

export function OrdersClient({ initialOrders, initialNextCursor }: { initialOrders: OrderRowData[]; initialNextCursor: string | null }) {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<OrderRowData[]>(initialOrders);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return o.userName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.status.toLowerCase().includes(q) || o.total.includes(q);
  });

  const displayData = filtered.map((o) => ({
    orderid: o.id,
    customer: o.userName,
    items: `${o.items.length} item${o.items.length !== 1 ? "s" : ""}`,
    total: `৳${o.total}`,
    payment: o.paymentStatus,
    createdat: new Date(o.createdAt).toLocaleDateString(),
    status: o.status,
  }));

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await getStoreOrders({ limit: 25, cursor: nextCursor });
    setLoadingMore(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setOrders((prev) => [...prev, ...res.orders]);
    setNextCursor(res.nextCursor);
  };

  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    const res = await updateStoreOrderStatus(orderId, "preparing");
    setActionLoading(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Order accepted");
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "preparing" } : o));
  };

  const handleReject = async (orderId: string) => {
    setActionLoading(orderId);
    const res = await updateStoreOrderStatus(orderId, "cancelled");
    setActionLoading(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Order rejected");
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
  };

  const handleView = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "preparing": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "ready": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "failed": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default: return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orders Management</h1>
        <Input placeholder="Search orders..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" data-testid="admin-search" />
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={["Order ID", "Customer", "Items", "Total", "Payment Status", "Created At", "Status"]}
          data={displayData}
          renderCell={(col, row) => {
            if (col.toLowerCase() === "orderid") {
              return (
                <button onClick={() => handleView(String(row.orderid))} className="font-mono hover:underline">
                  {String(row.orderid)}
                </button>
              );
            }
            if (col.toLowerCase() === "status") {
              return (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(String(row.status))}`}>
                  {String(row.status)}
                </span>
              );
            }
            if (col.toLowerCase() === "payment") {
              return (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentColor(String(row.payment))}`}>
                  {String(row.payment)}
                </span>
              );
            }
            return String(row[col.toLowerCase()] ?? "-");
          }}
          showActions
          onEdit={(row) => handleView(String(row.orderid))}
          onDelete={() => {}}
        />
      </div>

      <div className="md:hidden space-y-4">
        {filtered.map((o) => (
          <Card key={o.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <button onClick={() => handleView(o.id)} className="font-mono text-xs text-muted-foreground hover:text-foreground underline">
                  #{o.id}
                </button>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>{o.status}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{o.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{o.items.length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">৳{o.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentColor(o.paymentStatus)}`}>{o.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2 pt-2">
                {o.paymentStatus === "paid" && o.status === "pending" && (
                  <Button size="sm" onClick={() => handleAccept(o.id)} disabled={actionLoading === o.id}>
                    {actionLoading === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Accept
                  </Button>
                )}
                {o.paymentStatus === "paid" && (o.status === "pending" || o.status === "preparing") && (
                  <Button size="sm" variant="destructive" onClick={() => handleReject(o.id)} disabled={actionLoading === o.id}>
                    {actionLoading === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleView(o.id)}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-8">No orders found.</div>
        )}
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load More
          </Button>
        </div>
      )}

      {selectedOrderId && (
        <Modal open={detailOpen} onOpenChange={setDetailOpen} title={`Order #${selectedOrderId}`}>
          <StoreOrderDetailsClient orderId={selectedOrderId} />
        </Modal>
      )}
    </div>
  );
}

