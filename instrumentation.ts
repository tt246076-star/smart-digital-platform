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
  const normalizedError =
    error instanceof Error ? error : new Error("Unknown request error");
  const errorDigest =
    typeof error === "object" && error !== null && "digest" in error
      ? error.digest
      : undefined;
  const requestPath = request.path.split("?")[0].slice(0, 512) || "/";
  const message = normalizedError.message.slice(0, 2000);
  const stack =
    typeof normalizedError.stack === "string"
      ? normalizedError.stack.slice(0, 12000)
      : undefined;

  console.error("[bitaqati-server-error]", {
    digest: typeof errorDigest === "string" ? errorDigest : undefined,
    name: normalizedError.name.slice(0, 128),
    message,
    stack,
    method: request.method.slice(0, 16),
    path: requestPath,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
