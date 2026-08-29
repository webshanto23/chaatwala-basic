"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createStaffRole, updateStaffRole } from "./actions";

export default function RoleManagementClient({ roles }: { roles: { id: string; name: string; description: string | null; permissions: { permission: { id: string; name: string } }[] }[] }) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [message, setMessage] = useState<string | null>(null);
  const saveRole = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(async () => { const result = await updateStaffRole(form); setMessage("error" in result ? result.error : "Role updated."); if (!("error" in result)) router.refresh(); }); };
  return <div className="space-y-6"><Card className="border-border/70"><CardHeader><CardTitle>Create Staff Role</CardTitle></CardHeader><CardContent><form className="flex flex-col gap-3 md:flex-row" onSubmit={(event) => { event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); startTransition(async () => { const result = await createStaffRole(form); setMessage("error" in result ? result.error : "Role created."); if (!("error" in result)) { element.reset(); router.refresh(); } }); }}><Input name="name" placeholder="Role name" required /><Input name="description" placeholder="Description (optional)" /><Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create Role"}</Button></form>{message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}</CardContent></Card><Card className="border-border/70"><CardHeader><CardTitle>Staff Roles</CardTitle></CardHeader><CardContent className="space-y-2">{roles.map((role) => <form className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-[1fr_2fr_auto]" key={role.id} onSubmit={saveRole}><input name="roleId" type="hidden" value={role.id} /><Input defaultValue={role.name} name="name" required /><Input defaultValue={role.description ?? ""} name="description" placeholder="Description (optional)" /><Button disabled={pending} type="submit" variant="outline">Save</Button><p className="md:col-span-3 text-xs text-muted-foreground">{role.permissions.map(({ permission }) => permission.name).join(", ") || "No permissions"}</p></form>)}</CardContent></Card></div>;
}
