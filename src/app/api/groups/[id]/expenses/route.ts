import { getServerSession } from "next-auth";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface Member extends RowDataPacket {
  id: number;
  email: string;
}

interface CustomSplit {
  userId: number;
  amount: string;
}

function amountToCents(value: unknown) {
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value)) {
    return null;
  }

  const [whole, decimal = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));

  return Number.isSafeInteger(cents) ? cents : null;
}

function centsToAmount(cents: number) {
  return (cents / 100).toFixed(2);
}

function equalSplits(memberIds: number[], totalCents: number) {
  const baseAmount = Math.floor(totalCents / memberIds.length);
  const remainder = totalCents % memberIds.length;

  return memberIds.map((userId, index) => ({
    userId,
    cents: baseAmount + (index < remainder ? 1 : 0),
  }));
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

    const payerEmail = session.user.email;
    const { id } = await params;
    const groupId = Number(id);

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return Response.json({ error: "Invalid group ID" }, { status: 400 });
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Invalid expense details" }, { status: 400 });
    }

    const description =
      "description" in body && typeof body.description === "string"
        ? body.description.trim()
        : "";
    const totalCents = "amount" in body ? amountToCents(body.amount) : null;
    const splitType =
      "splitType" in body && typeof body.splitType === "string"
        ? body.splitType
        : "";

    if (!description) {
      return Response.json({ error: "Description is required" }, { status: 400 });
    }

    if (description.length > 255) {
      return Response.json(
        { error: "Description must be less than 255 characters" },
        { status: 400 },
      );
    }

    if (totalCents === null || totalCents <= 0 || totalCents > 9_999_999_999) {
      return Response.json(
        { error: "Enter a valid positive amount with up to two decimal places" },
        { status: 400 },
      );
    }

    const [members] = await db.query<Member[]>(
      `
        SELECT users.id, users.email
        FROM group_members
        INNER JOIN users ON users.id = group_members.user_id
        WHERE group_members.group_id = ?
        ORDER BY users.id
      `,
      [groupId],
    );
    const payer = members.find((member) => member.email === payerEmail);

    if (!payer) {
      return Response.json(
        { error: "Only group members can add expenses" },
        { status: 403 },
      );
    }

    const memberIds = new Set(members.map((member) => member.id));
    let splits: { userId: number; cents: number }[];

    if (splitType === "equal") {
      splits = equalSplits([...memberIds], totalCents);
    } else if (splitType === "equal-except") {
      const excludedUserIds =
        "excludedUserIds" in body && Array.isArray(body.excludedUserIds)
          ? body.excludedUserIds
          : [];

      if (
        excludedUserIds.some(
          (userId) => !Number.isInteger(userId) || !memberIds.has(userId),
        )
      ) {
        return Response.json({ error: "Invalid excluded member" }, { status: 400 });
      }

      const includedIds = [...memberIds].filter(
        (userId) => !excludedUserIds.includes(userId),
      );

      if (includedIds.length === 0) {
        return Response.json(
          { error: "At least one member must share the expense" },
          { status: 400 },
        );
      }

      splits = equalSplits(includedIds, totalCents);
    } else if (splitType === "custom") {
      const customSplits =
        "customSplits" in body && Array.isArray(body.customSplits)
          ? (body.customSplits as CustomSplit[])
          : [];
      const seenUserIds = new Set<number>();

      splits = [];

      for (const split of customSplits) {
        const cents = amountToCents(split?.amount);

        if (
          !Number.isInteger(split?.userId) ||
          !memberIds.has(split.userId) ||
          seenUserIds.has(split.userId) ||
          cents === null ||
          cents < 0
        ) {
          return Response.json({ error: "Invalid custom split" }, { status: 400 });
        }

        seenUserIds.add(split.userId);

        if (cents > 0) {
          splits.push({ userId: split.userId, cents });
        }
      }

      if (
        splits.length === 0 ||
        splits.reduce((sum, split) => sum + split.cents, 0) !== totalCents
      ) {
        return Response.json(
          { error: "Custom split amounts must equal the total" },
          { status: 400 },
        );
      }
    } else {
      return Response.json({ error: "Invalid split type" }, { status: 400 });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [expense] = await connection.query<ResultSetHeader>(
        `
          INSERT INTO expenses (group_id, paid_by, description, amount)
          VALUES (?, ?, ?, ?)
        `,
        [groupId, payer.id, description, centsToAmount(totalCents)],
      );
      const placeholders = splits.map(() => "(?, ?, ?)").join(", ");
      const values = splits.flatMap((split) => [
        expense.insertId,
        split.userId,
        centsToAmount(split.cents),
      ]);

      await connection.query(
        `
          INSERT INTO expense_splits (expense_id, user_id, amount_owed)
          VALUES ${placeholders}
        `,
        values,
      );

      await connection.commit();

      return Response.json({ success: true, expenseId: expense.insertId }, { status: 201 });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
