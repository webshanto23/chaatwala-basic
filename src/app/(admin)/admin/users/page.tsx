import { getUsers } from "@/app/actions/rbac";
import { UsersClient } from "./UsersClient";

export const revalidate = 60;

export default async function UsersPage() {
  const result = await getUsers({ limit: 20 });
  const users = result.users ?? [];
  const roles = result.roles ?? [];

  return <UsersClient initialUsers={users} initialRoles={roles} initialNextCursor={result.nextCursor} />;
}
