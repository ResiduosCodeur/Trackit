import { AuthOptions } from "next-auth";
import type { RowDataPacket } from "mysql2";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";
import { verifyPassword } from "./password";

interface UserAccount extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  image: string | null;
  password_hash: string | null;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const [users] = await db.query<UserAccount[]>(
          "SELECT id, name, email, image, password_hash FROM users WHERE email = ? LIMIT 1",
          [email],
        );
        const user = users[0];

        if (!user?.password_hash) {
          return null;
        }

        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const [rows] = await db.query<UserAccount[]>(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
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
