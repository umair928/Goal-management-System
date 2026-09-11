import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Dev-only "sign in as a seeded demo account" provider, mirroring the
// prototype's demo account switcher. Never registered in production —
// real deployments authenticate exclusively through Google.
const devProviders =
  process.env.NODE_ENV === "production"
    ? []
    : [
        Credentials({
          id: "dev-account",
          name: "Demo account",
          credentials: { email: { label: "Email", type: "text" } },
          async authorize(creds) {
            const email = (creds?.email as string | undefined)?.toLowerCase().trim();
            if (!email) return null;
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return null;
            return { id: user.id, email: user.email, name: user.name, image: user.image };
          },
        }),
      ];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    ...devProviders,
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role | undefined) ?? "EMPLOYEE";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      }
    },
  },
});
