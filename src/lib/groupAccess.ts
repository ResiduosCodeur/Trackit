import type { RowDataPacket } from "mysql2";

import { db } from "./db";

interface IdRow extends RowDataPacket {
  id: number;
}

interface GroupRow extends RowDataPacket {
  created_by: number;
  allow_member_rename: number;
  allow_member_add: number;
}

export interface GroupAccess {
  userId: number;
  creatorId: number;
  isCreator: boolean;
  allowMemberRename: boolean;
  allowMemberAdd: boolean;
}

/**
 * Who is this person in this group?
 *  - "unauthorised"  → no such user
 *  - "not-found"     → no such group
 *  - "not-member"    → the group exists but they are not in it
 *  - otherwise       → their role plus the leader's permission switches
 */
export async function getGroupAccess(
  groupId: number,
  email: string,
): Promise<GroupAccess | "unauthorised" | "not-found" | "not-member"> {
  const [users] = await db.query<IdRow[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  );

  if (users.length === 0) return "unauthorised";

  const [groups] = await db.query<GroupRow[]>(
    `
      SELECT created_by, allow_member_rename, allow_member_add
      FROM user_groups
      WHERE id = ?
      LIMIT 1
    `,
    [groupId],
  );

  if (groups.length === 0) return "not-found";

  const [members] = await db.query<IdRow[]>(
    "SELECT user_id AS id FROM group_members WHERE group_id = ? AND user_id = ?",
    [groupId, users[0].id],
  );

  if (members.length === 0) return "not-member";

  const group = groups[0];

  return {
    userId: users[0].id,
    creatorId: group.created_by,
    isCreator: users[0].id === group.created_by,
    allowMemberRename: Boolean(group.allow_member_rename),
    allowMemberAdd: Boolean(group.allow_member_add),
  };
}

/** Maps a failed lookup to the HTTP response every route returns for it. */
export function accessErrorResponse(result: "unauthorised" | "not-found" | "not-member") {
  if (result === "unauthorised") {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (result === "not-found") {
    return Response.json({ error: "Group not found" }, { status: 404 });
  }
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
