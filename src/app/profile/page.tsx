import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

import SignOutButton from "./SignOutButton";

interface UserProfile extends RowDataPacket {
  name: string;
  email: string;
  image: string | null;
  created_at: Date;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const [users] = await db.query<UserProfile[]>(
    `
      SELECT name, email, image, created_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [session.user.email],
  );

  const user = users[0];

  if (!user) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <Link className="w-fit text-sm underline" href="/dashboard">
        Back to dashboard
      </Link>

      <section className="rounded-2xl border border-black/10 p-8 shadow-sm dark:border-white/15">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {user.image ? (
            <Image
              className="rounded-full"
              src={user.image}
              alt={`${user.name}'s profile picture`}
              width={112}
              height={112}
              unoptimized
              priority
            />
          ) : (
            <div
              className="flex size-28 items-center justify-center rounded-full bg-black text-4xl font-semibold text-white dark:bg-white dark:text-black"
              aria-hidden="true"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <p className="text-sm text-black/60 dark:text-white/60">
              Your profile
            </p>
            <h1 className="text-3xl font-semibold">{user.name}</h1>
            <p className="mt-1 text-black/70 dark:text-white/70">
              {user.email}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid gap-5 border-t border-black/10 pt-6 dark:border-white/15 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-black/60 dark:text-white/60">Name</dt>
            <dd className="mt-1 font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-black/60 dark:text-white/60">Email</dt>
            <dd className="mt-1 break-all font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-black/60 dark:text-white/60">
              Member since
            </dt>
            <dd className="mt-1 font-medium">
              {new Date(user.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-black/10 pt-6 dark:border-white/15">
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
