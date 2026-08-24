// Module augmentation for next-auth v5.
// NOTE: The `import` statement is REQUIRED. Without it, this file is treated as a
// global ambient module declaration, which REPLACES the real next-auth types
// (including the NextAuth() default export), causing "no call signatures" errors.
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
    tokenVersion?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    tokenVersion?: number;
    sub?: string;
  }
}
