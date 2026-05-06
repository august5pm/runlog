import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma(): PrismaClient {
  return new PrismaClient();
}

/** 옛 싱글톤(스키마 추가 전)은 .challenge 등이 없음 */
function isStalePrismaClient(client: PrismaClient | undefined): boolean {
  return (
    !client ||
    typeof (client as unknown as { challenge?: { upsert: unknown } }).challenge
      ?.upsert !== "function"
  );
}

let devCached: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrisma();
    }
    return globalForPrisma.prisma;
  }

  if (isStalePrismaClient(devCached)) {
    void devCached?.$disconnect().catch(() => {});
    devCached = undefined;
  }
  if (!devCached) {
    devCached = createPrisma();
  }
  return devCached;
}

/**
 * 개발 모드에서 `prisma generate` 직후에도 옛 global 싱글톤이 남으면
 * `prisma.challenge` 가 undefined가 됩니다. Proxy로 매번 최신 클라이언트를 씁니다.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client as object, prop, client);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
