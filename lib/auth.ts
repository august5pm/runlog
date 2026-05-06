import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: googleId ?? "",
      clientSecret: googleSecret ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.sub = user.id;
        const u = user as {
          nickname?: string | null;
          profileEmoji?: string | null;
          name?: string | null;
          email?: string | null;
          image?: string | null;
        };
        token.nickname = u.nickname ?? null;
        token.profileEmoji = u.profileEmoji ?? null;
        token.name = u.name ?? null;
        token.email = u.email ?? null;
        token.picture = u.image ?? null;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as Record<string, unknown>;
        if (s.nickname !== undefined) {
          token.nickname = (s.nickname as string | null) || null;
        }
        if (s.profileEmoji !== undefined) {
          token.profileEmoji = (s.profileEmoji as string | null) || null;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (!session.user || !token.sub) {
        return session;
      }
      session.user.id = token.sub;
      session.user.nickname = token.nickname ?? null;
      session.user.profileEmoji = token.profileEmoji ?? null;
      session.user.name = token.name ?? undefined;
      session.user.email = token.email ?? undefined;
      session.user.image = token.picture ?? undefined;
      return session;
    },
  },
};

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(googleId && googleSecret);
}
