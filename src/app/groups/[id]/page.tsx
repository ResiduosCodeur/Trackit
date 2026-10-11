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

import { ExpenseIcon, SettleIcon } from "@/components/CategoryIcon";
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

interface SettlementRow extends RowDataPacket {
  id: number;
  amount: string;
  created_at: Date;
  payer_id: number;
  payer_name: string;
  receiver_id: number;
  receiver_name: string;
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

  // Settled-up payments recorded in this group (older rows without a group_id
  // are matched by membership, same as the balances)
  const [settlements] = await db.query<SettlementRow[]>(
    `
      SELECT
        s.id,
        s.amount,
        s.created_at,
        s.payer_id,
        payer.name AS payer_name,
        s.receiver_id,
        receiver.name AS receiver_name
      FROM settlements s
      INNER JOIN users payer ON payer.id = s.payer_id
      INNER JOIN users receiver ON receiver.id = s.receiver_id
      WHERE s.group_id = ?
         OR (
           s.group_id IS NULL
           AND s.payer_id IN (SELECT user_id FROM group_members WHERE group_id = ?)
           AND s.receiver_id IN (SELECT user_id FROM group_members WHERE group_id = ?)
         )
    `,
    [groupId, groupId, groupId],
  );

  const { debts, simplifiedDebts } = await getGroupBalances(groupId);
  const currentUser = members.find((m) => m.email === session.user!.email);
  const simplifiedPref =
    (await cookies()).get(`simplify_${groupId}`)?.value === "1";

  // Expenses and settlements in one list, newest first
  const feed = [
    ...expenses.map((expense) => ({
      kind: "expense" as const,
      at: new Date(expense.created_at).getTime(),
      key: `e-${expense.id}`,
      expense,
    })),
    ...settlements.map((settlement) => ({
      kind: "settlement" as const,
      at: new Date(settlement.created_at).getTime(),
      key: `s-${settlement.id}`,
      settlement,
    })),
  ].sort((a, b) => b.at - a.at);

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
            Logs
          </h2>
          <AddExpenseModal groupId={group.id} members={memberList} />
        </div>

        {feed.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {feed.map((item) => {
              if (item.kind === "settlement") {
                const { settlement } = item;
                const youPaid = settlement.payer_id === currentUser?.id;
                const youReceived = settlement.receiver_id === currentUser?.id;

                return (
                  <li key={item.key}>
                    <div className="tk-card flex w-full items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
                      <SettleIcon />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">
                          {youPaid ? "You" : settlement.payer_name} paid{" "}
                          {youReceived ? "you" : settlement.receiver_name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted sm:text-sm">
                          Settlement · {formatShortDate(settlement.created_at)}
                        </span>
                      </span>
                      <span className="tabular-amount text-base font-semibold text-pos sm:text-lg">
                        {formatINR(Number(settlement.amount), 2)}
                      </span>
                    </div>
                  </li>
                );
              }

              const { expense } = item;

              return (
                <li key={item.key}>
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
              );
            })}
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
