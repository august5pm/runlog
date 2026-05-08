import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

/** 옛 싱글톤(스키마 추가 전)은 .challenge 등이 없음 */
function isStalePrismaClient(client: PrismaClient | undefined): boolean {
  return (
    !client ||
    typeof (client as unknown as { challenge?: { upsert: unknown } }).challenge
      ?.upsert !== "function"
  );
}

/**
 * dev·prod 모두 `globalThis` 싱글톤 — Next.js dev(HMR·라우트 컴파일)에서 모듈이 여러 번 평가돼도
 * PrismaClient가 중복 생성·연결을 잡아먹지 않도록 함 (원격 DB max connections 초과 방지).
 */
function getPrismaClient(): PrismaClient {
  if (isStalePrismaClient(globalForPrisma.prisma)) {
    const stale = globalForPrisma.prisma;
    globalForPrisma.prisma = undefined;
    void stale?.$disconnect().catch(() => {});
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrisma();
  }

  return globalForPrisma.prisma;
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
