import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * PATCH /api/account/profile
 * Body: { name: string }
 *
 * Changes the signed-in user's display name.
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const name =
      typeof body === "object" &&
      body !== null &&
      "name" in body &&
      typeof body.name === "string"
        ? body.name.trim().replace(/\s+/g, " ")
        : "";

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    if (name.length > 255) {
      return Response.json(
        { error: "Name must be less than 255 characters" },
        { status: 400 },
      );
    }

    await db.query("UPDATE users SET name = ? WHERE email = ?", [name, session.user.email]);

    return Response.json({ success: true, name });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
