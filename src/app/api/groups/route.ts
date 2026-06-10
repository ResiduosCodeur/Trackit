import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";

import {authOptions} from "@/lib/auth";
import {db} from "@/lib/db";

export async function POST(req:NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                {error:"Unauthorised"},
                {status: 401}
            );
        }

        const {name} = await req.json();

        if (!name) {
            return NextResponse.json(
                {error: "Group name is required"},
                {status: 400}
            );
            
        }

        const [users]: any = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [session.user.email]
        )

        if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = users[0].id;

     const [result]: any = await db.query(
      `
      INSERT INTO user_groups (name, created_by)
      VALUES (?, ?)
      `,
      [name, userId]
    );

    return NextResponse.json({
      success: true,
      groupId: result.insertId,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );

    }
}