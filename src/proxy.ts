export { auth as proxy } from "@/lib/auth/auth";

export const config = {
  matcher: [
    "/((?!api/auth|api/cron|login|register|manifest.webmanifest|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|js)$).*)",
  ],
};
