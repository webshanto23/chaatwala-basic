import { getAuditLogs } from "@/app/actions/audit-logs";
import { AuditClient } from "./AuditClient";

export const revalidate = 60;

export default async function AuditPage() {
  const result = await getAuditLogs({ limit: 20 });
  const logs = result.logs ?? [];

  return <AuditClient initialLogs={logs} />;
}
