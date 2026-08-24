import { PrismaClient } from "@prisma/client";
import { validateEnv } from "./env";

validateEnv();

declare global {
  var prisma: PrismaClient | undefined;
}

// Builds prerender DB-backed pages (`/`, `/library`). When DATABASE_URL points
// at an unreachable host, Prisma waits minutes before failing, stalling
// `next build`. Pages already catch query errors and render fallbacks — this
// just makes the failure arrive in seconds instead of minutes. Values the
// operator set explicitly are left untouched.
function withFailFastTimeouts(url: string | undefined): string | undefined {
  if (!url || /connect_timeout/i.test(url)) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connect_timeout=5&pool_timeout=10&socket_timeout=10`;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
    datasourceUrl: withFailFastTimeouts(process.env.DATABASE_URL),
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
