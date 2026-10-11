import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "./auth";
import { db } from "./db";

interface UserRow extends RowDataPacket {
  name: string;
  email: string;
  image: string | null;
}

/**
 * The signed-in user as stored in the database. The session token keeps the
 * name from sign-in time, so anything that shows the name reads it from here
 * to pick up a rename straight away.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  const [users] = await db.query<UserRow[]>(
    "SELECT name, email, image FROM users WHERE email = ? LIMIT 1",
    [session.user.email],
  );

  return users[0] ?? null;
}
