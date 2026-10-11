import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGroupBalances } from "@/lib/balances";
import { detectSplit } from "@/lib/splits";
import PageShell, { BackLink } from "@/components/PageShell";
import Link from "next/link";
import { cookies } from "next/headers";

import { ExpenseIcon } from "@/components/CategoryIcon";
import { SettingsIcon } from "@/components/icons";
import { firstName, formatINR } from "@/lib/format";
import AddExpenseModal from "./AddExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import BalancesSection from "./BalancesSection";

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
  image: string | null;
}

interface Expense extends RowDataPacket {
  id: number;
  description: string | null;
  amount: string;
  created_at: Date;
  payer_name: string;
  paid_by: number;
}

/** 18/6/2026 */
function formatShortDate(date: Date | string) {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

interface SplitRow extends RowDataPacket {
  expense_id: number;
  user_id: number;
  amount_owed: string;
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
      SELECT users.id, users.name, users.email, users.image
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
        expenses.paid_by,
        users.name AS payer_name
      FROM expenses
      INNER JOIN users ON users.id = expenses.paid_by
      WHERE expenses.group_id = ?
      ORDER BY expenses.created_at DESC
    `,
    [groupId],
  );

  // Stored splits for every expense, so the edit modal can show how each one
  // was originally split.
  const [splitRows] = await db.query<SplitRow[]>(
    `
      SELECT es.expense_id, es.user_id, es.amount_owed
      FROM expense_splits es
      INNER JOIN expenses e ON e.id = es.expense_id
      WHERE e.group_id = ?
    `,
    [groupId],
  );

  const splitsByExpense = new Map<
    number,
    { userId: number; amountOwed: string }[]
  >();
  for (const row of splitRows) {
    const list = splitsByExpense.get(row.expense_id) ?? [];
    list.push({ userId: row.user_id, amountOwed: row.amount_owed });
    splitsByExpense.set(row.expense_id, list);
  }

  const { debts, simplifiedDebts } = await getGroupBalances(groupId);
  const currentUser = members.find((m) => m.email === session.user!.email);
  const simplifiedPref =
    (await cookies()).get(`simplify_${groupId}`)?.value === "1";

  const memberList = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  }));

  return (
    <PageShell>
      <BackLink href="/groups">Back to all groups</BackLink>

      {/* Group header */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="tk-eyebrow">
            <span className="h-px w-6 bg-accent" />
            Group
          </p>
          <h1 className="mt-2 break-words text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {group.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Started by {group.creator_name} on{" "}
            {new Date(group.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <Link
          aria-label="Group settings"
          className="mt-8 flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface text-xl text-ink/85 transition-colors hover:border-accent/50 hover:text-ink"
          href={`/groups/${group.id}/settings`}
        >
          <SettingsIcon />
        </Link>
      </header>

      {/* Balances */}
      <BalancesSection
        groupId={groupId}
        currentUserId={currentUser?.id ?? null}
        debts={debts}
        simplifiedDebts={simplifiedDebts}
        initialSimplified={simplifiedPref}
      />

      {/* Expenses */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Expenses
          </h2>
          <AddExpenseModal groupId={group.id} members={memberList} />
        </div>

        {expenses.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {expenses.map((expense) => (
              <li key={expense.id}>
                <EditExpenseModal
                  groupId={groupId}
                  expense={{
                    id: expense.id,
                    description: expense.description ?? "",
                    amount: expense.amount,
                    paidByUserId: expense.paid_by,
                    split: detectSplit(
                      members.map((m) => m.id),
                      splitsByExpense.get(expense.id) ?? [],
                      Math.round(Number(expense.amount) * 100),
                    ),
                  }}
                  members={memberList}
                >
                  <ExpenseIcon />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">
                      {expense.description || "Expense"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted sm:text-sm">
                      Paid by{" "}
                      {expense.paid_by === currentUser?.id ? (
                        "you"
                      ) : (
                        <>
                          <span className="sm:hidden">
                            {firstName(expense.payer_name)}
                          </span>
                          <span className="hidden sm:inline">
                            {expense.payer_name}
                          </span>
                        </>
                      )}{" "}
                      · {formatShortDate(expense.created_at)}
                    </span>
                  </span>
                  <span className="tabular-amount text-base font-semibold text-ink sm:text-lg">
                    {formatINR(Number(expense.amount), 2)}
                  </span>
                </EditExpenseModal>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-surface/40 p-8 text-center">
            <p className="text-sm text-muted">
              No expenses yet. Add the first one above.
            </p>
          </div>
        )}
      </section>
    </PageShell>
  );
}
