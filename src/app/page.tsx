import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AuthForm from "./AuthForm";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#141812] text-[#EDEFE8]">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-[1fr_420px] lg:px-8">
        <section className="flex flex-col gap-10">
          <div>
            <div className="mb-6 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-[#3FA873] font-serif text-base font-bold text-[#141812]">
                T
              </span>
              <span className="font-serif text-lg font-semibold tracking-tight">
                Trackit
              </span>
            </div>

            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-[#3FA873]">
              <span className="h-px w-6 bg-[#3FA873]" />
              Shared expenses, settled clearly
            </p>

            <h1 className="max-w-2xl font-serif text-5xl font-semibold leading-[1.08] tracking-tight text-[#EDEFE8] sm:text-6xl">
              Every shared cost,
              <br />
              kept in one ledger.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-7 text-[#EDEFE8]/65">
              Split bills, log who paid, and watch balances settle in real
              time — no spreadsheets, no guesswork, no awkward reminders.
            </p>
          </div>

          <dl className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              { label: "Trips", note: "One pot, no math at the gate" },
              { label: "Roommates", note: "Rent and bills, split evenly" },
              { label: "Dinners", note: "Even the one who skipped dessert" },
            ].map((item) => (
              <div
                className="group relative overflow-hidden rounded-lg border border-[#EDEFE8]/10 bg-[#1C211A]/70 p-4 transition-colors hover:border-[#3FA873]/40"
                key={item.label}
              >
                <span className="absolute inset-y-0 left-0 w-[3px] bg-[#3FA873]/0 transition-colors group-hover:bg-[#3FA873]" />
                <dt className="font-serif text-base font-semibold text-[#EDEFE8]">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm leading-snug text-[#EDEFE8]/50">
                  {item.note}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <AuthForm />
      </div>
    </main>
  );
}