import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get the current session on the server side.
 * Use this in Server Components and Server Actions.
 */
export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Require authentication. Throws if not authenticated.
 * Use in Server Actions that need a user.
 */
export async function requireAuth(): Promise<Session & { user: { id: string; email: string } }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session as Session & { user: { id: string; email: string } };
}
