import type { LoaderArgs } from "@remix-run/node";
import path from "path";

declare global {
  var htmlCaches: Record<string, string>;
  var promiseCaches: Record<string, Promise<string>>;
}

if (typeof global.htmlCaches === "undefined") {
  global.htmlCaches = {};
  global.promiseCaches = {};
}

export async function loader({ request }: LoaderArgs) {
  const requestUrl = new URL(request.url);

  const docsUrl = new URL(process.env["DOCS_SITE_URL"]!);
  docsUrl.pathname = path.join(docsUrl.pathname, requestUrl.pathname, "/");
  docsUrl.search = requestUrl.search;
  const url = docsUrl.toString();

  let html = global.htmlCaches[url];
  let promise = loadPage(url);
  if (!html) {
    html = await promise;
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

async function loadPage(url: string): Promise<string> {
  let promise = global.promiseCaches[url];
  if (!promise) {
    promise = _loadPage(url);
    global.promiseCaches[url] = promise;
  }
  try {
    const html = await promise;
    global.htmlCaches[url] = html;
    return html;
  } finally {
    delete global.promiseCaches[url];
  }
}

async function _loadPage(url: string): Promise<string> {
  let response = await fetch(url);
  return await response.text();
}
