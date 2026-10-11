import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { getGroupBalances } from "@/lib/balances";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { deleteGroupRows } from "@/lib/groupDelete";

interface GroupRow extends RowDataPacket {
  created_by: number;
}

interface UserRow extends RowDataPacket {
  id: number;
}

/**
 * DELETE /api/groups/[id]/members/[userId]
 *
 * - userId is the current user  → they leave the group
 * - userId is someone else      → only the group leader may remove them
 *
 * Nobody can go while they still owe or are owed money in the group (that
 * would leave balances nobody can settle).
 *
 * When the leader leaves, leadership passes to the remaining member with the
 * oldest account; if they were the only member, the group is deleted.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { id, userId: userIdParam } = await params;
    const groupId = Number(id);
    const targetId = Number(userIdParam);

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return Response.json({ error: "Invalid group ID" }, { status: 400 });
    }

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [[me]] = await db.query<UserRow[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [session.user.email],
    );

    if (!me) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const [groups] = await db.query<GroupRow[]>(
      "SELECT created_by FROM user_groups WHERE id = ? LIMIT 1",
      [groupId],
    );

    if (groups.length === 0) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    const creatorId = groups[0].created_by;

    // Both the person acting and the person leaving must be members
    const [members] = await db.query<UserRow[]>(
      `
        SELECT user_id AS id FROM group_members
        WHERE group_id = ? AND user_id IN (?, ?)
      `,
      [groupId, me.id, targetId],
    );
    const memberIds = new Set(members.map((m) => m.id));

    if (!memberIds.has(me.id)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!memberIds.has(targetId)) {
      return Response.json({ error: "That person is not in this group" }, { status: 404 });
    }

    const isSelf = targetId === me.id;

    if (!isSelf && me.id !== creatorId) {
      return Response.json(
        { error: "Only the group leader can remove members" },
        { status: 403 },
      );
    }

    // Don't strand money: balance must be settled first
    const { balances } = await getGroupBalances(groupId);
    const target = balances.find((b) => b.userId === targetId);
    const cents = Math.round((target?.net ?? 0) * 100);

    if (cents !== 0) {
      const amount = formatINR(Math.abs(cents) / 100, 2);
      const who = isSelf ? "You" : (target?.name ?? "This person");
      const verb = cents < 0 ? `still ${isSelf ? "owe" : "owes"}` : `${isSelf ? "are" : "is"} still owed`;

      return Response.json(
        {
          error: `${who} ${verb} ${amount} in this group. Settle up first, then try again.`,
        },
        { status: 409 },
      );
    }

    if (targetId !== creatorId) {
      await db.query("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [
        groupId,
        targetId,
      ]);

      return Response.json({ success: true });
    }

    // The leader is leaving: hand the group over, or delete it if they're alone
    const [others] = await db.query<UserRow[]>(
      `
        SELECT user_id AS id FROM group_members
        WHERE group_id = ? AND user_id <> ?
        ORDER BY user_id
        LIMIT 1
      `,
      [groupId, creatorId],
    );

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (others.length === 0) {
        await deleteGroupRows(connection, groupId);
      } else {
        await connection.query("UPDATE user_groups SET created_by = ? WHERE id = ?", [
          others[0].id,
          groupId,
        ]);
        await connection.query(
          "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
          [groupId, creatorId],
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return Response.json({
      success: true,
      groupDeleted: others.length === 0,
      newLeaderId: others[0]?.id ?? null,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
