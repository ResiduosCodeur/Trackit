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
    <main className="min-h-screen bg-[#141812]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
        <Link
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-[#EDEFE8]/50 transition-colors hover:text-[#EDEFE8]"
          href="/dashboard"
        >
          ← Back to dashboard
        </Link>

        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-[#3FA873]">
            <span className="h-px w-5 bg-[#3FA873]" />
            All groups
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#EDEFE8]">
            Your groups
          </h1>
        </header>

        <section className="rounded-2xl border border-[#EDEFE8]/10 bg-[#1C211A] p-6">
          <CreateGroupButton />
        </section>

        {groups.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-[#EDEFE8]/10 bg-[#1C211A] px-5 py-4 transition-colors hover:border-[#3FA873]/40"
                >
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-[#3FA873]/0 transition-colors group-hover:bg-[#3FA873]" />
                  <span className="font-medium text-[#EDEFE8]">{group.name}</span>
                  <span className="text-[#EDEFE8]/40 transition-colors group-hover:text-[#3FA873]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#EDEFE8]/15 bg-[#1C211A]/40 p-6 text-center">
            <p className="text-sm text-[#EDEFE8]/50">
              No groups yet. Create one above to get started.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}