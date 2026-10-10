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
 * Body: { amount: string; groupId: number } plus exactly one of:
 *   - receiverId: the current user paid `receiverId`
 *   - payerId:    `payerId` paid the current user (recorded by the person
 *                 who received the money)
 *
 * The settlement is stored against the group so it only affects that
 * group's balances.
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

    const receiverIdInput =
      "receiverId" in body && typeof body.receiverId === "number"
        ? body.receiverId
        : null;

    const payerIdInput =
      "payerId" in body && typeof body.payerId === "number"
        ? body.payerId
        : null;

    const amount = "amount" in body ? amountToCents(body.amount) : null;

    const groupId =
      "groupId" in body && typeof body.groupId === "number"
        ? body.groupId
        : null;

    if ((receiverIdInput === null) === (payerIdInput === null)) {
      return Response.json(
        { error: "Provide exactly one of receiverId or payerId" },
        { status: 400 },
      );
    }

    const otherUserId = (receiverIdInput ?? payerIdInput) as number;

    if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
      return Response.json({ error: "Invalid user" }, { status: 400 });
    }

    if (groupId === null || !Number.isInteger(groupId) || groupId <= 0) {
      return Response.json({ error: "Invalid group" }, { status: 400 });
    }

    if (amount === null || amount <= 0 || amount > 9_999_999_999) {
      return Response.json(
        { error: "Enter a valid positive amount with up to two decimal places" },
        { status: 400 },
      );
    }

    // Resolve the current user from the session email
    const [[me]] = await db.query<UserRow[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [session.user.email],
    );

    if (!me) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    if (me.id === otherUserId) {
      return Response.json(
        { error: "You cannot settle with yourself" },
        { status: 400 },
      );
    }

    // The current user is always one side of the settlement
    const payerId = receiverIdInput !== null ? me.id : otherUserId;
    const receiverId = receiverIdInput !== null ? otherUserId : me.id;

    // Both parties must be members of the group
    const [members] = await db.query<UserRow[]>(
      `
        SELECT user_id AS id FROM group_members
        WHERE group_id = ? AND user_id IN (?, ?)
      `,
      [groupId, payerId, receiverId],
    );

    if (members.length < 2) {
      return Response.json(
        { error: "Both users must be members of the group" },
        { status: 400 },
      );
    }

    const [result] = await db.query<ResultSetHeader>(
      `
        INSERT INTO settlements (payer_id, receiver_id, amount, group_id)
        VALUES (?, ?, ?, ?)
      `,
      [payerId, receiverId, (amount / 100).toFixed(2), groupId],
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