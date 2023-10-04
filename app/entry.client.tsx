import { useLocation, useMatches, RemixBrowser } from "@remix-run/react";
import { hydrate } from "react-dom";
import * as Sentry from "@sentry/remix";
import { useEffect } from "react";

Sentry.init({
  dsn: window.ENV.SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing({
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      // tracePropagationTargets: ["localhost", /^https:\/\/gooey\.ai\/.*/],
      routingInstrumentation: Sentry.remixRouterInstrumentation(
        useEffect,
        useLocation,
        useMatches,
      ),
    }),
    new Sentry.Replay(),
  ],
  // Performance Monitoring
  tracesSampleRate: parseFloat(window.ENV.SENTRY_SAMPLE_RATE ?? "0.1"), // Capture X% of the transactions, reduce in production!
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

hydrate(<RemixBrowser />, document);
