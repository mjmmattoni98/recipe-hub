import "server-only";

import { auth } from "@/lib/auth";

export function getSessionFromHeaders(requestHeaders: Headers) {
  return auth.api.getSession({
    headers: requestHeaders,
  });
}
