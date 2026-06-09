import * as Sentry from "@sentry/react";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

export const sentryConfigured = import.meta.env.PROD && Boolean(sentryDsn);

if (sentryConfigured) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "production",
  });
} else if (import.meta.env.PROD) {
  console.warn("[Sentry] VITE_SENTRY_DSN is missing, monitoring is disabled.");
}

export { Sentry };
