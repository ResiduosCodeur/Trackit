import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

export interface Balance {
  userId: number;
  name: string;
  email: string;
  /** Positive = is owed money, negative = owes money */
  net: number;
}

export interface Debt {
  from: { userId: number; name: string; email: string };
  to: { userId: number; name: string; email: string };
  /** Always positive */
  amount: number;
}

/** One expense split: `owedBy` owes `paidBy` `amountOwed` (decimal rupees). */
export interface ExpenseSplitInput {
  paidBy: number;
  payerName: string;
  payerEmail: string;
  owedBy: number;
  debtorName: string;
  debtorEmail: string;
  amountOwed: number | string;
}

/** One settlement: `payerId` paid `receiverId` `amount` (decimal rupees). */
export interface SettlementInput {
  payerId: number;
  payerName: string;
  payerEmail: string;
  receiverId: number;
  receiverName: string;
  receiverEmail: string;
  amount: number | string;
}

interface ExpenseRow extends RowDataPacket {
  paid_by: number;
  payer_name: string;
  payer_email: string;
  owed_by: number;
  debtor_name: string;
  debtor_email: string;
  amount_owed: number | string;
}

interface SettlementRow extends RowDataPacket {
  payer_id: number;
  payer_name: string;
  payer_email: string;
  receiver_id: number;
  receiver_name: string;
  receiver_email: string;
  amount: number | string;
}

type UserRef = { userId: number; name: string; email: string };

function toCents(value: number | string): number {
  return Math.round(Number(value) * 100);
}

/**
 * Pure balance computation (no DB access), so it can be unit-tested.
 *
 * Returns:
 *  - balances:        each person's net position in the group
 *  - debts:           PAIRWISE debts ("A owes B 100", "A owes C 200"). Each
 *                     pair of people is netted against each other, but debts
 *                     are never re-routed through third parties.
 *  - simplifiedDebts: the reduced set of transfers that settles everyone,
 *                     only meant to be shown when the user asks to simplify.
 */
export function computeBalances(
  expenses: ExpenseSplitInput[],
  settlements: SettlementInput[],
): { balances: Balance[]; debts: Debt[]; simplifiedDebts: Debt[] } {
  const users = new Map<number, UserRef>();
  // owe.get(a)?.get(b) = cents that `a` owes `b` (gross, before netting the pair)
  const owe = new Map<number, Map<number, number>>();

  function ensureUser(userId: number, name: string, email: string) {
    if (!users.has(userId)) users.set(userId, { userId, name, email });
  }

  function addOwe(debtor: number, creditor: number, cents: number) {
    const row = owe.get(debtor) ?? new Map<number, number>();
    row.set(creditor, (row.get(creditor) ?? 0) + cents);
    owe.set(debtor, row);
  }

  for (const e of expenses) {
    ensureUser(e.paidBy, e.payerName, e.payerEmail);
    ensureUser(e.owedBy, e.debtorName, e.debtorEmail);

    // The payer's own share cancels out against what they paid.
    if (e.paidBy !== e.owedBy) {
      addOwe(e.owedBy, e.paidBy, toCents(e.amountOwed));
    }
  }

  for (const s of settlements) {
    ensureUser(s.payerId, s.payerName, s.payerEmail);
    ensureUser(s.receiverId, s.receiverName, s.receiverEmail);

    // Payer paid the receiver, so the payer now owes the receiver less.
    // (Overpaying simply turns into a debt in the other direction.)
    addOwe(s.payerId, s.receiverId, -toCents(s.amount));
  }

  // --- Pairwise debts: net each unordered pair of people ---
  const ids = [...users.keys()].sort((a, b) => a - b);
  const debts: Debt[] = [];
  const netCents = new Map<number, number>(ids.map((id) => [id, 0]));

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const aOwesB = owe.get(a)?.get(b) ?? 0;
      const bOwesA = owe.get(b)?.get(a) ?? 0;
      const diff = aOwesB - bOwesA; // > 0: a owes b; < 0: b owes a

      if (diff === 0) continue;

      const debtor = diff > 0 ? a : b;
      const creditor = diff > 0 ? b : a;
      const cents = Math.abs(diff);

      debts.push({
        from: users.get(debtor)!,
        to: users.get(creditor)!,
        amount: cents / 100,
      });
      netCents.set(debtor, netCents.get(debtor)! - cents);
      netCents.set(creditor, netCents.get(creditor)! + cents);
    }
  }

  // Largest amounts first; stable by name so the list doesn't jump around
  debts.sort(
    (x, y) =>
      y.amount - x.amount ||
      x.from.name.localeCompare(y.from.name) ||
      x.to.name.localeCompare(y.to.name),
  );

  const balances: Balance[] = ids.map((userId) => ({
    ...users.get(userId)!,
    net: netCents.get(userId)! / 100,
  }));

  return { balances, debts, simplifiedDebts: simplifyBalances(balances) };
}

/**
 * Greedy debt simplification: repeatedly match the largest debtor with the
 * largest creditor. Produces at most (people - 1) transfers.
 */
export function simplifyBalances(balances: Balance[]): Debt[] {
  const creditors = balances
    .filter((b) => Math.round(b.net * 100) > 0)
    .map((b) => ({ ...b, cents: Math.round(b.net * 100) }))
    .sort((a, b) => b.cents - a.cents || a.userId - b.userId);

  const debtors = balances
    .filter((b) => Math.round(b.net * 100) < 0)
    .map((b) => ({ ...b, cents: Math.round(-b.net * 100) }))
    .sort((a, b) => b.cents - a.cents || a.userId - b.userId);

  const result: Debt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.cents, debtor.cents);

    if (amount > 0) {
      result.push({
        from: { userId: debtor.userId, name: debtor.name, email: debtor.email },
        to: { userId: creditor.userId, name: creditor.name, email: creditor.email },
        amount: amount / 100,
      });
    }

    creditor.cents -= amount;
    debtor.cents -= amount;

    if (creditor.cents === 0) ci++;
    if (debtor.cents === 0) di++;
  }

  return result;
}

/**
 * Fetch raw expense splits + settlements for a group and compute balances.
 */
export async function getGroupBalances(groupId: number): Promise<{
  balances: Balance[];
  debts: Debt[];
  simplifiedDebts: Debt[];
}> {
  const [expenseRows] = await db.query<ExpenseRow[]>(
    `
      SELECT
        e.paid_by,
        payer.name   AS payer_name,
        payer.email  AS payer_email,
        es.user_id   AS owed_by,
        debtor.name  AS debtor_name,
        debtor.email AS debtor_email,
        es.amount_owed
      FROM expenses e
      INNER JOIN expense_splits es ON es.expense_id = e.id
      INNER JOIN users payer  ON payer.id  = e.paid_by
      INNER JOIN users debtor ON debtor.id = es.user_id
      WHERE e.group_id = ?
    `,
    [groupId],
  );

  // Settlements are scoped to the group they were recorded in. Older rows
  // (created before settlements.group_id existed) have group_id NULL; for
  // those we keep the previous behaviour of matching on membership.
  const [settlementRows] = await db.query<SettlementRow[]>(
    `
      SELECT
        s.payer_id,
        payer.name    AS payer_name,
        payer.email   AS payer_email,
        s.receiver_id,
        receiver.name  AS receiver_name,
        receiver.email AS receiver_email,
        s.amount
      FROM settlements s
      INNER JOIN users payer    ON payer.id    = s.payer_id
      INNER JOIN users receiver ON receiver.id = s.receiver_id
      WHERE s.group_id = ?
         OR (
           s.group_id IS NULL
           AND s.payer_id    IN (SELECT user_id FROM group_members WHERE group_id = ?)
           AND s.receiver_id IN (SELECT user_id FROM group_members WHERE group_id = ?)
         )
    `,
    [groupId, groupId, groupId],
  );

  return computeBalances(
    expenseRows.map((r) => ({
      paidBy: r.paid_by,
      payerName: r.payer_name,
      payerEmail: r.payer_email,
      owedBy: r.owed_by,
      debtorName: r.debtor_name,
      debtorEmail: r.debtor_email,
      amountOwed: r.amount_owed,
    })),
    settlementRows.map((r) => ({
      payerId: r.payer_id,
      payerName: r.payer_name,
      payerEmail: r.payer_email,
      receiverId: r.receiver_id,
      receiverName: r.receiver_name,
      receiverEmail: r.receiver_email,
      amount: r.amount,
    })),
  );
}
