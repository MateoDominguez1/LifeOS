import type { NextAuthConfig } from "next-auth";

// Edge-safe base config — no Prisma import here, so this can run in the
// proxy/middleware runtime. Matches the split used in all three source apps.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isPublic =
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/register";

      if (isPublic) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // populated in auth.ts, which has access to Prisma
} satisfies NextAuthConfig;
