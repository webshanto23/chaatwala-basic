"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assignPermissionToStaffRole, removePermissionFromStaffRole } from "./actions";

export default function PermissionManagementClient({ roles, permissions }: { roles: { id: string; name: string }[]; permissions: { id: string; name: string; description: string | null }[] }) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [message, setMessage] = useState<string | null>(null);
  const submit = (action: typeof assignPermissionToStaffRole, success: string) => (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(async () => { const result = await action(form); setMessage("error" in result ? result.error : success); if (!("error" in result)) router.refresh(); }); };
  const selects = <><select name="roleId" className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" required defaultValue=""><option value="" disabled>Select role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><select name="permissionId" className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" required defaultValue=""><option value="" disabled>Select permission</option>{permissions.map((permission) => <option key={permission.id} value={permission.id}>{permission.name}</option>)}</select></>;
  return <Card className="border-border/70"><CardHeader><CardTitle>Role Permissions</CardTitle></CardHeader><CardContent><form className="flex flex-col gap-3 md:flex-row" onSubmit={submit(assignPermissionToStaffRole, "Permission assigned.")}>{selects}<Button type="submit" disabled={pending}>{pending ? "Saving..." : "Assign"}</Button></form><form className="mt-3 flex flex-col gap-3 md:flex-row" onSubmit={submit(removePermissionFromStaffRole, "Permission removed.")}>{selects}<Button type="submit" disabled={pending} variant="outline">Remove</Button></form>{message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}<div className="mt-6 grid gap-2 sm:grid-cols-2">{permissions.map((permission) => <div className="rounded-md border border-border p-3" key={permission.id}><p className="text-sm font-medium">{permission.name}</p><p className="text-xs text-muted-foreground">{permission.description ?? "No description"}</p></div>)}</div></CardContent></Card>;
}
