"use client";

import { useState } from "react";
import { usePermissions } from "@/hooks/use-can";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { updateUserRole, deleteUser } from "@/app/actions/rbac";

type UserRow = { id: string; name: string | null; email: string; roleId: string | null; createdAt: string | Date };
type RoleOption = { id: string; name: string };

export function UsersClient({ initialUsers, initialRoles }: { initialUsers: UserRow[]; initialRoles: RoleOption[] }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [roles] = useState<RoleOption[]>(initialRoles);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const { can } = usePermissions();
  const canDeleteUser = can("user:delete");

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || roles.find((r) => r.id === u.roleId)?.name.toLowerCase().includes(q);
  });

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const formData = new FormData();
    formData.append("userId", userId);
    const res = await deleteUser(formData);
    if ("error" in res) { alert(res.error); return; }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    setSavingUserId(userId);
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("roleId", roleId);
    await updateUserRole(formData);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, roleId } : u));
    setSavingUserId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Users</h1>
        <div className="flex items-center gap-3">
          <Input placeholder="Search users..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" data-testid="admin-search" />
        </div>
      </div>

      <Card className="border-border/70">
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead><tr className="border-b border-border"><th className="px-4 py-3 text-left font-medium">Name</th><th className="px-4 py-3 text-left font-medium">Email</th><th className="px-4 py-3 text-left font-medium">Role</th>{canDeleteUser && (<th className="px-4 py-3 text-right font-medium">Actions</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? (<tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={3}>No users found.</td></tr>) : (
                filtered.map((user) => {
                  const currentRole = roles.find((r) => r.id === user.roleId);
                  return (
                    <tr key={user.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap">{user.name ?? "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{user.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select className="rounded-md border border-border bg-background px-2 py-1 text-sm" value={user.roleId ?? ""} disabled={savingUserId === user.id} onChange={(e) => handleRoleChange(user.id, e.target.value)}>
                          {roles.map((role) => (<option key={role.id} value={role.id}>{role.name}</option>))}
                        </select>
                      </td>
                      {canDeleteUser && (<td className="px-4 py-3 whitespace-nowrap text-right"><Button variant="destructive" size="sm" disabled={savingUserId === user.id} onClick={() => handleDelete(user.id)}>Delete</Button></td>)}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
