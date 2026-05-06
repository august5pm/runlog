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
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (!session.user || !token.sub) {
        return session;
      }
      session.user.id = token.sub;
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          nickname: true,
          profileEmoji: true,
          name: true,
          email: true,
          image: true,
        },
      });
      if (dbUser) {
        session.user.nickname = dbUser.nickname;
        session.user.profileEmoji = dbUser.profileEmoji;
        session.user.name = dbUser.name;
        session.user.email = dbUser.email;
        session.user.image = dbUser.image;
      }
      return session;
    },
  },
};

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(googleId && googleSecret);
}
