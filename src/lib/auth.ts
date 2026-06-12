import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      const [rows]: any = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [user.email],
      );

      if (rows.length === 0) {
        console.log("Creating user:", user.email);

        await db.query(
          `
                    INSERT INTO users (name, email, image) VALUES (?, ?, ?)
                    `,
          [user.name, user.email, user.image],
        );
      }

      return true;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
