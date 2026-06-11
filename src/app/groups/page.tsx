import React from 'react'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/lib/db";

async function groups() {

    const session = await getServerSession(authOptions);
  console.log(session);

  const [users]: any = await db.query("SELECT id FROM users WHERE email = ?", [
    session?.user?.email,
  ]);

  const userId = users[0].id;

  const [groups]: any = await db.query(
    `
    SELECT *
    FROM user_groups
    WHERE created_by = ?
    `,
    [userId],
  );

  return (
    <div>
       <h2>Your Groups</h2>

      <ul>
        {groups.map((group: any) => (
          <li key={group.id}>
            <Link href={`/groups/${group.id}`}>{group.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default groups
