import { PrismaClient } from "@prisma/client";
import {
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  type RoleName,
} from "../src/lib/permissions";

const prisma = new PrismaClient();

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "order:create": "Place orders",
  "order:view": "View orders",
  "order:update": "Update orders",
  "payment:create": "Make payments",
  "food:view": "View food items",
  "food:like": "Like food items",
  "food:share": "Share food items",
  "feedback:create": "Submit feedback",
  "user:access": "Access authenticated user area",
  "user:view": "View users",
  "user:updateRole": "Change a user's role",
  "user:delete": "Delete users",
  "food:create": "Create food items",
  "food:update": "Update food items",
  "food:delete": "Delete food items",
  "admin:create": "Promote a user to admin",
  "admin:delete": "Revoke admin from a user",
  "role:manage": "Manage role permissions",
  "audit:view": "View audit logs",
  "admin:access": "Access the admin panel",
  "store:view": "View stores",
  "store:create": "Create stores",
  "store:update": "Update stores",
  "store:delete": "Delete stores",
};

async function upsertPermissions() {
  for (const name of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      update: { description: PERMISSION_DESCRIPTIONS[name] },
      create: { name, description: PERMISSION_DESCRIPTIONS[name] },
    });
  }
}

async function upsertRoles() {
  const roleNames = Object.keys(ROLE_PERMISSIONS) as RoleName[];
  for (const roleName of roleNames) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` },
    });

    const desired = ROLE_PERMISSIONS[roleName];
    const current = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });
    const currentNames = new Set(current.map((rp) => rp.permission.name));

    for (const permName of desired) {
      if (!currentNames.has(permName)) {
        const permission = await prisma.permission.findUnique({ where: { name: permName } });
        if (permission) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: permission.id },
          });
        }
      }
    }
  }
}

async function assignDefaultRoleToUsersWithoutOne() {
  const userRole = await prisma.role.findUnique({ where: { name: "user" } });
  if (!userRole) return;

  const usersWithoutRole = await prisma.user.findMany({ where: { roleId: null } });
  for (const u of usersWithoutRole) {
    await prisma.user.update({ where: { id: u.id }, data: { roleId: userRole.id } });
  }
}

async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) return;

  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  if (!adminRole) return;

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    if (existing.roleId !== adminRole.id) {
      await prisma.user.update({ where: { id: existing.id }, data: { roleId: adminRole.id } });
      console.log(`Promoted existing user ${adminEmail} to admin`);
    }
    return;
  }

  const password = process.env.ADMIN_PASSWORD?.trim();
  const hashedPassword = password
    ? await import("bcrypt").then((b) => b.default.hash(password, 12))
    : null;

  await prisma.user.create({
    data: {
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  console.log(`Created admin user ${adminEmail}`);
}

async function main() {
  await upsertPermissions();
  await upsertRoles();
  await assignDefaultRoleToUsersWithoutOne();
  await bootstrapAdmin();
  console.log(" completed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
