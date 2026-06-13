import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import CreateGroupButton from "../dashboard/CreateGroupButton";

interface Group extends RowDataPacket {
  id: number;
  name: string;
}

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const [groups] = await db.query<Group[]>(
    `
      SELECT user_groups.id, user_groups.name
      FROM user_groups
      INNER JOIN group_members ON group_members.group_id = user_groups.id
      INNER JOIN users ON users.id = group_members.user_id
      WHERE users.email = ?
      ORDER BY user_groups.created_at DESC
    `,
    [session.user.email],
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <Link className="w-fit text-sm underline" href="/dashboard">
        Back to dashboard
      </Link>

      <h1 className="text-3xl font-semibold">Your Groups</h1>

      <CreateGroupButton />

      <ul>
        {groups.map((group) => (
          <li key={group.id}>
            <Link href={`/groups/${group.id}`}>{group.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
