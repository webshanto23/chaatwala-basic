"use client";

import { useState } from "react";
import DataTable from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/admin/modals/Modal";
import UserDetailsClient from "@/components/admin/modals/UserDetailsClient";
import OrderDetailsClient from "@/components/admin/modals/OrderDetailsClient";

type OrderRow = { userId: string; userName: string; orderId: string; status: string; total: string; transactionId: string };

export function OrdersClient({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return o.userName.toLowerCase().includes(q) || o.orderId.toLowerCase().includes(q) || o.status.toLowerCase().includes(q) || o.total.toLowerCase().includes(q) || o.transactionId.toLowerCase().includes(q);
  });

  const displayData = filtered.map((o) => ({
    userid: o.userName,
    orderid: o.orderId,
    status: o.status,
    total: o.total,
    transactionid: o.transactionId,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orders</h1>
        <Input placeholder="Search orders..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" data-testid="admin-search" />
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={["User", "OrderId", "Status", "Total", "TransactionId"]}
          data={displayData}
          onRowClick={(row) => {
            const order = filtered.find((o) => o.orderId === row.orderid);
            if (order) {
              setSelectedOrderId(order.orderId);
              setOrderModalOpen(true);
            }
          }}
          renderCell={(col, row) => {
            if (col.toLowerCase() === "user") {
              const order = filtered.find((o) => o.orderId === row.orderid);
              const userName = order?.userName ?? String(row.userid ?? "-");
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (order) {
                      setSelectedUserId(order.userId);
                      setUserModalOpen(true);
                    }
                  }}
                  className="hover:underline"
                >
                  {userName}
                </button>
              );
            }
            if (col.toLowerCase() === "orderid") {
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const order = filtered.find((o) => o.orderId === row.orderid);
                    if (order) {
                      setSelectedOrderId(order.orderId);
                      setOrderModalOpen(true);
                    }
                  }}
                  className="font-mono hover:underline"
                >
                  {String(row.orderid)}
                </button>
              );
            }
            return String(row[col.toLowerCase()]);
          }}
        />
      </div>

      <div className="md:hidden space-y-4">
        {filtered.map((o) => (
          <Card key={o.orderId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedOrderId(o.orderId);
                    setOrderModalOpen(true);
                  }}
                  className="font-mono text-xs text-muted-foreground hover:text-foreground underline"
                >
                  #{o.orderId}
                </button>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : o.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>{o.status}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User</span>
                <button
                  onClick={() => {
                    setSelectedUserId(o.userId);
                    setUserModalOpen(true);
                  }}
                  className="font-medium hover:underline"
                >
                  {o.userName}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">${o.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction</span>
                <span className="font-mono text-xs">{o.transactionId}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-8">No orders found.</div>
        )}
      </div>

      {selectedUserId && (
        <Modal open={userModalOpen} onOpenChange={setUserModalOpen} title="Customer Details">
          <UserDetailsClient userId={selectedUserId} />
        </Modal>
      )}

      {selectedOrderId && (
        <Modal open={orderModalOpen} onOpenChange={setOrderModalOpen} title={`Order #${selectedOrderId}`}>
          <OrderDetailsClient orderId={selectedOrderId} />
        </Modal>
      )}
    </div>
  );
}
