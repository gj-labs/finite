import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Comma-separated Google emails allowed in. Empty = nobody, so a missing setting never opens the app.
const allowed = () =>
  (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    signIn({ profile }) {
      const email = (profile?.email || "").toLowerCase();
      const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
      return Boolean(email && verified && allowed().includes(email));
    },
  },
};
