import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import Avatar from "@/components/Avatar";
import PageShell, { BackLink } from "@/components/PageShell";
import { CalendarIcon, LogOutIcon, MailIcon, UserIcon } from "@/components/icons";
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

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell>
      <BackLink href="/dashboard">Back to dashboard</BackLink>

      {/* Identity card */}
      <section className="tk-card overflow-hidden bg-gradient-to-br from-accent-strong/12 via-surface to-surface">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-7 sm:p-8">
          <span className="w-fit rounded-full bg-accent-strong/20 p-1.5 ring-1 ring-accent/40">
            <Avatar name={user.name} seed={user.email} image={user.image} size={96} />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Your profile
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {user.name}
            </h1>
            <p className="mt-1 break-all text-muted sm:text-lg">{user.email}</p>
          </div>
        </div>

        <dl className="grid gap-5 border-t border-white/8 px-6 py-5 sm:grid-cols-3 sm:px-8 sm:py-6">
          {[
            { label: "Name", value: user.name, Icon: UserIcon },
            { label: "Email", value: user.email, Icon: MailIcon },
            { label: "Member since", value: memberSince, Icon: CalendarIcon },
          ].map(({ label, value, Icon }) => (
            <div className="flex items-center gap-3" key={label}>
              <Icon className="shrink-0 text-2xl text-accent" />
              <div className="min-w-0">
                <dt className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted">
                  {label}
                </dt>
                <dd className="mt-0.5 break-all font-medium text-ink">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Security */}
        <section className="tk-card p-6 sm:p-8">
          <PasswordSection hasPassword={Boolean(user.password_hash)} />
        </section>

        {/* Sign out */}
        <section className="tk-card p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-strong/20 text-xl text-accent">
              <LogOutIcon />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Sign out</h2>
              <p className="mt-1 text-sm text-muted">End your session on this device.</p>
            </div>
          </div>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
