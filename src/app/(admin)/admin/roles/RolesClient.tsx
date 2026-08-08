"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { assignPermissionToRole, removePermissionFromRole } from "@/app/actions/rbac";

type Role = { id: string; name: string; description: string | null; permissions: { permission: { id: string; name: string; description: string | null } }[] };
type Permission = { id: string; name: string; description: string | null };

export function RolesClient({ initialRoles, initialPermissions }: { initialRoles: Role[]; initialPermissions: Permission[] }) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const permissions = initialPermissions;
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const assignedPermissionIds = new Set(selectedRole?.permissions.map((p) => p.permission.id) ?? []);

  const handleAssign = async (permissionId: string) => {
    if (!selectedRoleId) return;
    const formData = new FormData();
    formData.append("roleId", selectedRoleId);
    formData.append("permissionId", permissionId);
    await assignPermissionToRole(formData);
    setRoles((prev) => prev.map((r) => r.id === selectedRoleId ? { ...r, permissions: [...r.permissions, { permission: permissions.find((p) => p.id === permissionId)! }] } : r));
  };

  const handleRemove = async (permissionId: string) => {
    if (!selectedRoleId) return;
    const formData = new FormData();
    formData.append("roleId", selectedRoleId);
    formData.append("permissionId", permissionId);
    await removePermissionFromRole(formData);
    setRoles((prev) => prev.map((r) => r.id === selectedRoleId ? { ...r, permissions: r.permissions.filter((p) => p.permission.id !== permissionId) } : r));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-1">Manage roles and assign permissions dynamically.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roles.map((role) => (
                <button key={role.id} onClick={() => setSelectedRoleId(role.id)} className={cn("w-full rounded-md border px-3 py-2 text-left text-sm transition-colors", selectedRoleId === role.id ? "border-primary bg-primary/5" : "hover:bg-muted")}>
                  <div className="font-medium">{role.name}</div>
                  {role.description && <div className="text-muted-foreground text-xs">{role.description}</div>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>{selectedRole ? `Permissions: ${selectedRole.name}` : "Select a role"}</CardTitle></CardHeader>
          <CardContent>
            {!selectedRole ? (<p className="text-sm text-muted-foreground">Choose a role from the left to manage its permissions.</p>) : (
              <div className="space-y-2">
                 {permissions.map((perm) => {
                  const assigned = assignedPermissionIds.has(perm.id);
                  return (
                    <div key={perm.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{perm.name}</div>
                        {perm.description && <div className="text-xs text-muted-foreground">{perm.description}</div>}
                      </div>
                      {assigned ? (<Button variant="outline" size="sm" onClick={() => handleRemove(perm.id)}>Remove</Button>) : (<Button size="sm" onClick={() => handleAssign(perm.id)}>Assign</Button>)}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
