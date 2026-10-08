import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgrespassword@localhost:5434/financetracker?schema=public";

export const db =
  globalThis.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
