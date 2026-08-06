import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signInSchema } from "@/lib/validations/auth";
import type { RoleName } from "@/lib/permissions";

type UserRole = RoleName;
export type { UserRole as AuthRole };

type Permission = string;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
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
    permissions: Permission[];
  }
}

async function loadUserPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
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

  if (!user || !user.role) {
    return { role: "user" as UserRole, permissions: [] as Permission[] };
  }

  const roleName = user.role.name as UserRole;
  const permissions = user.role.permissions.map((rp) => rp.permission.name) as Permission[];

  return { role: roleName, permissions };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const validated = signInSchema.parse(credentials);

        const user = await prisma.user.findUnique({
          where: { email: validated.email },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(validated.password, user.password);

        if (!passwordMatch) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        const { role, permissions } = await loadUserPermissions(user.id);
        token.role = role;
        token.permissions = permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.permissions = (token.permissions as Permission[]) ?? [];
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        select: { roleId: true },
      });
      if (!existing?.roleId) {
        const userRole = await prisma.role.findUnique({
          where: { name: "user" },
          select: { id: true },
        });
        if (userRole) {
          await prisma.user.update({
            where: { id: user.id },
            data: { roleId: userRole.id },
          });
        }
      }
    },
  },
});
