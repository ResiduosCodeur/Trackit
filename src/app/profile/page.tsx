import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

import SignOutButton from "./SignOutButton";
import PasswordSection from "./Passwordsection";

interface UserProfile extends RowDataPacket {
  name: string;
  email: string;
  image: string | null;
  password_hash: string | null;
  created_at: Date;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const [users] = await db.query<UserProfile[]>(
    `
      SELECT name, email, image, password_hash, created_at
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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <Link
        className="flex w-fit items-center gap-1 text-sm text-black/60 transition hover:text-black dark:text-white/60 dark:hover:text-white"
        href="/dashboard"
      >
        ← Back to dashboard
      </Link>

      {/* Identity card */}
      <section className="overflow-hidden rounded-2xl border border-black/10 shadow-sm dark:border-white/15">
        <div className="bg-gradient-to-br from-black/5 to-black/0 px-8 pt-8 pb-6 dark:from-white/10 dark:to-white/0">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {user.image ? (
              <Image
                className="rounded-full ring-4 ring-white dark:ring-zinc-900"
                src={user.image}
                alt={`${user.name}'s profile picture`}
                width={96}
                height={96}
                unoptimized
                priority
              />
            ) : (
              <div
                className="flex size-24 items-center justify-center rounded-full bg-black text-3xl font-semibold text-white ring-4 ring-white dark:bg-white dark:text-black dark:ring-zinc-900"
                aria-hidden="true"
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
                Your profile
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
              <p className="mt-0.5 text-black/70 dark:text-white/70">{user.email}</p>
            </div>
          </div>
        </div>

        <dl className="grid gap-5 border-t border-black/10 px-8 py-6 dark:border-white/15 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
              Name
            </dt>
            <dd className="mt-1 font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
              Email
            </dt>
            <dd className="mt-1 break-all font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
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
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-black/10 p-8 shadow-sm dark:border-white/15">
        <PasswordSection hasPassword={Boolean(user.password_hash)} />
      </section>

      {/* Sign out */}
      <section className="flex items-center justify-between rounded-2xl border border-black/10 p-6 shadow-sm dark:border-white/15">
        <div>
          <h2 className="text-lg font-semibold">Sign out</h2>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            End your session on this device.
          </p>
        </div>
        <SignOutButton />
      </section>
    </main>
  );
}