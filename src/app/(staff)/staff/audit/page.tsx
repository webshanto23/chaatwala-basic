import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/authorize";
import { getAuditLogs } from "@/app/actions/audit-logs";
import { AuditClient } from "@/features/staff-ui/audit/AuditClient";

export const revalidate = 60;

export default async function StaffAuditPage() {
  const access = await requirePermission("audit:view");
  if (!access.authorized) redirect("/access-denied");
  const result = await getAuditLogs({ limit: 20 });
  return <AuditClient initialLogs={result.logs ?? []} initialNextCursor={result.nextCursor} />;
}
