import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CreateGroupButton from "./CreateGroupButton";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

async function Dashboard() {
  const session = await getServerSession(authOptions);
  console.log(session);

  if (!session) {
    redirect('/');
  }

  const [users]: any = await db.query("SELECT id FROM users WHERE email = ?", [
    session?.user?.email,
  ]);

  return (
    <div>
      <h1>Dashboard</h1>

      <p>Name: {session?.user?.name}</p>
      <p>Email: {session?.user?.email}</p>
      {session?.user?.image ? (
        <img src={session.user.image} alt="Profile" width={100} height={100} />
      ) : null}

      <CreateGroupButton />
      <br/>
      <Link href = {`/groups`}>All groups</Link>

      <br/>
      <Link href = {`/profile`}>Profile</Link>

    </div>
  );
}

export default Dashboard;
