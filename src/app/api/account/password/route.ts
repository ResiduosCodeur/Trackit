import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface UserRow extends RowDataPacket {
  id: number;
  password_hash: string | null;
}

function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 255;
}

/**
 * POST /api/account/password
 *
 * Body:
 *  - If the user already has a password: { currentPassword: string; newPassword: string }
 *  - If the user signed up via Google (no password yet): { newPassword: string }
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

    const newPassword =
      "newPassword" in body && typeof body.newPassword === "string"
        ? body.newPassword
        : "";
    const currentPassword =
      "currentPassword" in body && typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";

    if (!isValidPassword(newPassword)) {
      return Response.json(
        { error: "Password must be between 8 and 255 characters" },
        { status: 400 },
      );
    }

    const [[user]] = await db.query<UserRow[]>(
      "SELECT id, password_hash FROM users WHERE email = ? LIMIT 1",
      [session.user.email],
    );

    if (!user) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    // If the user already has a password set, they must verify it first
    if (user.password_hash) {
      if (!currentPassword) {
        return Response.json(
          { error: "Enter your current password" },
          { status: 400 },
        );
      }

      const matches = await bcrypt.compare(currentPassword, user.password_hash);

      if (!matches) {
        return Response.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      if (currentPassword === newPassword) {
        return Response.json(
          { error: "New password must be different from the current password" },
          { status: 400 },
        );
      }
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await db.query<ResultSetHeader>(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [newHash, user.id],
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}