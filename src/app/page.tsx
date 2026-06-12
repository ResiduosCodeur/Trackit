import Image from "next/image";
import Link from "next/link"

export default function Home() {
  return (
    <>
    <div>
      <h1><strong>hello and welcome to trackit</strong></h1>
      <Link href={`/api/auth/signin`}> Click here to login</Link>
    </div>
    </>
  );
}
