import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/db';
import { checkRateLimit } from '@/lib/ratelimit';

// Fail fast in production if the session signing secret is missing. Without it
// NextAuth falls back to an insecure/undefined secret and sessions are unsafe.
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in production');
}

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) return null;

                // Throttle brute-force attempts per IP + email before any DB hit.
                const headers = (req as { headers?: Record<string, string | string[] | undefined> } | undefined)?.headers;
                const xffRaw = headers?.['x-forwarded-for'];
                const xff = Array.isArray(xffRaw) ? xffRaw[0] : (xffRaw as string | undefined);
                const ip = (headers?.['x-real-ip'] as string | undefined) || xff?.split(',')[0]?.trim() || 'unknown';

                const { allowed } = await checkRateLimit({
                    key: `login:${ip}:${String(credentials.email).toLowerCase()}`,
                    max: 5,
                    periodSeconds: 900,
                });
                if (!allowed) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email.toLowerCase().trim() },
                });

                if (!user) return null;
                if (user.role !== 'ADMIN') return null;

                const isValid = await bcrypt.compare(credentials.password, user.password_hash);
                if (!isValid) return null;

                return { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
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
                } catch {
                    // If DB check fails, keep existing token to avoid
                    // breaking sessions during transient issues. The short
                    // 8h expiry limits exposure.
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) session.user.role = token.role;
            return session;
        },
    },
    pages: {
        signIn: '/admin/login',
        error: '/admin/login',
    },
    session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
    secret: process.env.NEXTAUTH_SECRET,
    cookies: {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
    },
};

export default authOptions;
