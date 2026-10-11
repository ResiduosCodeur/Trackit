import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { getGroupBalances } from "@/lib/balances";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { deleteGroupRows } from "@/lib/groupDelete";

interface UserRow extends RowDataPacket {
  id: number;
}

interface GroupRow extends RowDataPacket {
  id: number;
  name: string;
  created_by: number;
}

/**
 * DELETE /api/account
 *
 * Deletes the signed-in user's account. Only allowed when they are settled up
 * (net balance of zero) in every group they belong to.
 *
 * - Groups they lead pass to the member with the oldest account; groups where
 *   they are the only member are deleted.
 * - They are removed from every group.
 * - The user row is anonymised rather than dropped, so other members' expense
 *   history and balances stay intact: name becomes "Deleted user", the email
 *   is replaced, and the password and photo are cleared. They can no longer
 *   sign in.
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const [users] = await db.query<UserRow[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [session.user.email],
    );

    if (users.length === 0) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const userId = users[0].id;

    const [groups] = await db.query<GroupRow[]>(
      `
        SELECT DISTINCT user_groups.id, user_groups.name, user_groups.created_by
        FROM user_groups
        LEFT JOIN group_members
          ON group_members.group_id = user_groups.id AND group_members.user_id = ?
        WHERE group_members.user_id IS NOT NULL OR user_groups.created_by = ?
      `,
      [userId, userId],
    );

    // Everything must be settled first
    const unsettled: string[] = [];

    for (const group of groups) {
      const { balances } = await getGroupBalances(group.id);
      const mine = balances.find((b) => b.userId === userId);
      const cents = Math.round((mine?.net ?? 0) * 100);

      if (cents !== 0) {
        const amount = formatINR(Math.abs(cents) / 100, 2);
        unsettled.push(
          `${group.name} (${cents < 0 ? `you owe ${amount}` : `you are owed ${amount}`})`,
        );
      }
    }

    if (unsettled.length > 0) {
      return Response.json(
        {
          error: `Settle up in every group before deleting your account. Still open: ${unsettled.join(", ")}.`,
        },
        { status: 409 },
      );
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      for (const group of groups) {
        const [others] = await connection.query<UserRow[]>(
          `
            SELECT user_id AS id FROM group_members
            WHERE group_id = ? AND user_id <> ?
            ORDER BY user_id
            LIMIT 1
          `,
          [group.id, userId],
        );

        if (others.length === 0) {
          await deleteGroupRows(connection, group.id);
          continue;
        }

        if (group.created_by === userId) {
          await connection.query("UPDATE user_groups SET created_by = ? WHERE id = ?", [
            others[0].id,
            group.id,
          ]);
        }

        await connection.query(
          "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
          [group.id, userId],
        );
      }

      await connection.query(
        `
          UPDATE users
          SET name = 'Deleted user',
              email = CONCAT('deleted-', id, '@deleted.invalid'),
              password_hash = NULL,
              image = NULL
          WHERE id = ?
        `,
        [userId],
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}