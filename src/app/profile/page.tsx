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
    <main className="min-h-screen bg-[#141812]">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <Link
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-[#EDEFE8]/50 transition-colors hover:text-[#EDEFE8]"
          href="/dashboard"
        >
          ← Back to dashboard
        </Link>

        {/* Identity card */}
        <section className="overflow-hidden rounded-2xl border border-[#EDEFE8]/10 bg-[#1C211A]">
          <div className="bg-gradient-to-br from-[#3FA873]/10 to-transparent px-8 pt-8 pb-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {user.image ? (
                <Image
                  className="rounded-full ring-4 ring-[#1C211A]"
                  src={user.image}
                  alt={`${user.name}'s profile picture`}
                  width={96}
                  height={96}
                  unoptimized
                  priority
                />
              ) : (
                <div
                  className="flex size-24 items-center justify-center rounded-full bg-[#3FA873] font-serif text-3xl font-semibold text-[#141812] ring-4 ring-[#1C211A]"
                  aria-hidden="true"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-[#EDEFE8]/45">
                  Your profile
                </p>
                <h1 className="font-serif text-2xl font-semibold text-[#EDEFE8] sm:text-3xl">
                  {user.name}
                </h1>
                <p className="mt-0.5 text-[#EDEFE8]/65">{user.email}</p>
              </div>
            </div>
          </div>

          <dl className="grid gap-5 border-t border-[#EDEFE8]/10 px-8 py-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#EDEFE8]/45">
                Name
              </dt>
              <dd className="mt-1 font-medium text-[#EDEFE8]">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#EDEFE8]/45">
                Email
              </dt>
              <dd className="mt-1 break-all font-medium text-[#EDEFE8]">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#EDEFE8]/45">
                Member since
              </dt>
              <dd className="mt-1 font-medium text-[#EDEFE8]">
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
        <section className="rounded-2xl border border-[#EDEFE8]/10 bg-[#1C211A] p-8">
          <PasswordSection hasPassword={Boolean(user.password_hash)} />
        </section>

        {/* Sign out */}
        <section className="flex items-center justify-between rounded-2xl border border-[#EDEFE8]/10 bg-[#1C211A] p-6">
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#EDEFE8]">Sign out</h2>
            <p className="mt-1 text-sm text-[#EDEFE8]/50">
              End your session on this device.
            </p>
          </div>
          <SignOutButton />
        </section>
      </div>
    </main>
  );
}