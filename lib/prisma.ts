import { PrismaClient } from "@prisma/client";
import { validateEnv } from "./env";

validateEnv();

declare global {
  var prisma: PrismaClient | undefined;
}

// Postgres-only URL defaults. Values the operator set explicitly are left
// untouched. Two problems this solves:
// 1. Fail-fast: when DATABASE_URL points at an unreachable host, Prisma waits
//    minutes before failing, stalling `next build` and prerendered pages
//    (`/`, `/library`). Pages already catch query errors and render fallbacks —
//    this just makes the failure arrive in seconds instead of minutes.
// 2. Connection-pool ceiling: Prisma defaults connection_limit to
//    (cpu count × 2 + 1). On a typical 8-core machine that is 17 connections
//    from a single client — already over the 15-client cap of Supabase's
//    session-mode pooler, which fails with EMAXCONNSESSION. 5 keeps one app
//    instance comfortably inside the pool; serverless deployments should set
//    connection_limit=1 explicitly.
function applyPostgresUrlDefaults(url: string | undefined): string | undefined {
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) return url;
  let next = url;
  const append = (params: string) => {
    const separator = next.includes("?") ? "&" : "?";
    next = `${next}${separator}${params}`;
  };
  if (!/connect_timeout/i.test(next)) {
    append("connect_timeout=5&pool_timeout=10&socket_timeout=10");
  }
  if (!/connection_limit/i.test(next)) {
    append("connection_limit=5");
  }
  return next;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
    datasourceUrl: applyPostgresUrlDefaults(process.env.DATABASE_URL),
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
