import "server-only";

import { getSessionFromHeaders } from "@/server/auth/get-session";
import { headers } from "next/headers";
import { cache } from "react";

export const getServerSession = cache(async () => {
  return getSessionFromHeaders(await headers());
});
