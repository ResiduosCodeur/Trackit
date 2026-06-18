import { getServerSession } from "next-auth";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface UserRow extends RowDataPacket {
  id: number;
}

function amountToCents(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value)) {
    return null;
  }
  const [whole, decimal = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

/**
 * POST /api/settlements
 *
 * Body: { receiverId: number; amount: string; groupId?: number }
 *
 * Records the current user paying `amount` to `receiverId`.
 * groupId is optional — used only to validate both parties share a group.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const receiverId =
      "receiverId" in body && typeof body.receiverId === "number"
        ? body.receiverId
        : null;

    const amount =
      "amount" in body ? amountToCents(body.amount) : null;

    const groupId =
      "groupId" in body && typeof body.groupId === "number"
        ? body.groupId
        : null;

    if (receiverId === null || !Number.isInteger(receiverId) || receiverId <= 0) {
      return Response.json({ error: "Invalid receiver" }, { status: 400 });
    }

    if (amount === null || amount <= 0 || amount > 9_999_999_999) {
      return Response.json(
        { error: "Enter a valid positive amount with up to two decimal places" },
        { status: 400 },
      );
    }

    // Resolve payer from session email
    const [[payer]] = await db.query<UserRow[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [session.user.email],
    );

    if (!payer) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    if (payer.id === receiverId) {
      return Response.json(
        { error: "You cannot settle with yourself" },
        { status: 400 },
      );
    }

    // If groupId provided, confirm both parties are members
    if (groupId !== null) {
      const [members] = await db.query<UserRow[]>(
        `
          SELECT user_id AS id FROM group_members
          WHERE group_id = ? AND user_id IN (?, ?)
        `,
        [groupId, payer.id, receiverId],
      );

      if (members.length < 2) {
        return Response.json(
          { error: "Both users must be members of the group" },
          { status: 400 },
        );
      }
    } else {
      // Without a groupId just verify the receiver exists
      const [[receiver]] = await db.query<UserRow[]>(
        "SELECT id FROM users WHERE id = ? LIMIT 1",
        [receiverId],
      );

      if (!receiver) {
        return Response.json({ error: "Receiver not found" }, { status: 404 });
      }
    }

    const [result] = await db.query<ResultSetHeader>(
      `
        INSERT INTO settlements (payer_id, receiver_id, amount)
        VALUES (?, ?, ?)
      `,
      [payer.id, receiverId, (amount / 100).toFixed(2)],
    );

    return Response.json(
      { success: true, settlementId: result.insertId },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}