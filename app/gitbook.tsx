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

  const gitbookUrl = new URL(process.env["GITBOOK_SITE_URL"] || "https://gooey-ai.gitbook.io");  // remove this default later
  gitbookUrl.pathname = path.join(gitbookUrl.pathname, requestUrl.pathname, "/");
  gitbookUrl.search = requestUrl.search;
  const url = gitbookUrl.toString();

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
