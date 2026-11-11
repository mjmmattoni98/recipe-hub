import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { type NextRequest } from "next/server";

import { env } from "@/env";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

export const maxDuration = 60;

/**
 * Development logs every failure on one short line. Production logs only
 * unexpected ones (HTTP 5xx), in full: UNAUTHORIZED, NOT_FOUND, BAD_REQUEST and
 * the like are normal outcomes. The procedure input is never logged: it is user
 * content.
 */
const logTRPCError: NonNullable<
  Parameters<typeof fetchRequestHandler>[0]["onError"]
> = ({ path, type, error }) => {
  const where = `${type} ${path ?? "<no-path>"}`;

  if (env.NODE_ENV === "development") {
    console.error(`❌ tRPC failed on ${where}: ${error.message}`);
  } else if (getHTTPStatusCodeFromError(error) >= 500) {
    // Passing the error itself keeps its stack and `cause` in the output.
    console.error(`[tRPC] ${error.code} on ${where}`, error);
  }
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: logTRPCError,
  });

export { handler as GET, handler as POST };
