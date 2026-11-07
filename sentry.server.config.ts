import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV === "production",
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  maxBreadcrumbs: 25,
  beforeSend(event) {
    // Do not send user identity, cookies, headers, request bodies, or query strings.
    delete event.user;

    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.data;

      if (typeof event.request.url === "string") {
        try {
          const url = new URL(event.request.url);
          url.search = "";
          url.hash = "";
          event.request.url = url.toString();
        } catch {
          event.request.url = event.request.url.split("?")[0];
        }
      }
    }

    return event;
  },
});
