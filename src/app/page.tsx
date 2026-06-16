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
    <main className="min-h-screen bg-[#f6f8f4] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="flex flex-col gap-8">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase text-emerald-700">
              Shared expenses, settled clearly
            </p>
            <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] text-slate-950 sm:text-6xl">
              Trackit keeps every group expense easy to follow.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Split costs, choose who paid, add members, and keep the whole story in one
              place without spreadsheet fog.
            </p>
          </div>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Trips", "Roommates", "Dinners"].map((label) => (
              <div
                className="rounded-lg border border-slate-200 bg-white/75 p-4 shadow-sm"
                key={label}
              >
                <p className="text-sm font-semibold text-slate-950">{label}</p>
                <p className="mt-1 text-sm text-slate-500">Balances stay visible.</p>
              </div>
            ))}
          </div>
        </section>

        <AuthForm />
      </div>
    </main>
  );
}
