import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGroupBalances } from "@/lib/balances";
import type { RowDataPacket } from "mysql2";

interface MemberCheck extends RowDataPacket {
  user_id: number;
}

export async function GET(
  _request: Request,
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

    // Verify the viewer is a member of this group
    const [rows] = await db.query<MemberCheck[]>(
      `
        SELECT gm.user_id
        FROM group_members gm
        INNER JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = ? AND u.email = ?
        LIMIT 1
      `,
      [groupId, session.user.email],
    );

    if (rows.length === 0) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { balances, debts } = await getGroupBalances(groupId);

    return Response.json({ balances, debts });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}