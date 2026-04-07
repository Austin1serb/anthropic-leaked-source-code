import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      `DATABASE_URL is not set. Available env keys: ${Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("NEON") || k.includes("POSTGRES")).join(", ") || "none matching"}`
    );
  }
  const sql = neon(dbUrl);
  const adapter = new PrismaNeon(sql as unknown as ConstructorParameters<typeof PrismaNeon>[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
