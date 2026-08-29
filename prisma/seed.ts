import { PrismaClient } from "@prisma/client";
import {
  ALL_PERMISSIONS,
  SEED_ROLE_PERMISSIONS,
  SUPER_ADMIN_SYSTEM_KEY,
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
  "food-category:manage": "Manage food categories",
  "food-tag:manage": "Manage food tags",
  "admin:create": "Promote a user to admin",
  "admin:delete": "Revoke admin from a user",
  "role:manage": "Manage role permissions",
  "audit:view": "View audit logs",
  "admin:access": "Access the admin panel",
  "store:view": "View stores",
  "store:create": "Create stores",
  "store:update": "Update stores",
  "store:delete": "Delete stores",
  "staff:manage": "Create and manage staff accounts",
  "permission:manage": "Manage the permission catalogue",
  "store:assign": "Assign staff to stores",
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
  const roleNames = Object.keys(SEED_ROLE_PERMISSIONS);
  for (const roleName of roleNames) {
    const isSuperAdmin = roleName === SUPER_ADMIN_SYSTEM_KEY;
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {
        workspace: "STAFF",
        isSystem: isSuperAdmin,
        systemKey: isSuperAdmin ? SUPER_ADMIN_SYSTEM_KEY : null,
      },
      create: {
        name: roleName,
        description: `${roleName} role`,
        workspace: "STAFF",
        isSystem: isSuperAdmin,
        systemKey: isSuperAdmin ? SUPER_ADMIN_SYSTEM_KEY : null,
      },
    });

    const desired = SEED_ROLE_PERMISSIONS[roleName];
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

async function bootstrapSuperAdmin() {
  const username = process.env.SUPER_ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD?.trim();
  if (!username || !password) return;

  const role = await prisma.role.findUnique({ where: { systemKey: SUPER_ADMIN_SYSTEM_KEY } });
  if (!role) return;

  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    if (existing.staffRoleId !== role.id || !existing.isActive) {
      await prisma.user.update({ where: { id: existing.id }, data: { staffRoleId: role.id, isActive: true } });
      console.log(`Updated Super Admin ${username}`);
    }
    return;
  }

  const hashedPassword = await import("bcrypt").then((b) => b.default.hash(password, 12));

  await prisma.user.create({
    data: {
      name: "Super Admin",
      username,
      password: hashedPassword,
      staffRoleId: role.id,
    },
  });

  console.log(`Created Super Admin ${username}`);
}

async function upsertFoodTaxonomy() {
  for (const name of ["Dish", "Drink", "Dessert", "Snack"]) {
    await prisma.foodCategory.upsert({ where: { slug: name.toLowerCase() }, update: { name }, create: { name, slug: name.toLowerCase() } });
  }
  for (const name of ["Popular", "New", "Spicy"]) {
    await prisma.foodTag.upsert({ where: { slug: name.toLowerCase() }, update: { name }, create: { name, slug: name.toLowerCase() } });
  }
}

async function main() {
  await upsertPermissions();
  await upsertRoles();
  await bootstrapSuperAdmin();
  await upsertFoodTaxonomy();
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
