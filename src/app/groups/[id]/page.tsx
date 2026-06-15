import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AddExpenseModal from "./AddExpenseModal";
import AddMemberForm from "./AddMemberForm";

interface Group extends RowDataPacket {
  id: number;
  name: string;
  created_at: Date;
  creator_name: string;
  creator_email: string;
}

interface GroupMember extends RowDataPacket {
  id: number;
  name: string;
  email: string;
}

interface Expense extends RowDataPacket {
  id: number;
  description: string | null;
  amount: string;
  created_at: Date;
  payer_name: string;
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const { id } = await params;
  const groupId = Number(id);

  if (!Number.isInteger(groupId) || groupId <= 0) {
    notFound();
  }

  const [groups] = await db.query<Group[]>(
    `
      SELECT
        user_groups.id,
        user_groups.name,
        user_groups.created_at,
        creator.name AS creator_name,
        creator.email AS creator_email
      FROM user_groups
      INNER JOIN users AS creator ON creator.id = user_groups.created_by
      INNER JOIN group_members ON group_members.group_id = user_groups.id
      INNER JOIN users AS viewer ON viewer.id = group_members.user_id
      WHERE user_groups.id = ? AND viewer.email = ?
      LIMIT 1
    `,
    [groupId, session.user.email],
  );

  const group = groups[0];

  if (!group) {
    notFound();
  }

  const [members] = await db.query<GroupMember[]>(
    `
      SELECT users.id, users.name, users.email
      FROM group_members
      INNER JOIN users ON users.id = group_members.user_id
      WHERE group_members.group_id = ?
      ORDER BY users.name
    `,
    [groupId],
  );
  const [expenses] = await db.query<Expense[]>(
    `
      SELECT
        expenses.id,
        expenses.description,
        expenses.amount,
        expenses.created_at,
        users.name AS payer_name
      FROM expenses
      INNER JOIN users ON users.id = expenses.paid_by
      WHERE expenses.group_id = ?
      ORDER BY expenses.created_at DESC
    `,
    [groupId],
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <Link href="/groups">Back to groups</Link>

      <h1>{group.name}</h1>
      <p>Created by: {group.creator_name}</p>
      <p>Created on: {new Date(group.created_at).toLocaleDateString()}</p>

      {group.creator_email === session.user.email ? (
        <AddMemberForm groupId={group.id} />
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Expenses</h2>
          <AddExpenseModal
            groupId={group.id}
            members={members.map((member) => ({
              id: member.id,
              name: member.name,
              email: member.email,
            }))}
          />
        </div>
        {expenses.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {expenses.map((expense) => (
              <li className="rounded-lg border border-black/15 p-3 dark:border-white/20" key={expense.id}>
                <div className="flex justify-between gap-4">
                  <span>{expense.description || "Expense"}</span>
                  <strong>{Number(expense.amount).toFixed(2)}</strong>
                </div>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Paid by {expense.payer_name} on{" "}
                  {new Date(expense.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No expenses yet.</p>
        )}
      </section>

      <h2>Members</h2>
      <ul>
        {members.map((member) => (
          <li key={member.id}>
            {member.name} ({member.email})
          </li>
        ))}
      </ul>
    </main>
  );
}
