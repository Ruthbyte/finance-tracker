import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaUrl: string | undefined;
}

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgrespassword@localhost:5434/financetracker?schema=public";

const currentDatabaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

export const db =
  globalThis.prisma && globalThis.prismaUrl === currentDatabaseUrl
    ? globalThis.prisma
    : new PrismaClient({
        datasources: {
          db: {
            url: currentDatabaseUrl,
          },
        },
      });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
  globalThis.prismaUrl = currentDatabaseUrl;
}
