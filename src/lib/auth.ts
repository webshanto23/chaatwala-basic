import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { customerSignInSchema, staffSignInSchema } from "@/lib/validations/auth";
import type { RoleName, Workspace } from "@/lib/permissions";

type UserRole = RoleName;
export type { UserRole as AuthRole };

type Permission = string;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      staffRoleId: string | null;
      workspace: Workspace;
      systemRoleKey: string | null;
      isActive: boolean;
      permissions: Permission[];
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    staffRoleId: string | null;
    workspace: Workspace;
    systemRoleKey: string | null;
    isActive: boolean;
    permissions: Permission[];
    sessionVersion: number;
  }
}

async function loadUserAuthorization(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      staffRole: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return {
      role: "customer" as UserRole,
      staffRoleId: null,
      workspace: "customer" as Workspace,
      systemRoleKey: null,
      isActive: false,
      permissions: [] as Permission[],
    };
  }

  if (!user.staffRole) {
    return {
      role: "customer" as UserRole,
      staffRoleId: null,
      workspace: "customer" as Workspace,
      systemRoleKey: null,
      isActive: user.isActive,
      permissions: [] as Permission[],
    };
  }

  const roleName = user.staffRole.name as UserRole;
  const permissions = user.staffRole.permissions.map((rp) => rp.permission.name) as Permission[];

  return {
    role: roleName,
    staffRoleId: user.staffRole.id,
    workspace: "staff" as const,
    systemRoleKey: user.staffRole.systemKey,
    isActive: user.isActive,
    permissions,
  };
}

async function authorizeCustomerCredentials(credentials: Record<string, unknown>) {
  const validated = customerSignInSchema.parse(credentials);
  const user = await prisma.user.findUnique({
    where: { email: validated.email.toLowerCase() },
    include: { staffRole: { select: { id: true } } },
  });
  if (!user || !user.password || !user.isActive || user.staffRole) return null;
  return (await bcrypt.compare(validated.password, user.password)) ? user : null;
}

async function authorizeStaffCredentials(credentials: Record<string, unknown>) {
  const validated = staffSignInSchema.parse(credentials);
  const user = await prisma.user.findUnique({
    where: { username: validated.username },
    include: { staffRole: { select: { workspace: true } } },
  });
  if (!user || !user.password || !user.isActive || user.staffRole?.workspace !== "STAFF") return null;
  return (await bcrypt.compare(validated.password, user.password)) ? user : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    Credentials({
      id: "customer-credentials",
      name: "Customer credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        return authorizeCustomerCredentials(credentials);
      },
    }),
    Credentials({
      id: "staff-credentials",
      name: "Staff credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        return authorizeStaffCredentials(credentials);
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "customer-credentials" || account.provider === "staff-credentials") {
        return true;
      }

      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        include: { staffRole: { select: { workspace: true } } },
      });
      return existing?.staffRole?.workspace !== "STAFF";
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        const authorization = await loadUserAuthorization(user.id);
        const { role, staffRoleId, workspace, systemRoleKey, isActive, permissions } = authorization;
        token.role = role;
        token.staffRoleId = staffRoleId;
        token.workspace = workspace;
        token.systemRoleKey = systemRoleKey;
        token.isActive = isActive;
        token.permissions = permissions;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { sessionVersion: true },
        });
        token.sessionVersion = dbUser?.sessionVersion ?? 0;
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { sessionVersion: true },
        });

        const dbVersion = dbUser?.sessionVersion ?? 0;
        const tokenVersion = (token.sessionVersion as number) ?? 0;

        if (dbVersion !== tokenVersion) {
          const { role, staffRoleId, workspace, systemRoleKey, isActive, permissions } = await loadUserAuthorization(token.id as string);
          token.role = role;
          token.staffRoleId = staffRoleId;
          token.workspace = workspace;
          token.systemRoleKey = systemRoleKey;
          token.isActive = isActive;
          token.permissions = permissions;
          token.sessionVersion = dbVersion;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.staffRoleId = (token.staffRoleId as string | null) ?? null;
        session.user.workspace = (token.workspace as Workspace) ?? "customer";
        session.user.systemRoleKey = (token.systemRoleKey as string | null) ?? null;
        session.user.isActive = Boolean(token.isActive);
        session.user.permissions = (token.permissions as Permission[]) ?? [];
      }
      return session;
    },
  },
});
