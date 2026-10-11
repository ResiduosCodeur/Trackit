import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessErrorResponse, getGroupAccess } from "@/lib/groupAccess";
import { deleteGroupRows } from "@/lib/groupDelete";

function parseGroupId(id: string) {
  const groupId = Number(id);
  return Number.isInteger(groupId) && groupId > 0 ? groupId : null;
}

/**
 * PATCH /api/groups/[id]
 * Body: any of { name: string; allowMemberRename: boolean; allowMemberAdd: boolean }
 *
 * - name: the leader can always rename; other members can while the leader
 *   has "allow members to change the group name" switched on.
 * - allowMemberRename / allowMemberAdd: leader only.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const groupId = parseGroupId((await params).id);

    if (groupId === null) {
      return Response.json({ error: "Invalid group ID" }, { status: 400 });
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const hasName = "name" in body;
    const hasRenameToggle = "allowMemberRename" in body;
    const hasAddToggle = "allowMemberAdd" in body;

    if (!hasName && !hasRenameToggle && !hasAddToggle) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    let name: string | null = null;

    if (hasName) {
      name = typeof body.name === "string" ? body.name.trim() : "";

      if (!name) {
        return Response.json({ error: "Group name is required" }, { status: 400 });
      }

      if (name.length > 255) {
        return Response.json(
          { error: "Group name must be less than 255 characters" },
          { status: 400 },
        );
      }

      updates.push("name = ?");
      values.push(name);
    }

    if (hasRenameToggle) {
      if (typeof body.allowMemberRename !== "boolean") {
        return Response.json({ error: "Invalid setting" }, { status: 400 });
      }
      updates.push("allow_member_rename = ?");
      values.push(body.allowMemberRename ? 1 : 0);
    }

    if (hasAddToggle) {
      if (typeof body.allowMemberAdd !== "boolean") {
        return Response.json({ error: "Invalid setting" }, { status: 400 });
      }
      updates.push("allow_member_add = ?");
      values.push(body.allowMemberAdd ? 1 : 0);
    }

    const access = await getGroupAccess(groupId, session.user.email);

    if (typeof access === "string") {
      return accessErrorResponse(access);
    }

    if ((hasRenameToggle || hasAddToggle) && !access.isCreator) {
      return Response.json(
        { error: "Only the group leader can change these settings" },
        { status: 403 },
      );
    }

    if (hasName && !access.isCreator && !access.allowMemberRename) {
      return Response.json(
        { error: "The group leader has turned off renaming for members" },
        { status: 403 },
      );
    }

    await db.query(`UPDATE user_groups SET ${updates.join(", ")} WHERE id = ?`, [
      ...values,
      groupId,
    ]);

    return Response.json({ success: true, ...(name !== null ? { name } : {}) });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[id]
 *
 * Permanently deletes the group: its expenses (and their splits), the
 * settlements recorded in it, its members, then the group itself.
 * Only the group leader can do this.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const groupId = parseGroupId((await params).id);

    if (groupId === null) {
      return Response.json({ error: "Invalid group ID" }, { status: 400 });
    }

    const access = await getGroupAccess(groupId, session.user.email);

    if (typeof access === "string") {
      return accessErrorResponse(access);
    }

    if (!access.isCreator) {
      return Response.json(
        { error: "Only the group leader can delete the group" },
        { status: 403 },
      );
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      await deleteGroupRows(connection, groupId);
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
