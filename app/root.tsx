import { captureRemixErrorBoundaryError } from "@sentry/remix";
import {
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { json, LinksFunction } from "@remix-run/node"; // Depends on the runtime you choose
import { cssBundleHref } from "@remix-run/css-bundle";
import React from "react";
import { globalProgressStyles, useGlobalProgress } from "~/global-progres-bar";
import { HydrationUtils } from "~/useHydrated";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  ...globalProgressStyles(),
];

// export env vars to the client
export async function loader() {
  return json({
    ENV: {
      SENTRY_DSN: process.env.SENTRY_DSN,
      SENTRY_SAMPLE_RATE: process.env.SENTRY_SAMPLE_RATE,
      SENTRY_RELEASE: process.env.SENTRY_RELEASE,
    },
  });
}

export default function App() {
  useGlobalProgress();
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <script src="https://kit.fontawesome.com/8af9787bd5.js" crossorigin="anonymous"></script>
      </head>
      <body>
        <div
          id="portal"
          style={{ position: "fixed", left: 0, top: 0, zIndex: 9999 }}
        />
        <HydrationUtils />
        <Outlet />
        <ScrollRestoration />
        <script
          // load client side env vars
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)};`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);

  // when true, this is what used to go to `CatchBoundary`
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <p>Status: {error.status}</p>
        <pre>{JSON.stringify(error.data)}</pre>
      </div>
    );
  }

  return (
    <div>
      <h1>Uh oh ...</h1>
      <p>Something went wrong.</p>
      <pre>{`${error}`}</pre>
    </div>
  );
}
