import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGroupBalances } from "@/lib/balances";
import type { Debt } from "@/lib/balances";
import AddExpenseModal from "./AddExpenseModal";
import AddMemberForm from "./AddMemberForm";
import SettleUpModal from "./SettleUpModal";

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

  const { debts } = await getGroupBalances(groupId);
  const currentUser = members.find((m) => m.email === session.user!.email);
  const myDebts = debts.filter((d: Debt) => d.from.userId === currentUser?.id);
  const owedToMe = debts.filter((d: Debt) => d.to.userId === currentUser?.id);

  return (
    <main className="min-h-screen bg-[#141812]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <Link
            className="flex items-center gap-1.5 text-sm font-medium text-[#EDEFE8]/50 transition-colors hover:text-[#EDEFE8]"
            href="/groups"
          >
            ← Back to groups
          </Link>
        </div>

        {/* Group header */}
        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-[#3FA873]">
            <span className="h-px w-5 bg-[#3FA873]" />
            Group
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#EDEFE8]">
            {group.name}
          </h1>
          <p className="mt-2 text-sm text-[#EDEFE8]/50">
            Started by {group.creator_name} on{" "}
            {new Date(group.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>

        {group.creator_email === session.user.email ? (
          <div className="rounded-2xl border border-[#EDEFE8]/10 bg-[#1C211A] p-5">
            <AddMemberForm groupId={group.id} />
          </div>
        ) : null}

        {/* Balances */}
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-semibold text-[#EDEFE8]">
            Balances
          </h2>

          {myDebts.length === 0 && owedToMe.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EDEFE8]/15 bg-[#1C211A]/40 p-6 text-center">
              <p className="text-sm text-[#EDEFE8]/50">
                Everyone&apos;s settled up. Nice and tidy.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {owedToMe.map((debt: Debt) => (
                <li
                  key={`owed-${debt.from.userId}`}
                  className="relative flex items-center justify-between overflow-hidden rounded-xl border border-[#EDEFE8]/8 bg-[#1C211A] py-3.5 pl-5 pr-4"
                >
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-[#3FA873]" />
                  <p className="text-sm text-[#EDEFE8]/75">
                    <span className="font-medium text-[#EDEFE8]">
                      {debt.from.name}
                    </span>{" "}
                    owes you
                  </p>
                  <span className="tabular-amount text-base font-medium text-[#3FA873]">
                    ₹{debt.amount.toFixed(2)}
                  </span>
                </li>
              ))}

              {myDebts.map((debt: Debt) => (
                <li
                  key={`owe-${debt.to.userId}`}
                  className="relative flex items-center justify-between overflow-hidden rounded-xl border border-[#EDEFE8]/8 bg-[#1C211A] py-3.5 pl-5 pr-4"
                >
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-[#E0846F]" />
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-[#EDEFE8]/75">
                      You owe{" "}
                      <span className="font-medium text-[#EDEFE8]">
                        {debt.to.name}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-amount text-base font-medium text-[#E0846F]">
                      ₹{debt.amount.toFixed(2)}
                    </span>
                    <SettleUpModal
                      groupId={groupId}
                      receiver={debt.to}
                      suggestedAmount={debt.amount}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Expenses */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-xl font-semibold text-[#EDEFE8]">
              Expenses
            </h2>
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
                <li
                  className="flex items-center justify-between rounded-xl border border-[#EDEFE8]/8 bg-[#1C211A] py-3.5 pl-5 pr-4"
                  key={expense.id}
                >
                  <div>
                    <p className="font-medium text-[#EDEFE8]">
                      {expense.description || "Expense"}
                    </p>
                    <p className="mt-0.5 text-xs text-[#EDEFE8]/45">
                      Paid by {expense.payer_name} ·{" "}
                      {new Date(expense.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="tabular-amount text-base font-medium text-[#EDEFE8]">
                    ₹{Number(expense.amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#EDEFE8]/15 bg-[#1C211A]/40 p-6 text-center">
              <p className="text-sm text-[#EDEFE8]/50">
                No expenses yet. Add the first one above.
              </p>
            </div>
          )}
        </section>

        {/* Members */}
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-semibold text-[#EDEFE8]">
            Members
          </h2>
          <ul className="flex flex-wrap gap-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-2 rounded-full border border-[#EDEFE8]/10 bg-[#1C211A] px-3 py-1.5 text-sm"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-[#3FA873]/15 text-[10px] font-semibold text-[#3FA873]">
                  {member.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium text-[#EDEFE8]">{member.name}</span>
                <span className="text-[#EDEFE8]/40">{member.email}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}