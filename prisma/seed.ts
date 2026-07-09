import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { name: "users:view", description: "View users list" },
    { name: "users:create", description: "Create new users" },
    { name: "users:delete", description: "Delete users" },
    { name: "users:update", description: "Update users" },
    { name: "admins:assign", description: "Assign admin role" },
    { name: "admins:remove", description: "Remove admin role" },
    { name: "products:create", description: "Create products" },
    { name: "products:update", description: "Update products" },
    { name: "products:delete", description: "Delete products" },
    { name: "products:view", description: "View products" },
    { name: "store_manager:assign", description: "Assign store manager role" },
    { name: "dashboard:access", description: "Access dashboard" },
    { name: "user:access", description: "Access user profile" },
    { name: "admin:access", description: "Access admin panel" },
    { name: "audit:view", description: "View audit logs" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: {
      name: "user",
      description: "Standard customer",
      permissions: {
        create: [
          { permission: { connect: { name: "user:access" } } },
          { permission: { connect: { name: "dashboard:access" } } },
          { permission: { connect: { name: "products:view" } } },
        ],
      },
    },
  });

  const storeManagerRole = await prisma.role.upsert({
    where: { name: "store_manager" },
    update: {},
    create: {
      name: "store_manager",
      description: "Store manager",
      permissions: {
        create: [
          { permission: { connect: { name: "user:access" } } },
          { permission: { connect: { name: "dashboard:access" } } },
          { permission: { connect: { name: "products:create" } } },
          { permission: { connect: { name: "products:update" } } },
          { permission: { connect: { name: "products:view" } } },
          { permission: { connect: { name: "store_manager:assign" } } },
        ],
      },
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Admin user",
      permissions: {
        create: [
          { permission: { connect: { name: "admin:access" } } },
          { permission: { connect: { name: "dashboard:access" } } },
          { permission: { connect: { name: "users:view" } } },
          { permission: { connect: { name: "users:create" } } },
          { permission: { connect: { name: "users:update" } } },
          { permission: { connect: { name: "products:create" } } },
          { permission: { connect: { name: "products:update" } } },
          { permission: { connect: { name: "products:delete" } } },
          { permission: { connect: { name: "products:view" } } },
          { permission: { connect: { name: "audit:view" } } },
        ],
      },
    },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name: "super_admin" },
    update: {},
    create: {
      name: "super_admin",
      description: "Super admin with all permissions",
      permissions: {
        create: [
          { permission: { connect: { name: "admins:assign" } } },
          { permission: { connect: { name: "admins:remove" } } },
        ],
      },
    },
  });

  const usersWithoutRole = await prisma.user.findMany({
    where: { roleId: null },
  });

  for (const u of usersWithoutRole) {
    await prisma.user.update({
      where: { id: u.id },
      data: { roleId: userRole.id },
    });
  }

  console.log("Seed completed");
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
