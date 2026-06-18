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

interface ExpenseRow extends RowDataPacket {
  paid_by: number;
  payer_name: string;
  payer_email: string;
  owed_by: number;
  debtor_name: string;
  debtor_email: string;
  amount_owed: number;
}

interface SettlementRow extends RowDataPacket {
  payer_id: number;
  payer_name: string;
  payer_email: string;
  receiver_id: number;
  receiver_name: string;
  receiver_email: string;
  amount: number;
}

/**
 * Fetch raw expense splits + settlements for a group, then compute net
 * balances and the minimal set of debts needed to settle them.
 */
export async function getGroupBalances(groupId: number): Promise<{
  balances: Balance[];
  debts: Debt[];
}> {
  // All expense splits for the group, joined with who paid
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

  // All settlements between members (not scoped to a group in your schema,
  // so we narrow to people who are members of this group)
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
      WHERE s.payer_id    IN (SELECT user_id FROM group_members WHERE group_id = ?)
        AND s.receiver_id IN (SELECT user_id FROM group_members WHERE group_id = ?)
    `,
    [groupId, groupId],
  );

  // --- Build a net-balance map: userId → cents ---
  const netCents = new Map<number, number>();
  const userInfo = new Map<number, { name: string; email: string }>();

  function ensureUser(id: number, name: string, email: string) {
    if (!netCents.has(id)) netCents.set(id, 0);
    if (!userInfo.has(id)) userInfo.set(id, { name, email });
  }

  function addCents(id: number, delta: number) {
    netCents.set(id, (netCents.get(id) ?? 0) + delta);
  }

  for (const row of expenseRows) {
    ensureUser(row.paid_by, row.payer_name, row.payer_email);
    ensureUser(row.owed_by, row.debtor_name, row.debtor_email);

    // amount_owed comes back as a string from DECIMAL columns
    const cents = Math.round(Number(row.amount_owed) * 100);

    if (row.paid_by !== row.owed_by) {
      // Payer is owed this amount; debtor owes it
      addCents(row.paid_by, cents);
      addCents(row.owed_by, -cents);
    }
    // If someone paid and also owes their own share, the two cancel out —
    // we only track cross-person flows above.
  }

  for (const row of settlementRows) {
    ensureUser(row.payer_id, row.payer_name, row.payer_email);
    ensureUser(row.receiver_id, row.receiver_name, row.receiver_email);

    const cents = Math.round(Number(row.amount) * 100);

    // Payer is paying off debt → net improves; receiver gets less owed to them
    addCents(row.payer_id, cents);
    addCents(row.receiver_id, -cents);
  }

  // --- Build Balance[] ---
  const balances: Balance[] = [...netCents.entries()].map(([userId, cents]) => ({
    userId,
    ...(userInfo.get(userId)!),
    net: cents / 100,
  }));

  // --- Minimise debts (greedy algorithm) ---
  // Separate into creditors (net > 0) and debtors (net < 0), then greedily
  // match the largest debtor to the largest creditor.
  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ ...b, cents: Math.round(b.net * 100) }))
    .sort((a, b) => b.cents - a.cents);

  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ ...b, cents: Math.round(-b.net * 100) }))
    .sort((a, b) => b.cents - a.cents);

  const debts: Debt[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.cents, debtor.cents);

    if (amount > 0) {
      debts.push({
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

  return { balances, debts };
}