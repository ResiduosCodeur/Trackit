import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import CreateGroupButton from "./CreateGroupButton";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#141812]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
        {/* Identity row */}
        <header className="flex items-center gap-4">
          {session.user?.image ? (
            <Image
              className="rounded-full ring-2 ring-[#EDEFE8]/10"
              src={session.user.image}
              alt="Profile"
              width={56}
              height={56}
              unoptimized
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-[#3FA873] font-serif text-xl font-semibold text-[#141812]">
              {session.user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[#3FA873]">Welcome back</p>
            <h1 className="font-serif text-2xl font-semibold text-[#EDEFE8]">
              {session.user?.name}
            </h1>
          </div>
        </header>

        {/* Create group */}
        <section className="rounded-2xl border border-[#EDEFE8]/10 bg-[#1C211A] p-6">
          <CreateGroupButton />
        </section>

        {/* Quick links */}
        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/groups"
            className="group relative overflow-hidden rounded-xl border border-[#EDEFE8]/10 bg-[#1C211A] p-5 transition-colors hover:border-[#3FA873]/40"
          >
            <span className="absolute inset-y-0 left-0 w-[3px] bg-[#3FA873]/0 transition-colors group-hover:bg-[#3FA873]" />
            <p className="font-serif text-lg font-semibold text-[#EDEFE8]">
              All groups
            </p>
            <p className="mt-1 text-sm text-[#EDEFE8]/50">
              See every group you&apos;re part of.
            </p>
          </Link>

          <Link
            href="/profile"
            className="group relative overflow-hidden rounded-xl border border-[#EDEFE8]/10 bg-[#1C211A] p-5 transition-colors hover:border-[#3FA873]/40"
          >
            <span className="absolute inset-y-0 left-0 w-[3px] bg-[#3FA873]/0 transition-colors group-hover:bg-[#3FA873]" />
            <p className="font-serif text-lg font-semibold text-[#EDEFE8]">
              Profile
            </p>
            <p className="mt-1 text-sm text-[#EDEFE8]/50">
              Manage your account and password.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}