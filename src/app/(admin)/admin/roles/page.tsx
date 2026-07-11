"use client";

import { useEffect, useState } from "react";
import { getRoles, getPermissions, assignPermissionToRole, removePermissionFromRole } from "@/app/actions/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: { permission: { id: string; name: string; description: string | null } }[];
};

type Permission = {
  id: string;
  name: string;
  description: string | null;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [rolesRes, permsRes] = await Promise.all([getRoles(), getPermissions()]);
    if (!("error" in rolesRes) && rolesRes.roles) setRoles(rolesRes.roles);
    if (!("error" in permsRes) && permsRes.permissions) setPermissions(permsRes.permissions);
    setLoading(false);
  };

   
  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const assignedPermissionIds = new Set(selectedRole?.permissions.map((p) => p.permission.id) ?? []);

  const handleAssign = async (permissionId: string) => {
    if (!selectedRoleId) return;
    const formData = new FormData();
    formData.append("roleId", selectedRoleId);
    formData.append("permissionId", permissionId);
    await assignPermissionToRole(formData);
    await loadData();
  };

  const handleRemove = async (permissionId: string) => {
    if (!selectedRoleId) return;
    const formData = new FormData();
    formData.append("roleId", selectedRoleId);
    formData.append("permissionId", permissionId);
    await removePermissionFromRole(formData);
    await loadData();
  };

  if (loading) return <p className="text-muted-foreground">Loading roles...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-1">Manage roles and assign permissions dynamically.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    selectedRoleId === role.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                  )}
                >
                  <div className="font-medium">{role.name}</div>
                  {role.description && <div className="text-muted-foreground text-xs">{role.description}</div>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{selectedRole ? `Permissions: ${selectedRole.name}` : "Select a role"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <p className="text-sm text-muted-foreground">Choose a role from the left to manage its permissions.</p>
            ) : (
              <div className="space-y-2">
                {permissions.map((perm) => {
                  const assigned = assignedPermissionIds.has(perm.id);
                  return (
                    <div key={perm.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{perm.name}</div>
                        {perm.description && <div className="text-xs text-muted-foreground">{perm.description}</div>}
                      </div>
                      {assigned ? (
                        <Button variant="outline" size="sm" onClick={() => handleRemove(perm.id)}>
                          Remove
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleAssign(perm.id)}>
                          Assign
                        </Button>
                      )}
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
