import type { DataFunctionArgs, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { renderToString } from "react-dom/server";
import { gooeyGuiRouteHeader } from "~/consts";
import settings from "./settings";

if (settings.SENTRY_DSN) {
  Sentry.init({
    dsn: settings.SENTRY_DSN,
    // Integrations:
    //    e.g. new Sentry.Integrations.Prisma({ client: prisma })
    // Performance Monitoring:
    tracesSampleRate: settings.SENTRY_SAMPLE_RATE,
  });
}

export function handleError(error: unknown, { request }: DataFunctionArgs) {
  // ignore aborted requests
  if (request.signal.aborted) return;

  Sentry.captureRemixServerException(error, "remix.server", request);
}

export default function handleDocumentRequestFunction(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  try {
    let staticHandlerContext = remixContext.staticHandlerContext;
    let routeId = staticHandlerContext.matches[1]?.route.id;
    let loaderHeaders = staticHandlerContext.loaderHeaders[routeId];
    let loaderData = staticHandlerContext.loaderData[routeId];
    if (
      !loaderHeaders ||
      !loaderData ||
      loaderHeaders.get(gooeyGuiRouteHeader)
    ) {
      let markup = renderToString(
        <RemixServer context={remixContext} url={request.url} />
      );

      responseHeaders.set("Content-Type", "text/html");

      return new Response("<!DOCTYPE html>" + markup, {
        status: responseStatusCode,
        headers: responseHeaders,
      });
    } else {
      let { body, ...options } = loaderData;
      let buffer = body && Buffer.from(body, "base64");
      return new Response(buffer, options);
    }
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    throw error;
  }
}
