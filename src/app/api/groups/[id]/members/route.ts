import { getServerSession } from "next-auth";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface UserId extends RowDataPacket {
  id: number;
}

interface OwnedGroup extends RowDataPacket {
  id: number;
}

export async function POST(
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
    const email =
      typeof body === "object" &&
      body !== null &&
      "email" in body &&
      typeof body.email === "string"
        ? body.email.trim()
        : "";

    if (!email) {
      return Response.json({ error: "Member email is required" }, { status: 400 });
    }

    if (email.length > 255) {
      return Response.json(
        { error: "Member email must be less than 255 characters" },
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
        { error: "Only the group creator can add members" },
        { status: 403 },
      );
    }

    const [users] = await db.query<UserId[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    if (users.length === 0) {
      return Response.json(
        { error: "No Trackit user was found with that email" },
        { status: 404 },
      );
    }

    const [result] = await db.query<ResultSetHeader>(
      `
        INSERT IGNORE INTO group_members (group_id, user_id)
        VALUES (?, ?)
      `,
      [groupId, users[0].id],
    );

    if (result.affectedRows === 0) {
      return Response.json(
        { error: "That user is already a member of this group" },
        { status: 409 },
      );
    }

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
