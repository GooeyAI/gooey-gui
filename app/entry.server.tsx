import type { DataFunctionArgs, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { renderToString } from "react-dom/server";
import { gooeyGuiRouteHeader } from "~/consts";

export function handleError(error: unknown, { request }: DataFunctionArgs) {
  // // ignore aborted requests
  if (request.signal.aborted) return;

  Sentry.captureRemixServerException(error, "remix.server", request);
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Integrations:
  //    e.g. new Sentry.Integrations.Prisma({ client: prisma })
  // Performance Monitoring:
  tracesSampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE ?? "0.1"),
});

export default function handleDocumentRequestFunction(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let staticHandlerContext = remixContext.staticHandlerContext;
  let loaderHeaders = staticHandlerContext.loaderHeaders["*"];
  if (!loaderHeaders || loaderHeaders.get(gooeyGuiRouteHeader)) {
    let markup = renderToString(
      <RemixServer context={remixContext} url={request.url} />
    );

    responseHeaders.set("Content-Type", "text/html");

    return new Response("<!DOCTYPE html>" + markup, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  } else {
    let loaderData = staticHandlerContext.loaderData["*"];
    let originalData = loaderData && Buffer.from(loaderData, "base64");
    return new Response(originalData, {
      status: responseStatusCode,
      headers: loaderHeaders,
    });
  }
}
