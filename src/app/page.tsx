import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/AppHeader";
import { HomeIcon, PlaneIcon, UtensilsIcon } from "@/components/icons";
import AuthForm from "./AuthForm";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_420px]">
        <section className="flex flex-col gap-10">
          <div>
            <Logo className="mb-8" />

            <p className="tk-eyebrow mb-4">
              <span className="h-px w-6 bg-accent" />
              Shared expenses, settled clearly
            </p>

            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Every shared cost,
              <br />
              <span className="text-accent">kept in one ledger.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-7 text-muted">
              Split bills, log who paid, and watch balances settle in real
              time — no spreadsheets, no guesswork, no awkward reminders.
            </p>
          </div>

          <dl className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              { label: "Trips", note: "One pot, no math at the gate", Icon: PlaneIcon },
              { label: "Roommates", note: "Rent and bills, split evenly", Icon: HomeIcon },
              { label: "Dinners", note: "Even the one who skipped dessert", Icon: UtensilsIcon },
            ].map(({ label, note, Icon }) => (
              <div
                className="tk-card p-4 transition-colors hover:border-accent/40"
                key={label}
              >
                <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-accent-strong/20 text-base text-accent">
                  <Icon />
                </span>
                <dt className="text-base font-semibold text-ink">{label}</dt>
                <dd className="mt-1 text-sm leading-snug text-muted">{note}</dd>
              </div>
            ))}
          </dl>
        </section>

        <AuthForm />
      </div>
    </main>
  );
}
