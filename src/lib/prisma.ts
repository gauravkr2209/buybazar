import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  paisaPathPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.paisaPathPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.paisaPathPrisma = prisma;
}
