"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/app/actions/audit-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Prisma } from "@prisma/client";
import { useRequestDedupe } from "@/hooks/use-request-dedupe";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  user: { name: string | null; email: string | null } | null;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { dedupe } = useRequestDedupe();

  const loadLogs = async (cursor?: string) => {
    setLoading(true);
    const result = await dedupe(
      `getAuditLogs-${cursor ?? "start"}`,
      () =>
        getAuditLogs({
          action: actionFilter || undefined,
          entity: entityFilter || undefined,
          limit: 20,
          cursor,
        })
    );
    if (!("error" in result) && result.logs) {
      setLogs(cursor ? (prev) => [...prev, ...result.logs] : result.logs);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [dedupe]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Track all critical actions across the system.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Action</label>
              <Input value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setNextCursor(null); }} placeholder="e.g. USER_DELETE" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Entity</label>
              <Input value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setNextCursor(null); }} placeholder="e.g. User" />
            </div>
            <Button onClick={() => loadLogs()} disabled={loading}>
              {loading ? "Loading..." : "Apply"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">When</th>
                    <th className="pb-2 text-left font-medium">User</th>
                    <th className="pb-2 text-left font-medium">Action</th>
                    <th className="pb-2 text-left font-medium">Entity</th>
                    <th className="pb-2 text-left font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-3">
                        <div className="font-medium">{log.user?.name ?? "Unknown"}</div>
                        <div className="text-muted-foreground">{log.user?.email ?? ""}</div>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3">{log.entity}{log.entityId ? ` #${log.entityId}` : ""}</td>
                      <td className="py-3">
                        {log.metadata ? (
                          <pre className="max-w-xs overflow-x-auto rounded-md bg-muted p-2 text-xs">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => nextCursor && loadLogs(nextCursor)} disabled={loading}>
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
