import { auth } from "@/lib/auth/auth";

/** Throws if there's no authenticated session — use at the top of any
 * server action or server component that requires a logged-in user. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("No autenticado.");
  }
  return session.user.id;
}
