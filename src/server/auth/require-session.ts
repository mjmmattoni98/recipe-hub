import "server-only";

import { getServerSession } from "@/server/auth/session";
import { redirect } from "next/navigation";

export async function requireServerSession(redirectTo?: string) {
  const session = await getServerSession();

  if (!session?.user) {
    const callback = redirectTo
      ? `?redirect=${encodeURIComponent(redirectTo)}`
      : "";
    redirect(`/sign-in${callback}`);
  }

  return session;
}
