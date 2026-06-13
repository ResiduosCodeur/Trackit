import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface UserId extends RowDataPacket {
  id: number;
}

interface GroupRecord extends RowDataPacket {
  id: number;
  name: string;
  created_by: number;
  created_at: Date;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body: unknown = await req.json();
    const name =
      typeof body === "object" &&
      body !== null &&
      "name" in body &&
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 },
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: "Group name must be less than 255 characters" },
        { status: 400 },
      );
    }

    const [users] = await db.query<UserId[]>(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email],
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query<ResultSetHeader>(
        `
          INSERT INTO user_groups (name, created_by)
          VALUES (?, ?)
        `,
        [name, userId],
      );

      await connection.query(
        `
          INSERT INTO group_members (group_id, user_id)
          VALUES (?, ?)
        `,
        [result.insertId, userId],
      );

      await connection.commit();

      return NextResponse.json(
        {
          success: true,
          groupId: result.insertId,
        },
        { status: 201 },
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const [users] = await db.query<UserId[]>(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email],
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;

    const [groups] = await db.query<GroupRecord[]>(
      `SELECT * FROM user_groups WHERE created_by = ? ORDER BY created_at DESC`,
      [userId],
    );

    return NextResponse.json(groups);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
