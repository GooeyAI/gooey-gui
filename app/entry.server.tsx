import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Integrations:
  //    e.g. new Sentry.Integrations.Prisma({ client: prisma })
  // Performance Monitoring:
  tracesSampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE ?? "0.1"),
});

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
