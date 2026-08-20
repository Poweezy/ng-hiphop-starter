import { PrismaClient } from "@prisma/client";
import { validateEnv } from "./env";

validateEnv();

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
