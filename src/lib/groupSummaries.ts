import type { RowDataPacket } from "mysql2";

import { getGroupBalances } from "@/lib/balances";
import { db } from "@/lib/db";

export interface GroupSummary {
  id: number;
  name: string;
  memberCount: number;
  /** Everything spent in the group so far */
  totalSpent: number;
  /** Positive: the viewer is owed. Negative: the viewer owes. */
  net: number;
}

interface SummaryRow extends RowDataPacket {
  id: number;
  name: string;
  user_id: number;
  member_count: number;
  total_spent: string | number;
}

/** Every group the user belongs to, newest first, with the figures the cards show. */
export async function getGroupSummaries(email: string): Promise<GroupSummary[]> {
  const [rows] = await db.query<SummaryRow[]>(
    `
      SELECT
        g.id,
        g.name,
        me.id AS user_id,
        (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) AS member_count,
        (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.group_id = g.id) AS total_spent
      FROM user_groups g
      INNER JOIN group_members gm ON gm.group_id = g.id
      INNER JOIN users me ON me.id = gm.user_id
      WHERE me.email = ?
      ORDER BY g.created_at DESC
    `,
    [email],
  );

  return Promise.all(
    rows.map(async (row) => {
      const { balances } = await getGroupBalances(row.id);
      const mine = balances.find((b) => b.userId === row.user_id);

      return {
        id: row.id,
        name: row.name,
        memberCount: Number(row.member_count),
        totalSpent: Number(row.total_spent),
        net: mine?.net ?? 0,
      };
    }),
  );
}
