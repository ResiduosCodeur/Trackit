import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

interface ExistingUser extends RowDataPacket {
  id: number;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Invalid signup details" }, { status: 400 });
    }

    const name = "name" in body ? cleanString(body.name) : "";
    const email = "email" in body ? cleanString(body.email).toLowerCase() : "";
    const password = "password" in body ? cleanString(body.password) : "";

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const [existingUsers] = await db.query<ExistingUser[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    if (existingUsers.length > 0) {
      return Response.json(
        { error: "An account already exists. Sign in instead." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash],
    );

    return Response.json({ success: true, userId: result.insertId }, { status: 201 });
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
