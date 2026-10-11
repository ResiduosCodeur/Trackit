import type { PoolConnection } from "mysql2/promise";

/**
 * Removes a group and everything that belongs to it, children first:
 * expense splits → expenses → settlements → members → the group.
 * The caller owns the transaction.
 */
export async function deleteGroupRows(connection: PoolConnection, groupId: number) {
  await connection.query(
    `
      DELETE es FROM expense_splits es
      INNER JOIN expenses e ON e.id = es.expense_id
      WHERE e.group_id = ?
    `,
    [groupId],
  );
  await connection.query("DELETE FROM expenses WHERE group_id = ?", [groupId]);
  await connection.query("DELETE FROM settlements WHERE group_id = ?", [groupId]);
  await connection.query("DELETE FROM group_members WHERE group_id = ?", [groupId]);
  await connection.query("DELETE FROM user_groups WHERE id = ?", [groupId]);
}
