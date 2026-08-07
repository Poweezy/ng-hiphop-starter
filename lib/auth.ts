import NextAuth from "next-auth";
import type { User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/db";
import { checkRateLimit } from "@/lib/ratelimit";

if (process.env.NODE_ENV === "production") {
  const missing: string[] = [];
  if (!process.env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET");
  if (!process.env.NEXTAUTH_URL) missing.push("NEXTAUTH_URL");
  if (missing.length > 0) {
    throw new Error(`Missing required NextAuth environment variables: ${missing.join(", ")}`);
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Partial<Record<"email" | "password", unknown>> | undefined,
        req: Request,
      ) {
        if (
          process.env.NODE_ENV === "production" &&
          !process.env.NEXTAUTH_SECRET
        ) {
          throw new Error("NEXTAUTH_SECRET must be set in production");
        }
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const xff = req.headers.get("x-forwarded-for");
        const xffFirst = xff?.split(",")[0]?.trim();
        const ip =
          req.headers.get("x-real-ip")?.trim() || xffFirst || "unknown";

        const { allowed } = await checkRateLimit({
          key: `login:${ip}:${email}`,
          max: 5,
          periodSeconds: 900,
        });
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;
        if (user.role !== "ADMIN") return null;

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion;
      } else if (token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { tokenVersion: true, role: true },
          });
          if (!dbUser) {
            token.sub = undefined;
          } else if (dbUser.tokenVersion !== token.tokenVersion) {
            token.sub = undefined;
          } else {
            token.role = dbUser.role;
          }
        } catch (err) {
          console.error("JWT callback DB error", err);
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
