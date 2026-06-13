import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {

  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <>
    <div>
      <h1><strong>hello and welcome to trackit</strong></h1>
      <Link href={`/api/auth/signin`}> Click here to login</Link>
    </div>
    </>
  );
}
