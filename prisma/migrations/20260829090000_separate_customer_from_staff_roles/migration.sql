-- Preserve existing staff assignments while making the staff-only relation explicit.
ALTER TABLE "User" RENAME COLUMN "roleId" TO "staffRoleId";

-- Customer accounts do not belong to roles. Clear and remove the legacy customer role.
UPDATE "User"
SET "staffRoleId" = NULL
WHERE "staffRoleId" IN (
  SELECT "id" FROM "Role" WHERE "workspace" = 'CUSTOMER'
);

DELETE FROM "RolePermission"
WHERE "roleId" IN (
  SELECT "id" FROM "Role" WHERE "workspace" = 'CUSTOMER'
);

DELETE FROM "Role" WHERE "workspace" = 'CUSTOMER';

-- New roles are staff roles unless explicitly stated otherwise.
ALTER TABLE "Role" ALTER COLUMN "workspace" SET DEFAULT 'STAFF';
