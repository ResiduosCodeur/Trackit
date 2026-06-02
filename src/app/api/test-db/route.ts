import { db } from "@/lib/db";

export async function GET() {
  const [rows] = await db.query("SELECT 1 AS result");

  return Response.json(rows);
}