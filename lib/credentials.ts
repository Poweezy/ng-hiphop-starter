import bcrypt from "bcryptjs";
import type { User } from "next-auth";
import { prisma } from "@/app/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/ip";

// Credential verification logic, extracted from the NextAuth provider so it
// can be unit-tested without booting the NextAuth runtime. Dependencies are
// injectable; when omitted, the real Prisma/rate-limit implementations are used.
export async function verifyAdminCredentials(
  credentials: Partial<Record<'email' | 'password', unknown>> | undefined,
  req: Request,
  deps: {
    findUser: (email: string) => Promise<{
      id: string;
      email: string;
      role: string;
      password_hash: string;
      tokenVersion: number;
    } | null>;
    checkLimit: (opts: { key: string; max: number; periodSeconds: number }) => Promise<{ allowed: boolean }>;
    clientIp: string;
  } = {
    findUser: (email) => prisma.user.findUnique({ where: { email } }),
    checkLimit: (opts) => checkRateLimit(opts),
    clientIp: '',
  },
): Promise<User | null> {
  if (!credentials?.email || !credentials?.password) {
    console.error('[auth] login denied: missing credentials fields');
    return null;
  }

  const email = String(credentials.email).toLowerCase().trim();
  const password = String(credentials.password);

  const ip = deps.clientIp || getClientIp(req);

  const { allowed } = await deps.checkLimit({
    key: `login:${ip}:${email}`,
    max: 5,
    periodSeconds: 900,
  });
  if (!allowed) {
    // Production function logs should show this line directly before the
    // generic CredentialsSignin error — the most common cause of a bare
    // CredentialsSignin is fail-closed rate limiting when Upstash env vars
    // are missing on the deployment host.
    console.error('[auth] login denied: rate limit exceeded', { email, ip });
    return null;
  }

  const user = await deps.findUser(email);

  if (!user) {
    console.error('[auth] login failed: no user row for email', { email });
    return null;
  }
  if (user.role !== "ADMIN") {
    console.error('[auth] login failed: non-admin role', { email, role: user.role });
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    console.error('[auth] login failed: invalid password', { email });
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  } as User;
}