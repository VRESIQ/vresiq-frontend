import * as Sentry from "@sentry/react";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

export const sentryConfigured = import.meta.env.PROD && Boolean(sentryDsn);

if (sentryConfigured) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "production",
    beforeSend(event, hint) {
      const error = hint?.originalException;
      const errorMessage = error?.message || (typeof error === "string" ? error : "");
      if (
        errorMessage.includes("Unable to preload CSS") ||
        errorMessage.includes("Failed to fetch dynamically imported module") ||
        errorMessage.includes("preload")
      ) {
        console.warn("[Sentry] Filtered CSS/module preload chunk error:", errorMessage);
        return null;
      }
      return event;
    }
  });
} else if (import.meta.env.PROD) {
  console.warn("[Sentry] VITE_SENTRY_DSN is missing, monitoring is disabled.");
}

export { Sentry };
