import { type Instrumentation } from "next";

/**
 * Server-side error logging for uncaught Next.js request errors.
 * Do not log request headers, cookies, bodies, or query strings.
 * Output is written to the Vercel server runtime logs, never to the response.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  const requestPath = request.path.split("?")[0].slice(0, 512) || "/";
  const message =
    typeof error.message === "string" ? error.message.slice(0, 2000) : "Unknown error";
  const stack =
    typeof error.stack === "string" ? error.stack.slice(0, 12000) : undefined;

  console.error("[bitaqati-server-error]", {
    digest: typeof error.digest === "string" ? error.digest : undefined,
    name: typeof error.name === "string" ? error.name.slice(0, 128) : "Error",
    message,
    stack,
    method: request.method.slice(0, 16),
    path: requestPath,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
