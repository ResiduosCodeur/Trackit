import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface OwnedGroup extends RowDataPacket {
  id: number;
}

/**
 * PATCH /api/groups/[id]
 * Body: { name: string }
 *
 * Renames the group. Only the group creator can do this.
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

    const { id } = await params;
    const groupId = Number(id);

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return Response.json({ error: "Invalid group ID" }, { status: 400 });
    }

    const body: unknown = await request.json();
    const name =
      typeof body === "object" &&
      body !== null &&
      "name" in body &&
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    if (!name) {
      return Response.json({ error: "Group name is required" }, { status: 400 });
    }

    if (name.length > 255) {
      return Response.json(
        { error: "Group name must be less than 255 characters" },
        { status: 400 },
      );
    }

    const [groups] = await db.query<OwnedGroup[]>(
      `
        SELECT user_groups.id
        FROM user_groups
        INNER JOIN users AS creator ON creator.id = user_groups.created_by
        WHERE user_groups.id = ? AND creator.email = ?
        LIMIT 1
      `,
      [groupId, session.user.email],
    );

    if (groups.length === 0) {
      return Response.json(
        { error: "Only the group creator can rename the group" },
        { status: 403 },
      );
    }

    await db.query("UPDATE user_groups SET name = ? WHERE id = ?", [name, groupId]);

    return Response.json({ success: true, name });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
